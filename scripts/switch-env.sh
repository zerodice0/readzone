#!/bin/bash

# ReadZone 환경 전환 스크립트

BACKEND_ENV_DIR="packages/backend"
FRONTEND_ENV_DIR="packages/frontend"

case "$1" in
    "neon")
        echo "Neon 데이터베이스로 전환 중..."
        if [ -f "backups/backend_env_neon.backup" ]; then
            cp backups/backend_env_neon.backup $BACKEND_ENV_DIR/.env.local
            echo "✅ Backend 환경이 Neon으로 전환되었습니다."
        else
            echo "❌ Neon 백업 파일을 찾을 수 없습니다."
            exit 1
        fi
        ;;
    "local")
        echo "로컬 데이터베이스로 전환 중..."
        cp .env.local.template $BACKEND_ENV_DIR/.env.local
        echo "✅ Backend 환경이 로컬로 전환되었습니다."
        ;;
    "status")
        echo "현재 데이터베이스 설정:"
        if [ -f "$BACKEND_ENV_DIR/.env.local" ]; then
            grep "DATABASE_URL" $BACKEND_ENV_DIR/.env.local | head -1
        else
            echo "환경 설정 파일이 없습니다."
        fi
        ;;
    "backup-neon")
        echo "Neon 환경 백업 중..."
        if [ -f "$BACKEND_ENV_DIR/.env.local" ]; then
            cp $BACKEND_ENV_DIR/.env.local backups/backend_env_neon.backup
            echo "✅ Neon 환경이 백업되었습니다."
        else
            echo "❌ 환경 파일을 찾을 수 없습니다."
        fi
        ;;
    *)
        echo "사용법: $0 {neon|local|status|backup-neon}"
        echo ""
        echo "  neon        : Neon 데이터베이스로 전환"
        echo "  local       : 로컬 데이터베이스로 전환"
        echo "  status      : 현재 데이터베이스 설정 확인"
        echo "  backup-neon : 현재 Neon 환경을 백업"
        exit 1
        ;;
esac