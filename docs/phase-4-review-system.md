# Phase 4: Review System (독후감 시스템)

## 목표
독후감 작성, 편집, 상세 보기 기능을 구현하여 사용자가 풍부한 독서 경험을 공유할 수 있는 핵심 시스템을 구축합니다.

## 범위

### 1. 독후감 작성 페이지
- [ ] 도서 선택 인터페이스
- [ ] 마크다운 에디터 구현
- [ ] 실시간 미리보기
- [ ] 자동 임시저장
- [ ] 추천/비추천 선택
- [ ] 해시태그 입력
- [ ] 구매 링크 추가

### 2. 독후감 편집 기능
- [ ] 기존 독후감 수정
- [ ] 버전 관리
- [ ] 편집 권한 확인
- [ ] 변경 사항 추적

### 3. 독후감 상세 페이지
- [ ] 전체 독후감 표시
- [ ] 마크다운 렌더링
- [ ] 도서 정보 연동
- [ ] 작성자 정보
- [ ] 메타데이터 표시

### 4. 마크다운 에디터
- [ ] 실시간 편집
- [ ] 문법 하이라이팅
- [ ] 툴바 구현
- [ ] 이미지 삽입
- [ ] 테이블 지원

### 5. 임시저장 시스템
- [ ] 자동 저장 (5분 간격)
- [ ] 로컬스토리지 백업
- [ ] 저장 상태 표시
- [ ] 복구 기능

## 기술 요구사항

### 마크다운 에디터 스택
```typescript
// 주요 라이브러리
import { Editor } from '@toast-ui/react-editor'
import '@toast-ui/editor/dist/toastui-editor.css'
import '@toast-ui/editor/dist/theme/toastui-editor-dark.css'

// 또는 대안
import { MDXEditor } from '@mdxeditor/editor'
import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
```

### API Routes

#### 독후감 CRUD
```typescript
// app/api/reviews/route.ts
POST /api/reviews
Body: {
  bookId: string
  title?: string
  content: string
  isRecommended: boolean
  tags: string[]
  purchaseLink?: string
}
Response: {
  success: boolean
  review: BookReview
}

GET /api/reviews
Query: {
  page: number
  limit: number
  userId?: string
  bookId?: string
  tags?: string[]
  sort?: 'latest' | 'popular' | 'recommended'
}

// app/api/reviews/[id]/route.ts
GET /api/reviews/[id]
Response: {
  review: BookReviewDetail
}

PUT /api/reviews/[id]
Body: Partial<BookReview>

DELETE /api/reviews/[id]
```

#### 임시저장
```typescript
// app/api/reviews/draft/route.ts
POST /api/reviews/draft
Body: {
  content: string
  bookId?: string
  metadata: Record<string, any>
}
Response: {
  draftId: string
}

GET /api/reviews/draft/[id]
DELETE /api/reviews/draft/[id]
```

### 데이터 모델

#### 독후감 상세 타입
```typescript
interface BookReviewDetail extends BookReview {
  book: {
    id: string
    title: string
    authors: string[]
    thumbnail?: string
    genre?: string
    publisher?: string
  }
  user: {
    id: string
    nickname: string
    image?: string
    bio?: string
  }
  _count: {
    likes: number
    comments: number
  }
  isLiked?: boolean // 현재 사용자가 좋아요 했는지
  canEdit?: boolean // 현재 사용자가 편집 가능한지
}

interface ReviewDraft {
  id: string
  userId: string
  content: string
  bookId?: string
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}
```

### 마크다운 에디터 구성

#### 에디터 컴포넌트
```typescript
interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  height?: string
  previewStyle?: 'tab' | 'vertical'
  enableImages?: boolean
  enableTables?: boolean
  autofocus?: boolean
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = '독후감을 작성해보세요...',
  height = '400px',
  previewStyle = 'vertical',
  enableImages = true,
  enableTables = true,
  autofocus = false
}) => {
  // 에디터 구현
}
```

