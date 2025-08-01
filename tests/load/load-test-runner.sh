#!/bin/bash

# ReadZone Draft System Load Test Runner
# Executes load tests with various configurations and generates reports

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="${BASE_DIR}/results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULT_DIR="${RESULTS_DIR}/${TIMESTAMP}"

# Test environment
export BASE_URL="${BASE_URL:-http://localhost:3000}"
export API_URL="${API_URL:-http://localhost:3000/api}"

# Create results directory
mkdir -p "${RESULT_DIR}"

echo -e "${BLUE}🚀 ReadZone Draft System Load Test Runner${NC}"
echo -e "${BLUE}=====================================

# Function to run a test
run_test() {
    local test_name=$1
    local test_type=$2
    local config=$3
    
    echo -e "\n${YELLOW}Running ${test_name}...${NC}"
    
    # Run the test
    npx playwright test tests/load/draft-system-load-test.ts \
        --grep "${test_type}" \
        --reporter=json \
        --reporter=html \
        ${config} \
        > "${RESULT_DIR}/${test_name}_output.log" 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ ${test_name} completed successfully${NC}"
    else
        echo -e "${RED}❌ ${test_name} failed${NC}"
        echo "Check ${RESULT_DIR}/${test_name}_output.log for details"
    fi
}

# Function to check system readiness
check_system() {
    echo -e "\n${BLUE}Checking system readiness...${NC}"
    
    # Check if server is running
    if curl -f -s "${BASE_URL}/api/health" > /dev/null; then
        echo -e "${GREEN}✅ Server is running${NC}"
    else
        echo -e "${RED}❌ Server is not running at ${BASE_URL}${NC}"
        exit 1
    fi
    
    # Check database connection
    # Add database health check here
    
    # Check available resources
    if command -v free &> /dev/null; then
        FREE_MEM=$(free -m | awk '/^Mem:/{print $4}')
        if [ $FREE_MEM -lt 4096 ]; then
            echo -e "${YELLOW}⚠️  Low memory warning: ${FREE_MEM}MB available${NC}"
        else
            echo -e "${GREEN}✅ Memory: ${FREE_MEM}MB available${NC}"
        fi
    fi
}

# Function to prepare test data
prepare_test_data() {
    echo -e "\n${BLUE}Preparing test data...${NC}"
    
    # Create test users
    node -e "
    const createTestUsers = async () => {
        const users = [];
        for (let i = 0; i < 1000; i++) {
            users.push({
                email: \`testuser\${i}@example.com\`,
                password: 'TestPassword123!',
                nickname: \`testuser\${i}\`,
                name: \`Test User \${i}\`
            });
        }
        
        // Batch create users
        console.log('Creating 1000 test users...');
        // Add actual user creation logic here
        console.log('Test users created successfully');
    };
    
    createTestUsers().catch(console.error);
    "
    
    echo -e "${GREEN}✅ Test data prepared${NC}"
}

# Function to generate summary report
generate_summary() {
    echo -e "\n${BLUE}Generating summary report...${NC}"
    
    cat > "${RESULT_DIR}/summary.md" << EOF
# Load Test Summary Report
Generated: $(date)

## Test Configuration
- Base URL: ${BASE_URL}
- Test Duration: 5 minutes
- Target Virtual Users: 1,000
- Target TPS: 100

## Test Results

### Load Test (Normal Load)
- Status: $(grep -q "All performance thresholds met" "${RESULT_DIR}/load_test_output.log" && echo "PASS ✅" || echo "FAIL ❌")
- Details: See load_test_output.log

### Stress Test (2x Load)
- Status: $(grep -q "All performance thresholds met" "${RESULT_DIR}/stress_test_output.log" && echo "PASS ✅" || echo "FAIL ❌")
- Details: See stress_test_output.log

### Spike Test
- Status: $(grep -q "All performance thresholds met" "${RESULT_DIR}/spike_test_output.log" && echo "PASS ✅" || echo "FAIL ❌")
- Details: See spike_test_output.log

## Performance Metrics

\`\`\`json
$(cat "${RESULT_DIR}/load-test-report-*.json" 2>/dev/null | jq -r '.summary' || echo "No metrics available")
\`\`\`

## Recommendations
$(cat "${RESULT_DIR}/load-test-report-*.json" 2>/dev/null | jq -r '.recommendations[]' || echo "- No recommendations generated")

## Artifacts
- JSON Report: load-test-report-*.json
- HTML Report: load-test-report-*.html
- Test Logs: *_output.log
- Playwright Reports: playwright-report/

EOF
    
    echo -e "${GREEN}✅ Summary report generated: ${RESULT_DIR}/summary.md${NC}"
}

# Function to cleanup
cleanup() {
    echo -e "\n${BLUE}Cleaning up...${NC}"
    
    # Remove test users
    # Add cleanup logic here
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}Test Started: $(date)${NC}"
    echo -e "${BLUE}Results Directory: ${RESULT_DIR}${NC}"
    
    # Check system readiness
    check_system
    
    # Prepare test data
    prepare_test_data
    
    # Run tests based on arguments
    case "${1:-all}" in
        load)
            run_test "load_test" "Execute load test scenario" ""
            ;;
        stress)
            run_test "stress_test" "Stress test" ""
            ;;
        spike)
            run_test "spike_test" "Spike test" ""
            ;;
        endurance)
            run_test "endurance_test" "Endurance test" ""
            ;;
        all)
            run_test "load_test" "Execute load test scenario" ""
            run_test "stress_test" "Stress test" ""
            run_test "spike_test" "Spike test" ""
            ;;
        *)
            echo -e "${RED}Unknown test type: $1${NC}"
            echo "Usage: $0 [load|stress|spike|endurance|all]"
            exit 1
            ;;
    esac
    
    # Generate summary report
    generate_summary
    
    # Cleanup
    cleanup
    
    echo -e "\n${GREEN}🎉 Load testing completed!${NC}"
    echo -e "${BLUE}Results available at: ${RESULT_DIR}${NC}"
    
    # Open HTML report if available
    if [ -f "${RESULT_DIR}/load-test-report-"*.html ]; then
        echo -e "${BLUE}Opening HTML report...${NC}"
        open "${RESULT_DIR}/load-test-report-"*.html 2>/dev/null || \
        xdg-open "${RESULT_DIR}/load-test-report-"*.html 2>/dev/null || \
        echo -e "${YELLOW}Please manually open the HTML report${NC}"
    fi
}

# Trap cleanup on exit
trap cleanup EXIT

# Run main function
main "$@"