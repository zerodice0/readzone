# 칭호/뱃지 시스템 설계 문서

> **상태**: 설계 완료, 구현 예정
> **작성일**: 2024-12
> **관련 기능**: 대시보드 독서 통계

## 1. 개요

사용자의 독서 활동에 따라 칭호(뱃지)를 부여하여 게임화(Gamification) 요소를 강화합니다.
사용자는 획득한 칭호 중 하나를 선택하여 프로필에 표시할 수 있습니다.

## 2. 칭호 유형

### 2.1 장르별 칭호

특정 장르의 책을 일정 권수 이상 읽으면 획득

| 단계   | 조건  | 칭호 형식     | 예시            |
| ------ | ----- | ------------- | --------------- |
| 입문   | 5권   | {장르} 입문자 | 소설 입문자     |
| 애호가 | 20권  | {장르} 애호가 | 자기계발 애호가 |
| 전문가 | 50권  | {장르} 전문가 | 과학 전문가     |
| 마스터 | 100권 | {장르} 마스터 | 소설 마스터     |

### 2.2 총 독서량 칭호

전체 독서량에 따른 칭호

| 조건      | 칭호           |
| --------- | -------------- |
| 첫 독후감 | 독서 새싹 🌱   |
| 10권      | 열정 독서가 📚 |
| 30권      | 도서관 단골 📖 |
| 50권      | 책벌레 🐛      |
| 100권     | 독서 마니아 ⭐ |
| 200권     | 독서 챔피언 🏆 |
| 500권     | 독서 전설 👑   |

### 2.3 활동 기반 칭호

특별한 활동에 따른 칭호

| 조건                  | 칭호                  |
| --------------------- | --------------------- |
| 좋아요 100개 받음     | 인기 리뷰어 ❤️        |
| 북마크 50개 받음      | 영향력 있는 리뷰어 🔖 |
| 30일 연속 독후감      | 꾸준한 독서가 🔥      |
| 다양한 장르 10개 이상 | 다독가 🌈             |

## 3. 데이터 모델

### 3.1 badges 테이블

```typescript
badges: defineTable({
  code: v.string(), // 고유 식별자 (예: "genre_novel_master")
  name: v.string(), // 칭호 이름 (예: "소설 마스터")
  description: v.string(), // 설명
  category: v.union(
    v.literal('GENRE'), // 장르별
    v.literal('READING'), // 총 독서량
    v.literal('ACTIVITY'), // 활동 기반
    v.literal('SPECIAL') // 특별 이벤트
  ),
  icon: v.optional(v.string()), // 이모지 또는 아이콘
  condition: v.object({
    // 획득 조건 (JSON)
    type: v.string(),
    threshold: v.number(),
    genre: v.optional(v.string()),
  }),
  rarity: v.union(
    v.literal('COMMON'),
    v.literal('RARE'),
    v.literal('EPIC'),
    v.literal('LEGENDARY')
  ),
});
```

### 3.2 userBadges 테이블 (획득한 뱃지)

```typescript
userBadges: defineTable({
  userId: v.string(),
  badgeId: v.id('badges'),
  earnedAt: v.number(), // 획득 시점
  isDisplayed: v.boolean(), // 프로필에 표시 여부
})
  .index('by_user', ['userId'])
  .index('by_user_displayed', ['userId', 'isDisplayed']);
```

## 4. 획득 로직

### 4.1 트리거 시점

- 독후감 작성/발행 시
- 좋아요/북마크 받을 때 (비동기 집계)
- 주기적 배치 작업 (연속 독서 등)

### 4.2 체크 로직 (Pseudo Code)

```typescript
async function checkAndAwardBadges(userId: string) {
  // 1. 사용자의 현재 통계 조회
  const stats = await getUserStats(userId);

  // 2. 아직 획득하지 않은 뱃지 목록 조회
  const unearned = await getUnearnedBadges(userId);

  // 3. 각 뱃지 조건 확인
  for (const badge of unearned) {
    if (meetsCondition(stats, badge.condition)) {
      await awardBadge(userId, badge._id);
      await notifyUser(userId, badge); // 획득 알림
    }
  }
}
```

## 5. UI/UX 설계

### 5.1 대시보드 표시

- 대표 칭호: 프로필 이름 옆에 표시
- 획득한 뱃지 목록: 그리드로 표시 (획득/미획득 구분)
- 진행률 표시: 다음 칭호까지 남은 독서량

### 5.2 획득 알림

- 토스트 알림 + 축하 애니메이션
- 대시보드 상단 새로운 뱃지 하이라이트

### 5.3 프로필 칭호 선택

- 획득한 칭호 중 하나를 대표 칭호로 선택
- 선택한 칭호가 프로필과 리뷰에 표시

## 6. 구현 우선순위

1. **Phase 1** (MVP)
   - badges, userBadges 테이블 생성
   - 총 독서량 칭호 자동 부여
   - 대시보드에 획득 뱃지 표시

2. **Phase 2**
   - 장르별 칭호 구현
   - 프로필 대표 칭호 선택

3. **Phase 3**
   - 활동 기반 칭호
   - 획득 알림 시스템
   - 뱃지 상세 모달

## 7. 기술적 고려사항

### 7.1 성능

- 뱃지 체크는 독후감 발행 시에만 수행 (Mutation 후)
- 복잡한 조건은 비동기 작업으로 분리

### 7.2 확장성

- 뱃지 정의는 DB에 저장하여 코드 배포 없이 추가 가능
- 조건 체커는 플러그인 패턴으로 확장 가능하게 설계

### 7.3 데이터 일관성

- 뱃지 획득은 idempotent하게 설계 (중복 방지)
- 통계 기반이므로 재계산 가능

---

## 관련 파일

- `packages/backend/convex/stats.ts` - 장르 통계 쿼리
- `packages/frontend/src/pages/Dashboard/` - 대시보드 UI
