#!/bin/bash

# ReadZone 데이터베이스 관리 스크립트

case "$1" in
    "start")
        echo "PostgreSQL 컨테이너 시작..."
        docker compose up -d postgres
        ;;
    "stop")
        echo "PostgreSQL 컨테이너 중지..."
        docker compose down
        ;;
    "restart")
        echo "PostgreSQL 컨테이너 재시작..."
        docker compose restart postgres
        ;;
    "logs")
        echo "PostgreSQL 로그 보기..."
        docker compose logs -f postgres
        ;;
    "psql")
        echo "PostgreSQL 접속..."
        docker exec -it readzone_postgres psql -U readzone -d readzone_db
        ;;
    "backup")
        echo "로컬 데이터베이스 백업..."
        docker exec readzone_postgres pg_dump -U readzone readzone_db > "backups/local_backup_$(date +%Y%m%d_%H%M%S).sql"
        ;;
    "status")
        echo "컨테이너 상태 확인..."
        docker compose ps
        docker stats --no-stream readzone_postgres
        ;;
    *)
        echo "사용법: $0 {start|stop|restart|logs|psql|backup|status}"
        exit 1
        ;;
esac