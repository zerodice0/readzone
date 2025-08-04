/**
 * @name Next.js API Route Security Patterns
 * @description Detects common security vulnerabilities in Next.js API routes
 * @kind problem
 * @problem.severity error
 * @security
 * @precision high
 * @id readzone/nextjs-api-security
 * @tags security
 *       external/cwe/cwe-079
 *       external/cwe/cwe-089
 *       external/cwe/cwe-078
 */

import javascript

/**
 * Next.js API route handler functions
 */
class NextApiHandler extends Function {
  NextApiHandler() {
    // API route handlers in src/app/api/**/*.ts
    this.getFile().getRelativePath().matches("src/app/api/%") and
    // Export default function or named exports (GET, POST, etc.)
    (
      exists(ExportDefaultDeclaration exp | exp.getOperand() = this) or
      exists(ExportNamedDeclaration exp | exp.getOperand() = this) or
      exists(VariableDeclarator vd | 
        vd.getInit() = this and 
        vd.getBindingPattern().(Identifier).getName().regexpMatch("GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS")
      )
    )
  }
}

/**
 * Request parameter access that could be tainted
 */
class RequestParamAccess extends DataFlow::SourceNode {
  RequestParamAccess() {
    // req.query, req.body, req.params access
    exists(PropAccess pa |
      pa.getBase().(Identifier).getName() = "req" and
      pa.getPropertyName() in ["query", "body", "params", "headers"] and
      this.asExpr() = pa
    ) or
    // URL searchParams access
    exists(MethodCallExpr mce |
      mce.getReceiver().toString().matches("%searchParams%") and
      mce.getMethodName() in ["get", "getAll"] and
      this.asExpr() = mce
    )
  }
}

/**
 * Database query sinks that could be vulnerable to injection
 */
class DatabaseQuerySink extends DataFlow::SinkNode {
  DatabaseQuerySink() {
    // Prisma raw queries
    exists(MethodCallExpr mce |
      mce.getReceiver().toString().matches("%prisma%") and
      mce.getMethodName() in ["$queryRaw", "$executeRaw", "$queryRawUnsafe", "$executeRawUnsafe"] and
      this.asExpr() = mce.getArgument(0)
    ) or
    // Direct SQL execution
    exists(MethodCallExpr mce |
      mce.getMethodName() in ["query", "execute", "run"] and
      mce.getReceiver().toString().matches("%db%") and
      this.asExpr() = mce.getArgument(0)
    )
  }
}

/**
 * Response output sinks that could be vulnerable to XSS
 */
class ResponseOutputSink extends DataFlow::SinkNode {
  ResponseOutputSink() {
    // res.json(), res.send(), NextResponse.json()
    exists(MethodCallExpr mce |
      (
        mce.getReceiver().(Identifier).getName() = "res" and
        mce.getMethodName() in ["json", "send", "write", "end"]
      ) or
      (
        mce.getReceiver().toString().matches("%NextResponse%") and
        mce.getMethodName() in ["json", "text"]
      ) and
      this.asExpr() = mce.getArgument(0)
    )
  }
}

/**
 * Command execution sinks
 */
class CommandExecutionSink extends DataFlow::SinkNode {
  CommandExecutionSink() {
    // exec, spawn, execSync functions
    exists(CallExpr ce |
      ce.getCallee().(Identifier).getName() in ["exec", "execSync", "spawn", "spawnSync"] and
      this.asExpr() = ce.getArgument(0)
    ) or
    // child_process module calls
    exists(MethodCallExpr mce |
      mce.getReceiver().toString().matches("%child_process%") and
      mce.getMethodName() in ["exec", "execSync", "spawn", "spawnSync"] and
      this.asExpr() = mce.getArgument(0)
    )
  }
}

/**
 * File system access sinks
 */
class FileSystemSink extends DataFlow::SinkNode {
  FileSystemSink() {
    // fs operations that accept paths
    exists(MethodCallExpr mce |
      mce.getReceiver().toString().matches("%fs%") and
      mce.getMethodName() in [
        "readFile", "writeFile", "appendFile", "unlink", "rmdir", 
        "mkdir", "readdir", "stat", "lstat", "realpath", "readlink"
      ] and
      this.asExpr() = mce.getArgument(0)
    )
  }
}

// Query 1: SQL Injection in API routes
from NextApiHandler handler, RequestParamAccess source, DatabaseQuerySink sink, DataFlow::PathNode sourcePath, DataFlow::PathNode sinkPath
where
  DataFlow::flowPath(source, sink, sourcePath, sinkPath) and
  source.getContainer() = handler and
  sink.getContainer() = handler
select sink, sourcePath, sinkPath,
  "Potential SQL injection: user input $@ flows to database query $@.",
  sourcePath.getNode(), "user input",
  sinkPath.getNode(), "database query"

