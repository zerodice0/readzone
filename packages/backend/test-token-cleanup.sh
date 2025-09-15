#!/bin/bash

# =============================================================================
# ReadZone Token Cleanup Testing Script - Enhanced Edition
# 
# 토큰 정리 시스템 테스트를 위한 향상된 스크립트입니다.
# 수동 트리거 엔드포인트를 호출하여 정리 기능을 즉시 실행하고
# 상세한 결과 및 정책 정보를 확인할 수 있습니다.
#
# ## 토큰 정리 정책 (Token Cleanup Policy)
# ┌─────────────────┬──────────────┬─────────────────────────────────────┐
# │ 토큰 유형        │ 보관 기간     │ 정리 기준                            │
# ├─────────────────┼──────────────┼─────────────────────────────────────┤
# │ 만료된 토큰      │ 7일          │ expiresAt이 7일 이전인 토큰         │
# │ 취소된 토큰      │ 48시간       │ isRevoked=true, issuedAt이 48시간 전 │
# └─────────────────┴──────────────┴─────────────────────────────────────┘
#
# ## 로그 및 백업
# - 삭제된 토큰 정보는 JSON 파일로 자동 백업됩니다
# - 백업 파일 위치: logs/token-cleanup/cleanup-YYYY-MM-DD_HH-mm-ss.json
# - 실수로 삭제된 토큰 정보의 수동 복구 가능
# =============================================================================

# 컬러 출력 설정
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# 기본 설정
BASE_URL="http://localhost:3001"
AUTH_ENDPOINT="/api/auth/trigger-cleanup"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# 헤더 출력
echo -e "${BLUE}========================================================${NC}"
echo -e "${BLUE}   ReadZone Token Cleanup Test Script - Enhanced${NC}"
echo -e "${BLUE}========================================================${NC}"
echo -e "${YELLOW}Timestamp: ${TIMESTAMP}${NC}"
echo -e "${YELLOW}Target URL: ${BASE_URL}${AUTH_ENDPOINT}${NC}"
echo ""

# 정책 정보 출력
echo -e "${PURPLE}📋 토큰 정리 정책 (Cleanup Policy):${NC}"
echo -e "${YELLOW}   • 만료된 토큰: expiresAt이 현재시간 - 7일 이전${NC}"
echo -e "${YELLOW}   • 취소된 토큰: isRevoked=true, issuedAt이 현재시간 - 48시간 이전${NC}"
echo -e "${YELLOW}   • 백업 파일: logs/token-cleanup/cleanup-*.json${NC}"
echo ""

# 서버 상태 확인
echo -e "${PURPLE}[1/4] 서버 상태 확인 중...${NC}"
if curl -s --connect-timeout 5 "${BASE_URL}/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 서버가 실행 중입니다.${NC}"
else
    echo -e "${RED}❌ 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.${NC}"
    echo -e "${YELLOW}💡 다음 명령으로 서버를 시작하세요: npm run dev:backend${NC}"
    exit 1
fi

echo ""

# 정리 전 토큰 통계 확인 (선택적)
echo -e "${PURPLE}[2/4] 정리 전 상태 확인 (선택적)...${NC}"
echo -e "${YELLOW}💡 현재 토큰 상태를 확인하려면 Prisma Studio를 확인하세요.${NC}"
echo -e "${YELLOW}   명령: npx prisma studio${NC}"
echo ""

# 토큰 정리 실행
echo -e "${PURPLE}[3/4] 토큰 정리 실행 중...${NC}"
echo -e "${YELLOW}요청 URL: POST ${BASE_URL}${AUTH_ENDPOINT}${NC}"

RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -w "\nHTTP_STATUS:%{http_code}" \
  "${BASE_URL}${AUTH_ENDPOINT}")

# 응답 파싱
HTTP_BODY=$(echo "$RESPONSE" | sed -E 's/HTTP_STATUS:[0-9]{3}$//')
HTTP_STATUS=$(echo "$RESPONSE" | tail -n1 | sed -E 's/.*HTTP_STATUS:([0-9]{3})$/\1/')

echo ""

