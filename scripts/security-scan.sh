#!/bin/bash

# ReadZone Security Scan Script
# This script performs comprehensive security scanning on the ReadZone application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create security reports directory
REPORTS_DIR="./security-reports"
mkdir -p "$REPORTS_DIR"

print_status "Starting comprehensive security scan for ReadZone..."

# 1. Dependency Vulnerability Scan
print_status "Running dependency vulnerability scan..."

if command -v npm &> /dev/null; then
    print_status "Checking backend dependencies..."
    cd readzone-backend
    
    # Create audit report
    npm audit --audit-level moderate --json > "../$REPORTS_DIR/backend-audit.json" 2>/dev/null || true
    npm audit --audit-level moderate > "../$REPORTS_DIR/backend-audit.txt" 2>/dev/null || true
    
    # Check for high/critical vulnerabilities
    HIGH_VULN=$(npm audit --audit-level high --json 2>/dev/null | jq -r '.metadata.vulnerabilities.high // 0')
    CRITICAL_VULN=$(npm audit --audit-level critical --json 2>/dev/null | jq -r '.metadata.vulnerabilities.critical // 0')
    
    if [ "$HIGH_VULN" -gt 0 ] || [ "$CRITICAL_VULN" -gt 0 ]; then
        print_error "Found $HIGH_VULN high and $CRITICAL_VULN critical vulnerabilities in backend"
    else
        print_success "No high or critical vulnerabilities found in backend"
    fi
    
    cd ..
    
    print_status "Checking frontend dependencies..."
    cd readzone-frontend
    
    npm audit --audit-level moderate --json > "../$REPORTS_DIR/frontend-audit.json" 2>/dev/null || true
    npm audit --audit-level moderate > "../$REPORTS_DIR/frontend-audit.txt" 2>/dev/null || true
    
    # Check for high/critical vulnerabilities
    HIGH_VULN_FE=$(npm audit --audit-level high --json 2>/dev/null | jq -r '.metadata.vulnerabilities.high // 0')
    CRITICAL_VULN_FE=$(npm audit --audit-level critical --json 2>/dev/null | jq -r '.metadata.vulnerabilities.critical // 0')
    
    if [ "$HIGH_VULN_FE" -gt 0 ] || [ "$CRITICAL_VULN_FE" -gt 0 ]; then
        print_error "Found $HIGH_VULN_FE high and $CRITICAL_VULN_FE critical vulnerabilities in frontend"
    else
        print_success "No high or critical vulnerabilities found in frontend"
    fi
    
    cd ..
else
    print_warning "npm not found, skipping dependency scan"
fi

# 2. Secret Scanning
print_status "Scanning for secrets and sensitive data..."

if command -v git &> /dev/null; then
    # Check for common secret patterns
    SECRET_PATTERNS=(
        "password\s*=\s*['\"][^'\"]*['\"]"
        "api[_-]?key\s*=\s*['\"][^'\"]*['\"]"
        "secret\s*=\s*['\"][^'\"]*['\"]"
        "token\s*=\s*['\"][^'\"]*['\"]"
        "private[_-]?key\s*=\s*['\"][^'\"]*['\"]"
        "AKIA[0-9A-Z]{16}"  # AWS Access Key
        "mongodb://[^/]*:[^@]*@"  # MongoDB connection string
        "postgres://[^/]*:[^@]*@"  # PostgreSQL connection string
    )
    
    echo "Scanning for secrets..." > "$REPORTS_DIR/secret-scan.txt"
    
    for pattern in "${SECRET_PATTERNS[@]}"; do
        print_status "Checking for pattern: $pattern"
        git grep -nE "$pattern" -- '*.js' '*.ts' '*.json' '*.env*' '*.config*' 2>/dev/null >> "$REPORTS_DIR/secret-scan.txt" || true
    done
    
    # Check .env files specifically
    find . -name ".env*" -not -name ".env.example" -exec echo "Found environment file: {}" \; >> "$REPORTS_DIR/secret-scan.txt"
    
    print_success "Secret scan completed, check $REPORTS_DIR/secret-scan.txt"
else
    print_warning "git not found, skipping secret scan"
fi

# 3. Code Quality Security Scan
print_status "Running static code analysis..."

# Create a simple security linting report
{
    echo "Security Code Analysis Report"
    echo "Generated on: $(date)"
    echo "================================"
    echo ""
    
    # Check for common security anti-patterns
    echo "Checking for eval() usage..."
    grep -rn "eval(" --include="*.js" --include="*.ts" . || echo "No eval() usage found"
    echo ""
    
    echo "Checking for innerHTML usage..."
    grep -rn "innerHTML" --include="*.js" --include="*.ts" . || echo "No innerHTML usage found"
    echo ""
    
    echo "Checking for document.write usage..."
    grep -rn "document.write" --include="*.js" --include="*.ts" . || echo "No document.write usage found"
    echo ""
    
    echo "Checking for SQL concatenation..."
    grep -rn "SELECT.*+\|INSERT.*+\|UPDATE.*+\|DELETE.*+" --include="*.js" --include="*.ts" . || echo "No SQL concatenation found"
    echo ""
    
    echo "Checking for hardcoded URLs..."
    grep -rn "http://\|https://" --include="*.js" --include="*.ts" --exclude-dir=node_modules . | head -20 || echo "No hardcoded URLs found"
    
} > "$REPORTS_DIR/code-analysis.txt"

print_success "Code analysis completed"