// Query 2: Cross-Site Scripting (XSS) in API responses
from NextApiHandler handler, RequestParamAccess source, ResponseOutputSink sink, DataFlow::PathNode sourcePath, DataFlow::PathNode sinkPath
where
  DataFlow::flowPath(source, sink, sourcePath, sinkPath) and
  source.getContainer() = handler and
  sink.getContainer() = handler and
  // Exclude cases where data is properly sanitized
  not exists(CallExpr sanitize |
    sanitize.getCallee().(Identifier).getName().regexpMatch("sanitize|escape|encode") and
    DataFlow::localFlow(DataFlow::valueNode(sanitize), sink)
  )
select sink, sourcePath, sinkPath,
  "Potential XSS: user input $@ flows to response output $@ without sanitization.",
  sourcePath.getNode(), "user input",
  sinkPath.getNode(), "response output"

// Query 3: Command Injection in API routes
from NextApiHandler handler, RequestParamAccess source, CommandExecutionSink sink, DataFlow::PathNode sourcePath, DataFlow::PathNode sinkPath
where
  DataFlow::flowPath(source, sink, sourcePath, sinkPath) and
  source.getContainer() = handler and
  sink.getContainer() = handler
select sink, sourcePath, sinkPath,
  "Potential command injection: user input $@ flows to command execution $@.",
  sourcePath.getNode(), "user input",
  sinkPath.getNode(), "command execution"

// Query 4: Path Traversal in file operations
from NextApiHandler handler, RequestParamAccess source, FileSystemSink sink, DataFlow::PathNode sourcePath, DataFlow::PathNode sinkPath
where
  DataFlow::flowPath(source, sink, sourcePath, sinkPath) and
  source.getContainer() = handler and
  sink.getContainer() = handler and
  // Exclude cases where path is properly validated
  not exists(CallExpr validate |
    validate.getCallee().(Identifier).getName().regexpMatch("resolve|normalize|validate.*[Pp]ath") and
    DataFlow::localFlow(DataFlow::valueNode(validate), sink)
  )
select sink, sourcePath, sinkPath,
  "Potential path traversal: user input $@ flows to file system operation $@ without validation.",
  sourcePath.getNode(), "user input",
  sinkPath.getNode(), "file system operation"

// Query 5: Missing authentication checks
from NextApiHandler handler
where
  not exists(CallExpr authCheck |
    authCheck.getContainer() = handler and
    (
      authCheck.getCallee().(Identifier).getName().regexpMatch("auth.*|verify.*|check.*") or
      authCheck.getCallee().(PropAccess).getPropertyName().regexpMatch("auth.*|verify.*|check.*") or
      exists(Identifier id | id.getName().matches("session") and id.getContainer() = handler)
    )
  ) and
  // Exclude public endpoints (GET requests for public data)
  not (
    handler.getName() = "GET" and
    exists(ReturnStmt ret |
      ret.getContainer() = handler and
      ret.getExpr().(CallExpr).getArgument(0).(ObjectExpr).getProperty("public") = any(Literal l | l.getValue() = "true")
    )
  )
select handler,
  "API route handler missing authentication check. Consider adding authentication verification."

// Query 6: Sensitive data exposure in error responses
from NextApiHandler handler, ThrowStmt throwStmt
where
  throwStmt.getContainer() = handler and
  exists(NewExpr err |
    err = throwStmt.getExpr() and
    err.getCallee().(Identifier).getName() = "Error" and
    exists(TemplateLiteral template |
      template = err.getArgument(0) and
      template.toString().regexpMatch(".*\\$\\{.*\\}.*") // Contains template expressions
    )
  )
select throwStmt,
  "Potential sensitive data exposure: error message contains dynamic content that may leak sensitive information."

// Query 7: Insecure direct object references
from NextApiHandler handler, RequestParamAccess source, MethodCallExpr findCall
where
  source.getContainer() = handler and
  findCall.getContainer() = handler and
  findCall.getReceiver().toString().matches("%prisma%") and
  findCall.getMethodName() in ["findUnique", "findFirst", "findMany"] and
  DataFlow::localFlow(source, DataFlow::valueNode(findCall.getArgument(0).(ObjectExpr).getProperty("where"))) and
  // Check if there's no ownership validation
  not exists(PropAccess ownerCheck |
    ownerCheck.getContainer() = handler and
    ownerCheck.getPropertyName() in ["userId", "ownerId", "createdBy", "authorId"] and
    DataFlow::localFlow(DataFlow::valueNode(ownerCheck), DataFlow::valueNode(findCall.getArgument(0)))
  )
select findCall,
  "Potential insecure direct object reference: database query uses user input $@ without ownership validation.",
  source, "user input"