# 결과 분석 및 출력
echo -e "${PURPLE}[4/4] 결과 분석...${NC}"
echo -e "${YELLOW}HTTP Status: ${HTTP_STATUS}${NC}"

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ 토큰 정리가 성공적으로 완료되었습니다!${NC}"
    echo ""
    echo -e "${BLUE}📊 정리 결과:${NC}"
    
    # JSON 응답 파싱 (jq가 있는 경우)
    if command -v jq > /dev/null 2>&1; then
        # 기본 정리 결과 추출
        EXPIRED_COUNT=$(echo "$HTTP_BODY" | jq -r '.data.expiredCleaned // 0' 2>/dev/null)
        REVOKED_COUNT=$(echo "$HTTP_BODY" | jq -r '.data.revokedCleaned // 0' 2>/dev/null)
        CLEANUP_TIME=$(echo "$HTTP_BODY" | jq -r '.data.timestamp // "N/A"' 2>/dev/null)
        LOG_FILE=$(echo "$HTTP_BODY" | jq -r '.data.logFile // null' 2>/dev/null)
        POLICY_DESC=$(echo "$HTTP_BODY" | jq -r '.data.policy.description // "N/A"' 2>/dev/null)
        
        # 정리 효과 분석
        TOTAL_CLEANED=$((EXPIRED_COUNT + REVOKED_COUNT))
        
        echo -e "${GREEN}📈 정리 통계:${NC}"
        echo -e "   • 정리된 만료 토큰 (7일 이후): ${EXPIRED_COUNT}개"
        echo -e "   • 정리된 취소 토큰 (48시간 이후): ${REVOKED_COUNT}개"
        echo -e "   • 총 정리된 토큰: ${TOTAL_CLEANED}개"
        echo -e "   • 정리 완료 시간: ${CLEANUP_TIME}"
        echo ""
        
        # 적용된 정책 표시
        echo -e "${BLUE}📋 적용된 정리 정책:${NC}"
        echo -e "   • ${POLICY_DESC}"
        echo ""
        
        # 삭제된 토큰 상세 정보 (토큰이 있는 경우)
        if [ "$TOTAL_CLEANED" -gt 0 ]; then
            echo -e "${BLUE}🔍 삭제된 토큰 상세 정보:${NC}"
            
            if [ "$EXPIRED_COUNT" -gt 0 ]; then
                echo -e "${YELLOW}   만료된 토큰 (${EXPIRED_COUNT}개):${NC}"
                echo "$HTTP_BODY" | jq -r '.data.expiredTokens[]? | "     • ID: \(.id[0:8])..., 사용자: \(.userId), 만료: \(.expiresAt)"' 2>/dev/null | head -5
                if [ "$EXPIRED_COUNT" -gt 5 ]; then
                    echo "     • ... 그 외 $((EXPIRED_COUNT - 5))개 토큰"
                fi
                echo ""
            fi
            
            if [ "$REVOKED_COUNT" -gt 0 ]; then
                echo -e "${YELLOW}   취소된 토큰 (${REVOKED_COUNT}개):${NC}"
                echo "$HTTP_BODY" | jq -r '.data.revokedTokens[]? | "     • ID: \(.id[0:8])..., 사용자: \(.userId), 취소: \(.revokedAt)"' 2>/dev/null | head -5
                if [ "$REVOKED_COUNT" -gt 5 ]; then
                    echo "     • ... 그 외 $((REVOKED_COUNT - 5))개 토큰"
                fi
                echo ""
            fi
            
            echo -e "${GREEN}✨ 총 ${TOTAL_CLEANED}개의 토큰이 정리되었습니다.${NC}"
        else
            echo -e "${YELLOW}💡 정리할 만료/취소 토큰이 없었습니다. (시스템 정상)${NC}"
        fi
        
        # 로그 파일 정보
        if [ "$LOG_FILE" != "null" ] && [ "$LOG_FILE" != "" ]; then
            echo ""
            echo -e "${BLUE}📄 백업 로그 파일:${NC}"
            echo -e "   • 파일 경로: ${LOG_FILE}"
            echo -e "   • 파일명: $(basename "$LOG_FILE")"
            echo -e "${YELLOW}   💡 이 파일에는 삭제된 토큰의 상세 정보가 복구 가능한 형태로 저장되어 있습니다.${NC}"
        fi
        
    else
        echo "$HTTP_BODY"
        echo ""
        echo -e "${YELLOW}💡 더 상세한 분석을 위해 jq를 설치하세요: brew install jq${NC}"
    fi
    
elif [ "$HTTP_STATUS" = "404" ]; then
    echo -e "${RED}❌ 엔드포인트를 찾을 수 없습니다.${NC}"
    echo -e "${YELLOW}💡 서버가 최신 버전인지 확인하세요.${NC}"
    
elif [ "$HTTP_STATUS" = "500" ]; then
    echo -e "${RED}❌ 서버 내부 오류가 발생했습니다.${NC}"
    echo -e "${YELLOW}💡 서버 로그를 확인하세요.${NC}"
    echo -e "${YELLOW}응답 내용: ${HTTP_BODY}${NC}"
    
else
    echo -e "${RED}❌ 예상치 못한 응답: HTTP ${HTTP_STATUS}${NC}"
    echo -e "${YELLOW}응답 내용: ${HTTP_BODY}${NC}"
fi

echo ""

# 추가 확인 및 사용 안내
echo -e "${PURPLE}🔍 추가 확인 및 사용 안내:${NC}"
echo ""

echo -e "${YELLOW}📊 데이터베이스 확인:${NC}"
echo -e "   • Prisma Studio: npx prisma studio"
echo -e "   • 토큰 테이블: RefreshToken 테이블에서 토큰 상태 확인"
echo ""

echo -e "${YELLOW}📋 서버 로그 확인:${NC}"
echo -e "   • 실시간 로그: 터미널에서 NestJS 서버 로그 출력 확인"
echo -e "   • 정기 스케줄러: 로그에서 'TokenCleanupService' 키워드 검색"
echo -e "   • 수동 정리: 로그에서 'Manual cleanup completed' 메시지 확인"
echo ""

echo -e "${YELLOW}📄 백업 로그 파일 활용:${NC}"
echo -e "   • 위치: logs/token-cleanup/cleanup-*.json"
echo -e "   • 용도: 실수로 삭제된 토큰 정보 확인 및 복구 참조"
echo -e "   • 내용: 삭제된 토큰의 ID, 사용자, 발급/만료 시간, IP, UserAgent"
echo ""

echo -e "${YELLOW}⚙️ 자동 정리 스케줄 (참고):${NC}"
echo -e "   • 만료 토큰 정리: 매일 자정 (00:00)"
echo -e "   • 취소 토큰 정리: 매 6시간마다 (00:00, 06:00, 12:00, 18:00)"
echo -e "   • 통계 로깅: 매주 월요일 새벽 2시"

echo ""
echo -e "${BLUE}========================================================${NC}"
echo -e "${BLUE}   테스트 완료 - $(date '+%H:%M:%S')${NC}"
echo -e "${BLUE}========================================================${NC}"