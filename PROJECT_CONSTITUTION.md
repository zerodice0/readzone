# ReadZone Project Constitution

> Development principles and operational guidelines for AI-assisted development in the ReadZone project.

## Core Development Principles

### P-01: Code Quality Over Configuration

**Principle**: Focus development efforts on functional correctness and business logic rather than tooling configuration.

**Rationale**: Configuration management has significant project-wide impact and requires careful human review. AI agents should concentrate on implementing features correctly rather than modifying project infrastructure.

**Practice**:

- Prioritize fixing actual code issues (type errors, logic bugs, security vulnerabilities)
- Avoid modifying linting, formatting, or build configuration
- Report configuration issues to humans for deliberate resolution

---

### P-02: Linter Configuration Immutability

**Principle**: AI agents must never modify linting or formatting configuration files.

**Rationale**:

- Linter configuration affects entire codebase consistency
- Configuration changes require team consensus and review
- Resolver/plugin issues often indicate systemic problems requiring architectural review

**Protected Files**:

- `.eslintrc.*`, `eslint.config.*`, `.eslintignore`
- `.prettierrc.*`, `.prettierignore`
- `lint-staged` configuration in `package.json`
- `.husky/*` pre-commit hooks

**AI Agent Behavior When Linter Errors Occur**:

1. ✅ **DO**: Report the specific error with full context
   - Error type and affected rules
   - Files and line numbers involved
   - Whether code is functionally correct (compiles, tests pass)

2. ✅ **DO**: Provide actionable recommendations
   - If code is correct: suggest `git commit --no-verify` with rationale
   - If code has issues: fix the actual code problems
   - Recommend dedicated configuration review session

3. ❌ **DON'T**: Attempt to fix resolver errors
4. ❌ **DON'T**: Modify ESLint plugin settings
5. ❌ **DON'T**: Add `eslint-disable` comments without user approval
6. ❌ **DON'T**: Spend time debugging linter configuration

**Documentation Requirements**:

- If `--no-verify` is used, document bypass reason in commit message
- Flag configuration issues for follow-up in separate PR

---

### P-03: Test-Driven Quality Assurance

**Principle**: Functional correctness is validated through comprehensive testing, not linter compliance.

**Rationale**: Tests verify business logic and behavior; linters check style and patterns. If tests pass and code compiles, the implementation is likely correct regardless of linter warnings.

**Quality Hierarchy** (in order of importance):

1. Functional tests pass (unit, integration, E2E)
2. TypeScript compilation succeeds
3. Code review approval
4. Linter compliance

**Practice**:

- Always run tests before considering implementation complete
- Treat test failures as blocking issues
- Treat linter errors as non-blocking suggestions (unless they indicate actual code problems)

---

### P-04: Progressive Problem Resolution

**Principle**: Address issues in order of impact and complexity.

**Resolution Priority**:

1. **Critical**: Security vulnerabilities, data loss risks
2. **High**: Test failures, type errors, runtime errors
3. **Medium**: Code quality issues, performance problems
4. **Low**: Style inconsistencies, minor refactoring opportunities
5. **Deferred**: Configuration tuning, tooling updates

**Practice**:

- Resolve higher-priority issues before lower-priority ones
- Don't let low-priority issues block progress on high-priority work
- Document deferred issues for future resolution

---

### P-05: Transparent Communication

**Principle**: AI agents must clearly communicate blockers, limitations, and recommendations.

**Communication Requirements**:

- Explain _why_ something can't be done (not just that it can't)
- Provide alternatives or workarounds when blocked
- Escalate configuration issues rather than attempting fixes
- Document all assumptions and decisions

---

## Implementation Guidelines

### When Encountering Linter Errors

```markdown
## Linter Error Report

**Error Type**: [Resolver/Plugin/Rule error]
**Affected Files**: [List files]
**Error Details**: [Paste error message]

**Code Status**:

- ✅ TypeScript compiles successfully
- ✅ All tests pass (X/X)
- ✅ Server runs without errors
- ✅ Functionality verified manually

**Recommendation**:
This is a linter configuration issue, not a code quality problem.
Suggest proceeding with `git commit --no-verify` and addressing
linter configuration in a dedicated session.

**Next Steps**:

1. User approves `--no-verify` approach
2. Create issue to review ESLint configuration
3. Proceed with development workflow
```

### Commit Message Template (When Using --no-verify)

```
feat: [feature description]

[Implementation details]

Note: Committed with --no-verify due to ESLint resolver error
(typescript with invalid interface loaded as resolver).
Code is functionally correct - tests passing, TypeScript compiles.
Linter configuration review tracked in issue #XXX.
```

---

## Continuous Improvement

This constitution is a living document. As the project evolves and new patterns emerge, these principles should be reviewed and updated through team consensus.

**Last Updated**: 2025-11-06
**Maintained By**: Development Team
