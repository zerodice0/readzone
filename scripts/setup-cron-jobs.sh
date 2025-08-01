#!/bin/bash

# ReadZone Draft System Cron Jobs Setup Script
# Sets up automated cleanup and notification jobs for the draft system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
CRON_SECRET=${CRON_SECRET:-$(openssl rand -hex 32)}
BASE_URL=${NEXT_PUBLIC_BASE_URL:-"http://localhost:3000"}
LOG_DIR="/var/log/readzone"

echo -e "${GREEN}🚀 ReadZone Draft System Cron Jobs Setup${NC}"
echo "=================================="

# Create log directory
echo -e "${YELLOW}📁 Creating log directory...${NC}"
sudo mkdir -p "$LOG_DIR"
sudo chmod 755 "$LOG_DIR"

# Ensure cron secret is set
if [ -z "$CRON_SECRET" ]; then
    echo -e "${RED}❌ CRON_SECRET environment variable is required${NC}"
    echo "Please set CRON_SECRET in your .env file:"
    echo "CRON_SECRET=$(openssl rand -hex 32)"
    exit 1
fi

echo -e "${GREEN}✅ CRON_SECRET configured${NC}"

# Create crontab entries
CRONTAB_FILE="/tmp/readzone-cron"

cat > "$CRONTAB_FILE" << EOF
# ReadZone Draft System Cron Jobs
# Generated on $(date)

# Draft cleanup - daily at 2:00 AM
0 2 * * * curl -X POST -H "Authorization: Bearer $CRON_SECRET" -H "Content-Type: application/json" "$BASE_URL/api/cron/cleanup-drafts" >> "$LOG_DIR/cleanup-drafts.log" 2>&1

# Expiration notifications - daily at 9:00 AM
0 9 * * * curl -X POST -H "Authorization: Bearer $CRON_SECRET" -H "Content-Type: application/json" "$BASE_URL/api/cron/notify-expiring-drafts" >> "$LOG_DIR/notify-expiring-drafts.log" 2>&1

# System health check - every 6 hours
0 */6 * * * curl -s -H "Authorization: Bearer $CRON_SECRET" "$BASE_URL/api/admin/draft-monitor" | jq -r '.data.overview.healthScore' >> "$LOG_DIR/health-check.log" 2>&1

# Log rotation - weekly on Sunday at 3:00 AM
0 3 * * 0 find "$LOG_DIR" -name "*.log" -type f -mtime +30 -delete
EOF

# Install crontab
echo -e "${YELLOW}📅 Installing cron jobs...${NC}"
crontab "$CRONTAB_FILE"

# Clean up temporary file
rm "$CRONTAB_FILE"

# Create log rotation config
echo -e "${YELLOW}🔄 Setting up log rotation...${NC}"
sudo tee /etc/logrotate.d/readzone-drafts > /dev/null << EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
    postrotate
        # Restart cron if needed
        systemctl reload cron >/dev/null 2>&1 || true
    endscript
}
EOF

# Create monitoring script
echo -e "${YELLOW}📊 Creating monitoring script...${NC}"
cat > "/usr/local/bin/readzone-draft-monitor" << EOF
#!/bin/bash
# ReadZone Draft System Monitor

BASE_URL="$BASE_URL"
CRON_SECRET="$CRON_SECRET"
LOG_FILE="$LOG_DIR/monitor.log"

# Function to log with timestamp
log_message() {
    echo "[\$(date '+%Y-%m-%d %H:%M:%S')] \$1" >> "\$LOG_FILE"
}

# Check API health
check_api_health() {
    response=\$(curl -s -w "%{http_code}" -H "Authorization: Bearer \$CRON_SECRET" "\$BASE_URL/api/admin/draft-monitor" -o /tmp/health_response.json)
    
    if [ "\$response" = "200" ]; then
        health_score=\$(jq -r '.data.overview.healthScore' /tmp/health_response.json)
        log_message "API Health Check: OK (Score: \$health_score)"
        
        if [ "\$health_score" -lt 70 ]; then
            log_message "WARNING: Health score below 70: \$health_score"
            # Send alert (implement email/slack notification here)
        fi
    else
        log_message "ERROR: API Health Check failed with status \$response"
    fi
    
    rm -f /tmp/health_response.json
}