#### 이미지 업로드 처리
```typescript
interface ImageUploadHandler {
  upload: (file: File) => Promise<string> // 업로드된 이미지 URL 반환
  validate: (file: File) => boolean // 파일 유효성 검사
  compress?: (file: File) => Promise<File> // 이미지 압축
}

const handleImageUpload = async (file: File): Promise<string> => {
  // 1. 파일 유효성 검사
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 업로드 가능합니다.')
  }
  
  // 2. 파일 크기 제한 (5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('파일 크기는 5MB 이하여야 합니다.')
  }
  
  // 3. 로컬 저장소에 업로드
  const formData = new FormData()
  formData.append('image', file)
  
  const response = await fetch('/api/upload/image', {
    method: 'POST',
    body: formData
  })
  
  const { url } = await response.json()
  return url
}
```

### 임시저장 시스템

#### 자동저장 훅
```typescript
interface UseAutosaveOptions {
  key: string
  data: any
  interval?: number // ms, 기본값: 5분
  storage?: 'localStorage' | 'sessionStorage' | 'server'
}

const useAutosave = ({
  key,
  data,
  interval = 5 * 60 * 1000, // 5분
  storage = 'localStorage'
}: UseAutosaveOptions) => {
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // 자동저장 로직
  useEffect(() => {
    const timer = setInterval(() => {
      save()
    }, interval)
    
    return () => clearInterval(timer)
  }, [data, interval])
  
  const save = async () => {
    setIsSaving(true)
    try {
      if (storage === 'localStorage') {
        localStorage.setItem(key, JSON.stringify(data))
      } else if (storage === 'server') {
        await saveDraft(data)
      }
      setLastSaved(new Date())
    } catch (error) {
      console.error('자동저장 실패:', error)
    } finally {
      setIsSaving(false)
    }
  }
  
  return {
    lastSaved,
    isSaving,
    save: () => save()
  }
}
```

## UI/UX 명세

### 독후감 작성 페이지 (/write)
```
┌─────────────────────────────────────┐
│          독후감 작성                 │
├─────────────────────────────────────┤
│                                     │
│  📚 도서 선택                       │
│  ┌─────────────────────────────────┐ │
│  │ [📖] 선택된 책 제목              │ │
│  │      저자명 | 출판사             │ │
│  │                    [다시 선택]   │ │
│  └─────────────────────────────────┘ │
│                                     │
│  ✏️ 독후감 제목 (선택사항)          │
│  [_____________________________]   │
│                                     │
│  📝 내용                            │
│  ┌─ 에디터 ─────────┬─ 미리보기 ───┐ │
│  │ # 제목           │ 제목          │ │
│  │                  │               │ │
│  │ **굵은 글씨**    │ 굵은 글씨     │ │
│  │                  │               │ │
│  │ - 목록 항목      │ • 목록 항목   │ │
│  │                  │               │ │
│  │ [B][I][#][📷]   │               │ │
│  └──────────────────┴───────────────┘ │
│                                     │
│  💝 이 책을 추천하시나요?            │
│  ○ 👍 추천   ● 👎 비추천           │
│                                     │
│  🏷️ 해시태그                        │
│  [#판타지 #재미있음 #추천    ] + 태그│
│                                     │
│  🛒 구매 링크 (선택사항)             │
│  [_____________________________]   │
│                                     │
│  💾 마지막 저장: 2분 전              │
│  [  임시저장  ] [  취소  ] [ 게시 ] │
│                                     │
└─────────────────────────────────────┘
```

### 독후감 상세 페이지 (/review/[id])
```
┌─────────────────────────────────────┐
│                                     │
│  ┌────┐ 독후감 제목                 │
│  │📖  │ by @username • 3일 전       │
│  │표지│ 👍 추천 • ❤️ 12 💬 5       │
│  └────┘                            │
│                                     │
│  🏷️ #판타지 #재미있음 #추천         │
│                                     │
│  ─────────────────────────────────   │
│                                     │
│  📝 독후감 내용                     │
│                                     │
│  이 책은 정말 흥미진진했습니다...    │
│                                     │
│  ## 인상 깊었던 부분                │
│                                     │
│  특히 주인공의 성장 과정이...        │
│                                     │
│  > "인용문 부분"                    │
│                                     │
│  **결론적으로** 이 책을 적극 추천... │
│                                     │
│  ─────────────────────────────────   │
│                                     │
│  🛒 이 책 구매하기                  │
│  [교보문고 바로가기] 📊 클릭 24회    │
│                                     │
│  ─────────────────────────────────   │
│                                     │
│  💬 댓글 (5개)                      │
│                                     │
│  [댓글을 남겨보세요...        ] [📤] │
│                                     │
│  @reader1 • 1일 전                  │
│  "저도 이 책 읽어봤는데..."         │
│  ❤️ 2 💬 답글                       │
│                                     │
└─────────────────────────────────────┘
```