# 4. Docker Security Scan
if command -v docker &> /dev/null; then
    print_status "Scanning Docker configuration..."
    
    {
        echo "Docker Security Configuration Report"
        echo "Generated on: $(date)"
        echo "====================================="
        echo ""
        
        # Check Dockerfile security
        echo "Checking Dockerfile security..."
        find . -name "Dockerfile*" -exec echo "Analyzing: {}" \; -exec cat {} \;
        echo ""
        
        # Check for security best practices
        echo "Security recommendations:"
        echo "- Ensure non-root user is used"
        echo "- Check for latest base images"
        echo "- Verify minimal package installation"
        echo "- Check for proper secret handling"
        
    } > "$REPORTS_DIR/docker-security.txt"
    
    print_success "Docker security scan completed"
else
    print_warning "Docker not found, skipping Docker security scan"
fi

# 5. File Permission Scan
print_status "Checking file permissions..."

{
    echo "File Permission Security Report"
    echo "Generated on: $(date)"
    echo "==============================="
    echo ""
    
    # Check for overly permissive files
    echo "Files with world-writable permissions:"
    find . -type f -perm -002 | grep -v ".git" || echo "No world-writable files found"
    echo ""
    
    # Check for executable files
    echo "Executable files:"
    find . -type f -executable | grep -v ".git" | grep -v "node_modules" | head -20
    echo ""
    
    # Check for hidden files
    echo "Hidden files (first 20):"
    find . -name ".*" -type f | grep -v ".git" | head -20
    
} > "$REPORTS_DIR/file-permissions.txt"

print_success "File permission scan completed"

# 6. SSL/TLS Configuration Check
print_status "Checking SSL/TLS configuration..."

{
    echo "SSL/TLS Security Configuration Report"
    echo "Generated on: $(date)"
    echo "======================================"
    echo ""
    
    # Check nginx SSL configuration if exists
    if [ -f "readzone-frontend/nginx.conf" ]; then
        echo "Nginx SSL Configuration:"
        grep -A 10 -B 5 "ssl\|tls" readzone-frontend/nginx.conf || echo "No SSL configuration found"
    fi
    
    echo ""
    echo "Security Headers Configuration:"
    grep -n "header\|Header" readzone-frontend/nginx.conf readzone-frontend/default.conf 2>/dev/null || echo "No security headers found"
    
} > "$REPORTS_DIR/ssl-config.txt"

print_success "SSL/TLS configuration check completed"

# 7. Environment Configuration Security
print_status "Checking environment configuration security..."

{
    echo "Environment Configuration Security Report"
    echo "Generated on: $(date)"
    echo "=========================================="
    echo ""
    
    # Check for .env files
    echo "Environment files found:"
    find . -name ".env*" -type f
    echo ""
    
    # Check for environment variable usage
    echo "Environment variable references:"
    grep -rn "process\.env\|process.env" --include="*.js" --include="*.ts" . | head -20 || echo "No environment variables found"
    echo ""
    
    # Check for sensitive configuration
    echo "Potential sensitive configuration:"
    grep -rn "password\|secret\|key\|token" --include="*.json" --include="*.yml" --include="*.yaml" . | grep -v node_modules | head -20 || echo "No sensitive configuration found"
    
} > "$REPORTS_DIR/env-config.txt"

print_success "Environment configuration check completed"

# 8. Generate Security Summary Report
print_status "Generating security summary report..."

{
    echo "ReadZone Security Scan Summary"
    echo "Generated on: $(date)"
    echo "=============================="
    echo ""
    
    echo "Scan Components:"
    echo "✓ Dependency vulnerability scan"
    echo "✓ Secret scanning"
    echo "✓ Static code analysis"
    echo "✓ Docker security scan"
    echo "✓ File permission check"
    echo "✓ SSL/TLS configuration"
    echo "✓ Environment configuration"
    echo ""
    
    echo "Report Files Generated:"
    ls -la "$REPORTS_DIR"/*.txt
    echo ""
    
    echo "Critical Actions Required:"
    echo "1. Review all vulnerability reports"
    echo "2. Update dependencies with security issues"
    echo "3. Remove any detected secrets"
    echo "4. Fix file permission issues"
    echo "5. Implement missing security headers"
    echo ""
    
    echo "Next Steps:"
    echo "1. Run 'npm audit fix' to auto-fix vulnerabilities"
    echo "2. Review and rotate any exposed secrets"
    echo "3. Update base Docker images"
    echo "4. Implement additional security controls"
    echo "5. Schedule regular security scans"
    
} > "$REPORTS_DIR/security-summary.txt"

print_success "Security scan completed successfully!"
print_status "Reports generated in: $REPORTS_DIR/"

# Display summary
echo ""
echo "==============================================="
echo "           SECURITY SCAN SUMMARY"
echo "==============================================="
cat "$REPORTS_DIR/security-summary.txt"
echo "==============================================="

# Set exit code based on findings
if [ -s "$REPORTS_DIR/secret-scan.txt" ] && grep -q "Found" "$REPORTS_DIR/secret-scan.txt"; then
    print_error "Secrets detected! Please review and remediate."
    exit 1
fi

if [ "$HIGH_VULN" -gt 0 ] || [ "$CRITICAL_VULN" -gt 0 ] || [ "$HIGH_VULN_FE" -gt 0 ] || [ "$CRITICAL_VULN_FE" -gt 0 ]; then
    print_error "High or critical vulnerabilities detected! Please update dependencies."
    exit 1
fi

print_success "Security scan completed with no critical issues detected."
exit 0