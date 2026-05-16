# Status

approved

# Input

보석/광물 방향으로 잘못 적용된 디자인을 종이 질감, 노트 여백선, 잉크색 텍스트 중심으로 다시 정리한다. 기존 UI/UX 흐름은 유지하되, 그날 읽은 내용을 독서 일기로 자연스럽게 작성하고 책을 다 읽은 뒤 일기들을 보며 독후감을 상세하게 작성하는 흐름의 사용성을 개선한다. 비판적 리뷰 에이전트가 승인할 때까지 반복한다.

# Rounds Used

- Standard review rounds: 2
- Final audit passes: 3

# Implementation Summary

- 앱 전반의 광물/보석 계열 토큰, 클래스, 프리뷰를 `paper-*`, `ink-*`, `note-*` 중심의 종이/노트 디자인 언어로 교체했다.
- 독서 일기 화면에는 월간 요약과 독후감 후보 흐름을 추가하고, 일기 모달과 후보 카드에서 `/reviews/new?bookId=...`로 자연스럽게 이어지도록 했다.
- 독후감 작성 화면은 선택한 책과 해당 책의 독서 일기를 함께 보며 작성하도록 정리했고, 사전 선택된 책도 기존 리뷰 중복 확인 다이얼로그를 우회하지 않도록 보완했다.
- 독서 일기 작성 화면에는 “오늘 읽은 범위”, “인상 깊었던 문장”, “나중에 독후감에서 더 쓰고 싶은 생각” 프롬프트 칩을 추가했다.
- `docs/design-preview/mineral-archive-board.svg`를 제거하고 `docs/design-preview/paper-notebook-board.svg` 및 `paper-notebook-board.png`로 교체했다.

# Verification Evidence

- `rg -n "\b(mineral|jewel|onyx|emerald|ruby|sapphire|gold|crystal|diamond|quartz|gem|Sparkles)\b|mineral-|gem-|jewel-|book-jewel-frame|gem-badge|gold-|emerald-deep|text-onyx|bg-onyx" packages/frontend/src docs/design-preview` -> no matches
- `git diff --check` -> passed
- `pnpm --filter @geuldarak/frontend type-check` -> passed
- `pnpm --filter @geuldarak/frontend lint` -> passed
- `pnpm --filter @geuldarak/frontend build` -> passed, with existing large chunk warning only
- `curl http://127.0.0.1:5174/feed` -> `200 text/html`
- `curl http://100.122.240.112:5174/feed` -> `200 text/html`
- `docs/design-preview/paper-notebook-board.png` -> visually inspected after Chrome headless render, `1600 x 1050`

# Final Audit

Reviewer verdict: `VERDICT: APPROVE`

The reviewer approved the current tree after confirming:

- The paper preview PNG now matches the SVG viewBox at `1600x1050`.
- `git diff --check` passes.
- Prohibited gemstone/mineral/sparkle terms have no matches.
- App source approvals from the previous audit remain valid.

# User Review Checklist

- 모바일에서 `http://100.122.240.112:5174/feed`에 접속해 피드와 종이 질감 배경이 정상 표시되는지 확인.
- `/reading-diary`에서 통계, 독후감 후보 카드, 일기 모달이 깨지지 않는지 확인.
- 독후감 후보 카드 또는 일기 모달의 “독후감” 버튼이 해당 책이 선택된 `/reviews/new?bookId=...` 화면으로 이어지는지 확인.
- 이미 리뷰가 있는 책으로 진입했을 때 새 작성 화면 대신 기존 리뷰 안내 다이얼로그가 뜨는지 확인.
- 모바일에서 일기 모달의 아이콘 버튼들이 탭하기 쉽고 레이아웃이 밀리지 않는지 확인.

# Unresolved Blockers

None.