# Check draft statistics
check_draft_stats() {
    response=\$(curl -s -H "Authorization: Bearer \$CRON_SECRET" "\$BASE_URL/api/admin/draft-monitor")
    
    if [ \$? -eq 0 ]; then
        expired_drafts=\$(echo "\$response" | jq -r '.data.statistics.drafts.expiredDrafts')
        sync_candidates=\$(echo "\$response" | jq -r '.data.statistics.drafts.syncCandidates')
        
        log_message "Draft Stats - Expired: \$expired_drafts, Sync Pending: \$sync_candidates"
        
        if [ "\$expired_drafts" -gt 100 ]; then
            log_message "WARNING: Too many expired drafts: \$expired_drafts"
        fi
        
        if [ "\$sync_candidates" -gt 50 ]; then
            log_message "WARNING: Too many sync candidates: \$sync_candidates"
        fi
    else
        log_message "ERROR: Failed to fetch draft statistics"
    fi
}

# Run checks
log_message "Starting draft system monitoring"
check_api_health
check_draft_stats
log_message "Monitoring completed"
EOF

# Make monitoring script executable
sudo chmod +x /usr/local/bin/readzone-draft-monitor

# Test cron jobs
echo -e "${YELLOW}🧪 Testing cron job endpoints...${NC}"

# Test cleanup endpoint
echo "Testing cleanup endpoint..."
cleanup_response=$(curl -s -w "%{http_code}" -X POST \
    -H "Authorization: Bearer $CRON_SECRET" \
    -H "Content-Type: application/json" \
    -d '{"dryRun": true}' \
    "$BASE_URL/api/cron/cleanup-drafts" \
    -o /tmp/cleanup_test.json)

if [ "$cleanup_response" = "200" ]; then
    echo -e "${GREEN}✅ Cleanup endpoint test passed${NC}"
    jq -r '.data.message' /tmp/cleanup_test.json
else
    echo -e "${RED}❌ Cleanup endpoint test failed: $cleanup_response${NC}"
    cat /tmp/cleanup_test.json
fi

# Test notification endpoint
echo "Testing notification endpoint..."
notification_response=$(curl -s -w "%{http_code}" \
    -H "Authorization: Bearer $CRON_SECRET" \
    "$BASE_URL/api/cron/notify-expiring-drafts" \
    -o /tmp/notification_test.json)

if [ "$notification_response" = "200" ]; then
    echo -e "${GREEN}✅ Notification endpoint test passed${NC}"
    jq -r '.data.recommendations' /tmp/notification_test.json
else
    echo -e "${RED}❌ Notification endpoint test failed: $notification_response${NC}"
    cat /tmp/notification_test.json
fi

# Test monitoring endpoint
echo "Testing monitoring endpoint..."
monitor_response=$(curl -s -w "%{http_code}" \
    -H "Authorization: Bearer $CRON_SECRET" \
    "$BASE_URL/api/admin/draft-monitor" \
    -o /tmp/monitor_test.json)

if [ "$monitor_response" = "200" ]; then
    echo -e "${GREEN}✅ Monitoring endpoint test passed${NC}"
    echo "Health Score: $(jq -r '.data.overview.healthScore' /tmp/monitor_test.json)"
else
    echo -e "${RED}❌ Monitoring endpoint test failed: $monitor_response${NC}"
    cat /tmp/monitor_test.json
fi

# Clean up test files
rm -f /tmp/cleanup_test.json /tmp/notification_test.json /tmp/monitor_test.json

# Display installed cron jobs
echo -e "${GREEN}📋 Installed cron jobs:${NC}"
crontab -l | grep -A 10 "ReadZone Draft System"

echo ""
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo ""
echo "Configuration:"
echo "  Base URL: $BASE_URL"
echo "  Log Directory: $LOG_DIR"
echo "  Cron Secret: $(echo $CRON_SECRET | sed 's/./*/g' | sed 's/\*\*\*\*/.../')" # Mask secret
echo ""
echo "Next steps:"
echo "1. Verify cron jobs are working: crontab -l"
echo "2. Monitor logs: tail -f $LOG_DIR/*.log"
echo "3. Run manual health check: /usr/local/bin/readzone-draft-monitor"
echo "4. Check system status: $BASE_URL/api/admin/draft-monitor"
echo ""
echo -e "${YELLOW}⚠️  Make sure CRON_SECRET is set in your production environment variables!${NC}"