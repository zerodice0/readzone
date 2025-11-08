# API Contracts: 독후감 메인 피드

**Feature**: 002-feature
**Date**: 2025-11-09
**Status**: Design Phase

## Overview

독후감 메인 피드 기능을 위한 REST API 엔드포인트 사양입니다. 모든 엔드포인트는 JSON 형식으로 데이터를 주고받으며, 적절한 HTTP 상태 코드를 반환합니다.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://api.readzone.com/api`

## Authentication

- **Optional Endpoints**: 피드 조회, 독후감 상세 조회, 공유 링크 생성
- **Required Endpoints**: 좋아요, 북마크, 독후감 작성/수정/삭제

인증은 JWT 토큰을 사용하며, `Authorization: Bearer <token>` 헤더를 통해 전달합니다.

## API Contracts

1. [Reviews API](./reviews-api.md) - 독후감 CRUD 및 피드 조회
2. [Likes API](./likes-api.md) - 좋아요 토글
3. [Bookmarks API](./bookmarks-api.md) - 북마크 토글 및 조회
4. [Books API](./books-api.md) - 책 검색 및 정보 조회

## Common Response Format

### Success Response

```json
{
  "data": {
    /* response payload */
  },
  "meta": {
    "timestamp": "2025-11-09T12:34:56.789Z"
  }
}
```

### Paginated Response

```json
{
  "data": [
    /* array of items */
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "hasMore": true,
    "timestamp": "2025-11-09T12:34:56.789Z"
  }
}
```

### Error Response

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      /* optional additional info */
    }
  },
  "meta": {
    "timestamp": "2025-11-09T12:34:56.789Z"
  }
}
```

## HTTP Status Codes

- `200 OK` - 성공적인 요청
- `201 Created` - 리소스 생성 성공
- `204 No Content` - 성공적인 삭제
- `400 Bad Request` - 잘못된 요청 (유효성 검증 실패)
- `401 Unauthorized` - 인증 필요
- `403 Forbidden` - 권한 없음
- `404 Not Found` - 리소스를 찾을 수 없음
- `409 Conflict` - 리소스 충돌 (중복 좋아요 등)
- `422 Unprocessable Entity` - 비즈니스 로직 검증 실패
- `429 Too Many Requests` - Rate limit 초과
- `500 Internal Server Error` - 서버 오류

## Rate Limiting

- **Anonymous Users**: 100 req/15min
- **Authenticated Users**: 1000 req/15min

Rate limit 정보는 다음 헤더를 통해 제공됩니다:

- `X-RateLimit-Limit`: 시간 창 내 최대 요청 수
- `X-RateLimit-Remaining`: 남은 요청 수
- `X-RateLimit-Reset`: Rate limit 리셋 시간 (Unix timestamp)

## Error Codes

| Code                       | Description                        |
| -------------------------- | ---------------------------------- |
| `VALIDATION_ERROR`         | 입력 데이터 유효성 검증 실패       |
| `AUTHENTICATION_REQUIRED`  | 인증이 필요한 작업                 |
| `INSUFFICIENT_PERMISSIONS` | 권한 부족                          |
| `RESOURCE_NOT_FOUND`       | 요청한 리소스를 찾을 수 없음       |
| `DUPLICATE_ACTION`         | 중복된 작업 (예: 이미 좋아요 누름) |
| `RATE_LIMIT_EXCEEDED`      | Rate limit 초과                    |
| `INTERNAL_ERROR`           | 서버 내부 오류                     |

## Request/Response Examples

모든 타임스탬프는 ISO 8601 형식(`YYYY-MM-DDTHH:mm:ss.sssZ`)을 사용합니다.

모든 페이지네이션은 0-based offset을 사용하며, `page`와 `limit` 쿼리 파라미터를 지원합니다.

## Versioning

현재 API 버전: `v1`

버전은 URL에 포함하지 않으며, 필요 시 `Accept` 헤더를 통해 관리합니다:

```
Accept: application/vnd.readzone.v1+json
```

## CORS

개발 환경에서는 모든 출처를 허용하며, 프로덕션에서는 허용된 도메인만 접근 가능합니다.

## Next Steps

1. ✅ API contracts 정의
2. → Backend implementation
3. → Frontend integration
4. → E2E testing