### 마크다운 에디터 툴바
```
[B] [I] [U] [S] | [H1] [H2] [H3] | [📷] [🔗] [📊] | [📝] [👁️] [📱]
 ↑   ↑   ↑   ↑     ↑    ↑    ↑      ↑    ↑    ↑     ↑    ↑    ↑
굵게 기울 밑줄 취소 제목1 제목2 제목3  이미지 링크 표   편집 미리 모바일
```

## 해시태그 시스템

### 해시태그 추천
```typescript
const POPULAR_TAGS = [
  // 감정/평가
  '재미있음', '감동적', '지루함', '놀라움', '슬픔', '따뜻함',
  
  // 장르
  '로맨스', '판타지', '미스터리', '추리', 'SF', '역사', '자기계발',
  
  // 추천 대상
  '초보자추천', '전문가용', '청소년추천', '성인추천',
  
  // 읽기 난이도
  '쉬운책', '어려운책', '중간난이도',
  
  // 특징
  '짧은책', '긴책', '시리즈', '번역서', '한국작가', '외국작가'
]

interface TagSuggestion {
  tag: string
  count: number
  category: 'emotion' | 'genre' | 'target' | 'difficulty' | 'feature'
}
```

## 테스트 시나리오

### 1. 독후감 작성 플로우 테스트
- [ ] 도서 선택 → 제목 입력 → 내용 작성 → 게시
- [ ] 마크다운 문법 정상 렌더링
- [ ] 이미지 업로드 및 표시
- [ ] 해시태그 입력 및 추천
- [ ] 임시저장 동작 확인

### 2. 에디터 기능 테스트
- [ ] 마크다운 실시간 미리보기
- [ ] 툴바 버튼 동작
- [ ] 이미지 드래그 앤 드롭
- [ ] 테이블 삽입 및 편집
- [ ] 모바일 반응형 에디터

### 3. 독후감 상세 페이지 테스트
- [ ] 마크다운 콘텐츠 렌더링
- [ ] 구매 링크 클릭 추적
- [ ] 메타 정보 표시
- [ ] 공유 기능 동작

### 4. 성능 테스트
- [ ] 대용량 콘텐츠 (10,000자) 처리
- [ ] 다중 이미지 로딩
- [ ] 실시간 미리보기 성능

## 완료 기준

### 필수 완료 사항
1. ✅ **작성 기능**: 마크다운 에디터로 독후감 작성 완료
2. ✅ **편집 기능**: 기존 독후감 수정 가능
3. ✅ **상세 보기**: 마크다운 렌더링 및 메타 정보 표시
4. ✅ **임시저장**: 자동저장 및 복구 기능
5. ✅ **이미지 처리**: 업로드 및 표시 지원

### 검증 방법
1. 마크다운 모든 문법 요소 정상 렌더링
2. 5MB 이미지 업로드 및 표시
3. 자동저장 후 브라우저 재시작해도 복구
4. 모바일에서 에디터 정상 동작

## 다음 Phase 연계 사항

Phase 4 완료 후 Phase 5에서 활용할 요소:
- 독후감 상세 페이지에 좋아요/댓글 기능 연동
- 해시태그를 활용한 독후감 필터링
- 사용자 프로필에서 작성한 독후감 목록 표시
- 구매 링크 클릭 데이터를 통계에 활용

## 위험 요소 및 대응 방안

### 위험 요소
1. **에디터 성능**: 대용량 콘텐츠 처리 시 지연
2. **이미지 저장**: 로컬 저장소 용량 제한
3. **마크다운 보안**: XSS 공격 가능성

### 대응 방안
1. **에디터 성능**: 가상 스크롤링, 지연 로딩 적용
2. **이미지 저장**: 압축 및 CDN 도입 검토
3. **마크다운 보안**: 화이트리스트 기반 HTML 정제