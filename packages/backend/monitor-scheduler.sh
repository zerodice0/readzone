#!/bin/bash

# =============================================================================
# Token Cleanup Scheduler Monitoring Script
# 
# 토큰 정리 스케줄러의 동작을 실시간으로 모니터링하는 스크립트입니다.
# 서버 로그에서 토큰 정리 관련 로그를 추출하여 실시간으로 표시합니다.
# =============================================================================

# 컬러 출력 설정
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 설정
MONITOR_DURATION=300  # 기본 모니터링 시간 (초)
LOG_KEYWORDS="TokenCleanupService|token|cleanup|expired|revoked|statistics"

# 헤더 출력
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   ReadZone Scheduler Monitor${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "${YELLOW}시작 시간: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo -e "${YELLOW}모니터링 키워드: ${LOG_KEYWORDS}${NC}"
echo ""

# 도움말 표시
show_help() {
    echo -e "${CYAN}사용법: $0 [옵션]${NC}"
    echo ""
    echo -e "${CYAN}옵션:${NC}"
    echo -e "  -t, --time SECONDS    모니터링 시간 설정 (기본: 300초)"
    echo -e "  -f, --follow          실시간 로그 추적 (무한)"
    echo -e "  -s, --stats           현재 스케줄러 상태만 확인"
    echo -e "  -h, --help            이 도움말 표시"
    echo ""
    echo -e "${CYAN}예시:${NC}"
    echo -e "  $0                    # 5분간 모니터링"
    echo -e "  $0 -t 60              # 1분간 모니터링"
    echo -e "  $0 -f                 # 실시간 무한 추적"
    echo -e "  $0 -s                 # 현재 상태만 확인"
}

# 현재 스케줄러 상태 확인
check_scheduler_status() {
    echo -e "${PURPLE}[스케줄러 상태 확인]${NC}"
    echo ""
    
    # 서버 상태 확인
    if curl -s --connect-timeout 5 "http://localhost:3001/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 서버가 실행 중입니다.${NC}"
    else
        echo -e "${RED}❌ 서버에 연결할 수 없습니다.${NC}"
        echo -e "${YELLOW}💡 서버를 시작하세요: npm run dev:backend${NC}"
        return 1
    fi
    
    # 다음 스케줄 실행 시간 안내
    echo -e "${YELLOW}📅 스케줄러 실행 계획:${NC}"
    echo -e "   • 만료 토큰 정리: 매일 00:00"
    echo -e "   • 취소 토큰 정리: 매 6시간 (00:00, 06:00, 12:00, 18:00)"
    echo -e "   • 통계 로깅: 매주 월요일 02:00"
    
    # 현재 시간 기준 다음 실행 시간 계산
    current_hour=$(date '+%H')
    current_minute=$(date '+%M')
    current_day=$(date '+%u')  # 1=월요일, 7=일요일
    
    echo ""
    echo -e "${YELLOW}⏰ 현재 시간: $(date '+%H:%M')${NC}"
    
    # 다음 6시간 정리 시간 계산
    if [ "$current_hour" -lt 6 ]; then
        next_cleanup="06:00"
    elif [ "$current_hour" -lt 12 ]; then
        next_cleanup="12:00"
    elif [ "$current_hour" -lt 18 ]; then
        next_cleanup="18:00"
    else
        next_cleanup="00:00 (내일)"
    fi
    
    echo -e "${CYAN}⏳ 다음 토큰 정리: ${next_cleanup}${NC}"
    
    # 다음 통계 로깅 시간
    if [ "$current_day" -eq 1 ] && [ "$current_hour" -lt 2 ]; then
        next_stats="오늘 02:00"
    elif [ "$current_day" -eq 1 ] && [ "$current_hour" -ge 2 ]; then
        next_stats="다음 월요일 02:00"
    else
        days_until_monday=$((8 - current_day))
        if [ "$days_until_monday" -eq 7 ]; then
            next_stats="다음 월요일 02:00"
        else
            next_stats="${days_until_monday}일 후 월요일 02:00"
        fi
    fi
    
    echo -e "${CYAN}📊 다음 통계 로깅: ${next_stats}${NC}"
}

# 실시간 로그 모니터링
monitor_logs() {
    local duration=$1
    local follow_mode=$2
    
    echo -e "${PURPLE}[로그 모니터링 시작]${NC}"
    
    if [ "$follow_mode" = "true" ]; then
        echo -e "${YELLOW}실시간 로그 추적 중... (Ctrl+C로 중단)${NC}"
    else
        echo -e "${YELLOW}${duration}초간 로그 모니터링 중...${NC}"
    fi
    
    echo -e "${YELLOW}필터링 키워드: ${LOG_KEYWORDS}${NC}"
    echo ""
    echo -e "${CYAN}=== 로그 출력 시작 ===${NC}"
    
    # 로그 모니터링 명령 구성
    if [ "$follow_mode" = "true" ]; then
        # 무한 추적 모드
        if command -v pm2 > /dev/null 2>&1; then
            pm2 logs --lines 0 | grep -E --color=always "$LOG_KEYWORDS"
        else
            # NestJS 개발 서버 로그 추적 (일반적인 경우)
            echo -e "${YELLOW}💡 개발 서버의 콘솔 출력을 확인하세요.${NC}"
            echo -e "${YELLOW}   또는 로그 파일이 있다면 다음 명령을 사용하세요:${NC}"
            echo -e "${YELLOW}   tail -f logs/application.log | grep -E --color=always '$LOG_KEYWORDS'${NC}"
            
            # 임시 모니터링 (프로세스 기반)
            while true; do
                sleep 5
                echo -e "${CYAN}[$(date '+%H:%M:%S')] 모니터링 중... (로그 파일 경로를 설정하면 실제 로그를 볼 수 있습니다)${NC}"
            done
        fi
    else
        # 시간 제한 모드
        timeout_cmd="timeout $duration"
        
        if command -v pm2 > /dev/null 2>&1; then
            $timeout_cmd pm2 logs --lines 0 | grep -E --color=always "$LOG_KEYWORDS"
        else
            echo -e "${YELLOW}💡 지정된 시간(${duration}초) 동안 서버 콘솔 출력을 확인하세요.${NC}"
            
            # 카운트다운 표시
            for ((i=$duration; i>0; i--)); do
                echo -e "${CYAN}[$(date '+%H:%M:%S')] 남은 시간: ${i}초...${NC}"
                sleep 1
            done
        fi
    fi
}

# 매뉴얼 테스트 제안
suggest_manual_test() {
    echo ""
    echo -e "${PURPLE}🧪 수동 테스트 제안:${NC}"
    echo -e "${YELLOW}1. 즉시 정리 테스트:${NC}"
    echo -e "   ./test-token-cleanup.sh"
    echo ""
    echo -e "${YELLOW}2. API 직접 호출:${NC}"
    echo -e "   curl -X POST http://localhost:3001/auth/trigger-cleanup"
    echo ""
    echo -e "${YELLOW}3. 데이터베이스 직접 확인:${NC}"
    echo -e "   npx prisma studio"
    echo ""
    echo -e "${YELLOW}4. 서버 로그 실시간 확인:${NC}"
    echo -e "   $0 -f"
}

# 명령행 인수 처리
FOLLOW_MODE=false
STATS_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--time)
            MONITOR_DURATION="$2"
            shift 2
            ;;
        -f|--follow)
            FOLLOW_MODE=true
            shift
            ;;
        -s|--stats)
            STATS_ONLY=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}알 수 없는 옵션: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# 메인 실행 로직
main() {
    # 현재 상태 확인
    if ! check_scheduler_status; then
        exit 1
    fi
    
    echo ""
    
    # 통계만 확인하고 종료
    if [ "$STATS_ONLY" = "true" ]; then
        suggest_manual_test
        exit 0
    fi
    
    # 로그 모니터링 실행
    monitor_logs "$MONITOR_DURATION" "$FOLLOW_MODE"
    
    echo ""
    echo -e "${CYAN}=== 로그 출력 종료 ===${NC}"
    
    # 테스트 제안
    suggest_manual_test
    
    echo ""
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}   모니터링 완료 - $(date '+%H:%M:%S')${NC}"
    echo -e "${BLUE}============================================${NC}"
}

# 인터럽트 핸들러 (Ctrl+C)
trap 'echo -e "\n${YELLOW}모니터링이 중단되었습니다.${NC}"; exit 0' INT

# 메인 함수 실행
main