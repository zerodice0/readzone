
⏺ 🔍 독후감 기능 분석 - 확인 대상 파일 및 라인

  기능 장애 분석을 위한 핵심 파일들과 확인해야 할 라인을 정리했습니다.

  📝 독후감 기록 (작성/저장) 관련

  1. 메인 독후감 작성 폼

  파일: /src/app/(main)/write/write-review-form.tsx
  - 라인 535-600: handleSubmit 함수 (독후감 제출 로직)
  - 라인 ~100-150: 자동저장 useEffect (localStorage 저장)
  - 라인 80-110: ensureKakaoData 헬퍼 함수 (새로 추가된 부분)

  2. 독후감 생성 API

  파일: /src/app/api/reviews/route.ts
  - 라인 20-222: POST 함수 (독후감 DB 저장)
  - 라인 66-86: 임시 도서 처리 로직 (수정된 부분)

  💾 임시 저장 데이터 불러오기 관련

  1. 페이지 구조 변경

  파일: /src/app/(main)/write/page.tsx
  - 전체: WritePageContent 사용으로 변경된 구조

  파일: /src/app/(main)/write/write-page-content.tsx ⭐ 새 파일
  - 전체: fresh 파라미터 처리 로직

  2. localStorage 복원 로직

  파일: /src/app/(main)/write/write-review-form.tsx
  - 라인 170-210: localStorage 복원 useEffect (수정된 부분)
  - 라인 250-340: 서버 드래프트 복원 로직 (ensureKakaoData 추가)

  3. 드래프트 복원 훅

  파일: /src/components/draft/draft-restoration-hook.tsx
  - 라인 ~50-90: fetchDrafts 함수 (localStorage 통합 추가)
  - 라인 ~140-150: createNewReview 함수 (fresh 파라미터 추가)

  🔍 도서 검색 후 선택 로직 관련

  1. 카카오 도서 선택

  파일: /src/components/book/kakao-book-tab.tsx
  - 라인 131-180: handleKakaoBookSelect 함수 (_kakaoData 설정)

  2. 도서 선택 메인 컴포넌트

  파일: /src/components/book/book-selector.tsx
  - onBookSelect 콜백 함수 부분: 도서 선택 시 실행되는 로직

  3. 도서 충돌 체크 (새로 추가된 기능)

  파일: /src/hooks/use-book-draft-conflict.ts
  - 라인 77-123: checkBookDraftConflict 함수
  - 라인 28-75: checkLocalStorageConflict 함수

  파일: /src/app/api/reviews/draft/check-book/[bookId]/route.ts
  - 라인 32-52: 임시 도서 ID 처리 로직

  ⚠️ 우선 확인해야 할 의심 지점들

  1. WritePageContent의 fresh 파라미터 처리 - 자동복원이 완전히 비활성화되었을
  가능성
  2. ensureKakaoData 함수의 부작용 - 기존 도서 데이터 구조 변경 가능성
  3. 새로운 충돌 체크 로직 - 정상적인 도서 선택을 방해할 가능성
  4. localStorage 복원 로직 변경 - 기존 임시저장 데이터 접근 불가 가능성

  이 파일들과 라인을 중심으로 문제점을 파악하고 수정하시면 됩니다.