# ReadZone Draft System - Load Testing Guide

## Overview

This directory contains comprehensive load testing suite for the ReadZone draft system, designed to validate performance requirements specified in the PRD.

## Performance Requirements (PRD)

- **Concurrent Users**: 1,000
- **Draft Save TPS**: 100/second  
- **Response Times**:
  - Draft Save: <500ms
  - Draft List: <1s
  - Draft Restore: <2s
  - Book Sync: <1s
- **Success Rate**: >99.9%
- **Data Limits**:
  - User Draft Limit: 5 drafts
  - Draft Size: 1MB max

## Test Types

### 1. Load Test (Normal Operation)
- Simulates expected production load
- 1,000 virtual users over 5 minutes
- Validates all performance thresholds

### 2. Stress Test (2x Load)
- Double the normal load to find breaking point
- 2,000 virtual users
- Identifies system limits

### 3. Spike Test
- Sudden load increase from 100 to 3,000 users
- Tests elastic scaling and recovery
- Measures response degradation

### 4. Endurance Test
- Sustained load for 1 hour
- Detects memory leaks and resource exhaustion
- 500 concurrent users

## Quick Start

### Prerequisites

```bash
# Install dependencies
npm install -D @playwright/test

# Ensure server is running
npm run dev

# Set environment variables
export BASE_URL=http://localhost:3000
export API_URL=http://localhost:3000/api
```

### Running Tests

```bash
# Run all load tests
./load-test-runner.sh all

# Run specific test type
./load-test-runner.sh load    # Normal load test
./load-test-runner.sh stress  # Stress test
./load-test-runner.sh spike   # Spike test
./load-test-runner.sh endurance # Endurance test

# Run with custom configuration
BASE_URL=https://staging.readzone.com ./load-test-runner.sh load
```

## Test Scenarios

### Virtual User Behavior

Each virtual user simulates realistic behavior patterns:

1. **Create and Save Draft** (40%)
   - Create new draft
   - Auto-save every 30 seconds
   - Simulate typing delays

2. **List and Restore Draft** (30%)
   - View draft list
   - Select and restore draft
   - Continue editing

3. **Multiple Draft Updates** (20%)
   - Create multiple drafts (up to 5)
   - Switch between drafts
   - Update content

4. **Concurrent Operations** (10%)
   - Simultaneous save/list operations
   - Test optimistic locking

## Performance Monitoring

### Real-time Dashboard

The test suite includes a real-time monitoring dashboard that displays:

- Current TPS and response times
- Success/error rates
- P50/P95/P99 latency percentiles
- System resource usage
- Active alerts

Access dashboard during test execution:
```
http://localhost:3001
```

### Metrics Collected

- **Operation Metrics**:
  - Response time distribution
  - Success/failure counts
  - Transactions per second
  - Error messages and types

- **System Metrics**:
  - CPU usage
  - Memory consumption
  - Database connections
  - Network throughput

## Test Results

### Output Files

After test completion, find results in `results/[timestamp]/`:

- `summary.md` - Executive summary
- `load-test-report-*.json` - Detailed metrics
- `load-test-report-*.html` - Visual report
- `*_output.log` - Test execution logs
- `playwright-report/` - Playwright HTML report

### Success Criteria

Tests pass when ALL conditions are met:

✅ Draft save P95 < 500ms  
✅ Draft list P95 < 1000ms  
✅ Draft restore P95 < 2000ms  
✅ Book sync P95 < 1000ms  
✅ Success rate ≥ 99.9%  
✅ TPS ≥ 100 for draft saves  

## Troubleshooting

### Common Issues

1. **"Server is not running"**
   - Ensure dev server is running: `npm run dev`
   - Check BASE_URL environment variable

2. **"Low memory warning"**
   - Increase available memory
   - Reduce virtual user count
   - Run tests sequentially

3. **"Login failed"**
   - Ensure test users exist in database
   - Check authentication configuration
   - Verify API endpoints

4. **Performance degradation**
   - Check database indexes
   - Monitor connection pool
   - Review query optimization

### Debug Mode

Enable detailed logging:
```bash
DEBUG=* ./load-test-runner.sh load
```

View real-time logs:
```bash
tail -f results/latest/*_output.log
```

## Optimization Tips

### Before Running Tests

1. **Database Optimization**:
   ```sql
   -- Ensure indexes are in place
   ANALYZE review_drafts;
   ```

2. **Connection Pool**:
   ```javascript
   // Increase pool size for load testing
   connectionLimit: 50
   ```

3. **Resource Allocation**:
   - Close unnecessary applications
   - Disable development tools
   - Use production build

### Interpreting Results

- **High P99 vs P95**: Indicates outliers, check for:
  - Garbage collection pauses
  - Database lock contention
  - Network latency spikes

- **Gradual performance degradation**: 
  - Memory leaks
  - Connection pool exhaustion
  - Cache invalidation issues

- **Sudden failures at threshold**:
  - Rate limiting triggered
  - Resource limits reached
  - Cascading failures

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Load Test
on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: ./tests/load/load-test-runner.sh load
      - uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: tests/load/results/
```

## Best Practices

1. **Baseline Testing**:
   - Run tests on known-good version
   - Compare results after changes
   - Track performance trends

2. **Realistic Data**:
   - Use production-like content sizes
   - Simulate actual user patterns
   - Include edge cases

3. **Incremental Load**:
   - Start with small user count
   - Gradually increase load
   - Identify breaking points

4. **Regular Testing**:
   - Run after significant changes
   - Schedule nightly tests
   - Monitor long-term trends

## Contact & Support

For questions or issues:
- Create GitHub issue
- Check existing test results
- Review PRD requirements

---

Last Updated: 2025-01-31