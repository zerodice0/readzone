# 04. 독후감 작성 페이지 구현 요구사항

## 페이지 정보
- **경로**: `/write`
- **우선순위**: 1순위 (MVP)
- **설명**: 마크다운 에디터와 자동저장 기능을 포함한 독후감 작성
- **인증**: 로그인 필수 (비로그인 시 로그인 페이지로 리다이렉트)

## 📋 참조 문서

### 사용자 플로우
- **[독후감 작성](../user-flows/content-creation.md)** - 도서 검색, 마크다운 에디터, 자동저장 흐름
- **[도서 탐색 및 검색](../user-flows/discovery.md)** - 3단계 도서 검색 시스템
- **[오류 처리](../user-flows/error-handling.md)** - 작성 중 오류, 페이지 이탈 시 보호

### 프로젝트 구조
- **[구현 페이지 목록](../implementation-pages.md)** - 독후감 작성의 콘텐츠 생성 체인
- **[사용자 흐름도 개요](../user-flows.md)** - 콘텐츠 생성 체인 및 주요 기능

### 관련 PRD 문서
- **[도서 검색 페이지](./06-search.md)** - 작성 시 도서 선택을 위한 검색 기능
- **[독후감 상세 페이지](./05-review-detail.md)** - 작성 완료 후 이동하는 상세 보기
- **[도서 상세 페이지](./09-book-detail.md)** - 도서 정보 참조 및 기존 독후감 확인
- **[메인 피드 페이지](./01-main-feed.md)** - 작성 완료 후 피드 반영

## 핵심 기능

### 1. 카카오 API 전용 도서 검색 시스템
- **검색 방식**: 카카오 도서 검색 API 단일 사용 (최대 커버리지 확보)
- **검색 결과 표시**: 표지 이미지, 제목, 저자, 출간연도, ISBN, API 소스 배지
- **도서 선택**: 클릭으로 선택, 선택된 도서 하이라이트
- **DB 저장**: 독후감 게시 시점에 도서 정보 자동 DB 생성 (ISBN 중복 방지)
- **수동 입력**: API에서 찾을 수 없는 도서는 수동 정보 입력 카드 제공

> **참고**: 일반 도서 검색 페이지(`/search`)는 DB 우선 검색으로 리뷰가 있는 도서만 표시하여, 독후감 작성과 도서 탐색을 목적별로 분리

### 2. 마크다운 에디터
- **실시간 미리보기**: 분할 화면 (편집 | 미리보기)
- **마크다운 기능**:
  - 제목 (H1-H6)
  - 굵게, 기울임, 취소선
  - 목록 (순서, 비순서)
  - 인용문, 코드 블록
  - 이미지 업로드 및 삽입
- **편집 도구**: 마크다운 문법 버튼, 키보드 단축키
- **이미지 업로드**: 드래그앤드롭, 클립보드 붙여넣기

### 3. 자동저장 시스템
- **자동저장 주기**: 30초 또는 내용 변경 시
- **저장 위치**: 로컬 스토리지 + 서버 백업
- **저장 상태 표시**: "저장 중...", "저장됨", "저장 실패"
- **페이지 이탈 보호**: beforeunload 이벤트로 경고

### 4. 추가 정보 입력
- **추천 여부**: 추천/비추천 라디오 버튼
- **해시태그**: 자동완성 지원, 최대 10개
- **공개 설정**: 전체 공개/팔로워만/비공개

## 필요한 API

### GET `/api/books/search`
```typescript
interface BookSearchRequest {
  query: string;
  page?: number; // 기본 1
  size?: number; // 기본 20
  // 독후감 작성 페이지에서는 'kakao' 고정 (카카오 API 전용)
  source: 'kakao';
}

interface BookSearchResponse {
  books: Book[];
  total?: number; // 제공되면 총계 표시, 미제공 시 클라이언트가 대체 표기
  hasMore: boolean; // 다음 페이지 여부 (미제공 시 size 비교로 추론)
  source: 'kakao'; // 독후감 작성 페이지에서는 카카오 API만 사용
}

interface Book {
  id?: string; // 카카오 API 결과는 null, DB 도서는 ID 포함
  title: string;
  author: string;
  publisher: string;
  publishedDate: string;
  isbn: string;
  coverImage?: string; // 또는 thumbnail
  description?: string;
  isExisting: boolean; // DB에 존재 여부 (카카오 API는 false)
  source: 'api' | 'manual'; // 카카오 API 또는 수동 입력
}
```

### ~~POST `/api/books`~~ (삭제됨)
도서 생성은 독후감 게시 시점에 자동으로 처리됩니다. 별도 도서 생성 API는 사용하지 않습니다.

### POST `/api/reviews`
```typescript
interface CreateReviewRequest {
  // 기존 도서 ID (DB에 있는 경우)
  bookId?: string;
  
  // 새 도서 정보 (카카오 API 선택 시)
  bookData?: {
    isbn?: string;
    title: string;
    author: string;
    publisher?: string;
    publishedAt?: string;
    thumbnail?: string;
    description?: string;
  };
  
  content: string; // HTML 형식
  isRecommended: boolean; // 추천 여부
  tags: string[];
  isPublic: boolean; // 공개 여부 (private는 false)
}

interface CreateReviewResponse {
  success: boolean;
  review: {
    id: string;
    bookId: string;
    content: string;
    rating: string;
    tags: string[];
    visibility: string;
    createdAt: string;
    author: {
      id: string;
      username: string;
      profileImage?: string;
    };
  };
}
```

### POST `/api/reviews/draft`
```typescript
interface SaveDraftRequest {
  bookId?: string;
  content: string;
  rating?: 'recommend' | 'not_recommend';
  tags?: string[];
  visibility?: 'public' | 'followers' | 'private';
}

interface SaveDraftResponse {
  success: boolean;
  draftId: string;
  savedAt: string;
}
```

### GET `/api/reviews/draft`
```typescript
interface GetDraftResponse {
  draft: {
    id: string;
    bookId?: string;
    content: string;
    rating?: 'recommend' | 'not_recommend';
    tags?: string[];
    visibility?: 'public' | 'followers' | 'private';
    updatedAt: string;
  } | null;
}
```

### POST `/api/upload/image`
```typescript
interface ImageUploadRequest {
  file: File;
  context: 'review' | 'profile';
}

interface ImageUploadResponse {
  success: boolean;
  url: string;
  publicId: string;
  width: number;
  height: number;
}
```

### GET `/api/tags/suggestions`
```typescript
interface TagSuggestionsRequest {
  query?: string;
  limit?: number;
}

interface TagSuggestionsResponse {
  suggestions: Array<{
    name: string;
    count: number; // 사용 횟수
  }>;
}
```

## 컴포넌트 구조

### 1. WriteReviewPage (메인 컴포넌트)
```typescript
interface WriteReviewPageProps {
  draftId?: string; // URL 파라미터로 전달되는 임시저장 ID
}

// 상태 관리
- step: 'book-search' | 'writing' | 'preview'
- selectedBook: Book | null
- content: string
- rating: 'recommend' | 'not_recommend' | null
- tags: string[]
- visibility: 'public' | 'followers' | 'private'
- isAutoSaving: boolean
- lastSaved: Date | null
- hasUnsavedChanges: boolean
```

### 2. BookSearchStep (도서 검색)
```typescript
interface BookSearchStepProps {
  onBookSelect: (book: Book) => void;
  selectedBook: Book | null;
}

// 하위 컴포넌트
- SearchInput: 검색어 입력
- SearchResults: 검색 결과 목록
- ManualBookInput: 수동 입력 폼
- SelectedBookCard: 선택된 도서 표시
```

### 3. WritingStep (독후감 작성)
```typescript
interface WritingStepProps {
  book: Book;
  content: string;
  onContentChange: (content: string) => void;
  rating: 'recommend' | 'not_recommend' | null;
  onRatingChange: (rating: 'recommend' | 'not_recommend') => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  visibility: 'public' | 'followers' | 'private';
  onVisibilityChange: (visibility: string) => void;
}

// 하위 컴포넌트
- MarkdownEditor: 마크다운 에디터
- PreviewPanel: 실시간 미리보기
- RatingSelector: 추천/비추천 선택
- TagInput: 해시태그 입력
- VisibilitySelector: 공개 설정
- AutoSaveIndicator: 자동저장 상태
```

### 4. MarkdownEditor (마크다운 에디터)
```typescript
interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onImageUpload: (file: File) => Promise<string>;
  placeholder?: string;
}

// 기능
- 마크다운 문법 버튼 툴바
- 키보드 단축키 (Ctrl+B, Ctrl+I 등)
- 이미지 드래그앤드롭
- 자동 들여쓰기
- 라이브 문자 수 카운트
```

### 5. ImageUploadHandler
```typescript
interface ImageUploadHandlerProps {
  onUpload: (file: File) => Promise<string>;
  onProgress?: (progress: number) => void;
  maxSize?: number; // MB
  acceptedTypes?: string[];
}

// 상태
- uploadProgress: number
- isUploading: boolean
- error: string | null
```

### 6. AutoSave (자동저장 훅)
```typescript
const useAutoSave = (
  data: SaveDraftRequest,
  enabled: boolean,
  interval: number = 30000
) => {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // 자동저장 로직
  // 변경 감지 및 디바운스
  // 에러 처리 및 재시도
  
  return { status, lastSaved, forceSave };
};
```

## 상태 관리 (Zustand)

### WriteReviewStore
```typescript
interface WriteReviewState {
  // 상태
  currentStep: 'book-search' | 'writing' | 'preview';
  selectedBook: Book | null;
  content: string;
  rating: 'recommend' | 'not_recommend' | null;
  tags: string[];
  visibility: 'public' | 'followers' | 'private';
  
  // 자동저장 관련
  draftId: string | null;
  isAutoSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  
  // 액션
  setStep: (step: WriteReviewState['currentStep']) => void;
  setSelectedBook: (book: Book) => void;
  setContent: (content: string) => void;
  setRating: (rating: 'recommend' | 'not_recommend') => void;
  setTags: (tags: string[]) => void;
  setVisibility: (visibility: string) => void;
  
  // API 액션
  searchBooks: (query: string, source?: 'db' | 'kakao') => Promise<Book[]>;
  createBook: (bookData: CreateBookRequest) => Promise<Book>;
  saveDraft: () => Promise<void>;
  loadDraft: () => Promise<void>;
  publishReview: () => Promise<string>; // 리뷰 ID 반환
  uploadImage: (file: File) => Promise<string>; // 이미지 URL 반환
  
  // 유틸리티
  reset: () => void;
  setUnsavedChanges: (hasChanges: boolean) => void;
}
```

## 자동저장 시스템

### 로컬 스토리지 + 서버 백업
```typescript
interface DraftData {
  bookId?: string;
  content: string;
  rating?: 'recommend' | 'not_recommend';
  tags: string[];
  visibility: 'public' | 'followers' | 'private';
  lastSaved: string;
  version: number;
}

const STORAGE_KEY = 'readzone_review_draft';

const saveToLocalStorage = (data: DraftData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

const loadFromLocalStorage = (): DraftData | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return null;
  }
};
```

### 자동저장 로직
```typescript
const useAutoSave = (data: DraftData, interval = 30000) => {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastDataRef = useRef<string>('');
  
  // 내용 변경 감지
  const currentDataString = JSON.stringify(data);
  const hasChanged = currentDataString !== lastDataRef.current;
  
  const save = useCallback(async () => {
    if (!hasChanged) return;
    
    setStatus('saving');
    try {
      // 로컬 스토리지에 즉시 저장
      saveToLocalStorage({
        ...data,
        lastSaved: new Date().toISOString(),
        version: Date.now()
      });
      
      // 서버에 백업 저장
      await api.saveDraft(data);
      
      lastDataRef.current = currentDataString;
      setStatus('saved');
    } catch (error) {
      console.error('Auto-save failed:', error);
      setStatus('error');
    }
  }, [data, hasChanged, currentDataString]);
  
  // 변경 시 디바운스된 저장
  useEffect(() => {
    if (!hasChanged) return;
    
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(save, 2000); // 2초 디바운스
  }, [hasChanged, save]);
  
  // 주기적 저장
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (hasChanged) save();
    }, interval);
    
    return () => clearInterval(intervalId);
  }, [save, interval, hasChanged]);
  
  return { status, forceSave: save };
};
```

### 페이지 이탈 보호
```typescript
const useBeforeUnload = (hasUnsavedChanges: boolean) => {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = '저장되지 않은 내용이 있습니다. 정말 떠나시겠습니까?';
        return event.returnValue;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);
};
```

## 이미지 업로드 시스템

### Cloudinary 통합
```typescript
const uploadImageToCloudinary = async (file: File): Promise<string> => {
  // 파일 크기 체크 (최대 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('이미지 크기는 5MB 이하여야 합니다');
  }
  
  // 파일 형식 체크
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('JPG, PNG, WebP, GIF 형식만 업로드 가능합니다');
  }
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('context', 'review');
  
  const response = await fetch('/api/upload/image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`
    },
    body: formData
  });
  
  if (!response.ok) {
    throw new Error('이미지 업로드에 실패했습니다');
  }
  
  const result = await response.json();
  return result.url;
};
```

### 드래그앤드롭 처리
```typescript
const useImageDrop = (onImageUpload: (file: File) => Promise<string>) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };
  
  const handleDragLeave = () => {
    setIsDragOver(false);
  };
  
  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(event.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      alert('이미지 파일만 업로드 가능합니다');
      return;
    }
    
    setIsUploading(true);
    try {
      for (const file of imageFiles) {
        const url = await onImageUpload(file);
        // 에디터에 이미지 마크다운 삽입
        insertImageIntoEditor(url, file.name);
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('이미지 업로드에 실패했습니다');
    } finally {
      setIsUploading(false);
    }
  };
  
  return {
    isDragOver,
    isUploading,
    dragProps: {
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop
    }
  };
};
```

## 마크다운 처리

### 마크다운 렌더링
```typescript
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// 마크다운 설정
marked.setOptions({
  breaks: true, // 줄바꿈을 <br>로 변환
  gfm: true, // GitHub Flavored Markdown 지원
});

// 안전한 HTML 렌더링
const renderMarkdown = (markdown: string): string => {
  const rawHtml = marked(markdown);
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'strong', 'em', 'u', 'del',
      'ul', 'ol', 'li',
      'blockquote', 'code', 'pre',
      'a', 'img'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target'],
    ALLOW_DATA_ATTR: false
  });
};
```

### 마크다운 에디터 도구
```typescript
const MarkdownToolbar: React.FC<{
  onInsert: (text: string) => void;
}> = ({ onInsert }) => {
  const tools = [
    { icon: 'B', action: '**굵게**', shortcut: 'Ctrl+B' },
    { icon: 'I', action: '*기울임*', shortcut: 'Ctrl+I' },
    { icon: 'H', action: '## 제목', shortcut: 'Ctrl+H' },
    { icon: 'Li', action: '- 목록 항목', shortcut: 'Ctrl+L' },
    { icon: 'Q', action: '> 인용문', shortcut: 'Ctrl+Q' },
    { icon: 'C', action: '```\n코드\n```', shortcut: 'Ctrl+Shift+C' },
    { icon: 'Img', action: '![이미지 설명](URL)', shortcut: 'Ctrl+G' }
  ];
  
  return (
    <div className="flex space-x-2 p-2 border-b">
      {tools.map(tool => (
        <button
          key={tool.icon}
          onClick={() => onInsert(tool.action)}
          title={`${tool.action} (${tool.shortcut})`}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
};
```

## 태그 자동완성

### 태그 입력 컴포넌트
```typescript
const TagInput: React.FC<{
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
}> = ({ tags, onChange, maxTags = 10 }) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // 태그 제안 로드
  const debouncedInputValue = useDebounce(inputValue, 300);
  
  useEffect(() => {
    if (debouncedInputValue.length > 0) {
      api.getTagSuggestions(debouncedInputValue)
        .then(result => {
          setSuggestions(result.suggestions.map(s => s.name));
          setShowSuggestions(true);
        })
        .catch(() => setSuggestions([]));
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedInputValue]);
  
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < maxTags) {
      onChange([...tags, trimmedTag]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (event.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };
  
  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 p-2 border rounded min-h-[40px]">
        {tags.map(tag => (
          <span
            key={tag}
            className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center"
          >
            #{tag}
            <button
              onClick={() => removeTag(tag)}
              className="ml-1 text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length < maxTags ? "태그 입력 후 Enter" : `최대 ${maxTags}개까지`}
          disabled={tags.length >= maxTags}
          className="flex-1 outline-none min-w-[100px]"
        />
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-b shadow-lg max-h-40 overflow-y-auto">
          {suggestions.slice(0, 5).map(suggestion => (
            <button
              key={suggestion}
              onClick={() => addTag(suggestion)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100"
            >
              #{suggestion}
            </button>
          ))}
        </div>
      )}
      
      <div className="text-xs text-gray-500 mt-1">
        {tags.length}/{maxTags} 태그 사용 중
      </div>
    </div>
  );
};
```

## 에러 처리

### 단계별 에러 처리
```typescript
interface WriteReviewError {
  step: 'book-search' | 'writing' | 'publishing';
  type: 'validation' | 'network' | 'server' | 'quota';
  message: string;
  retryable: boolean;
}

const errorMessages = {
  BOOK_NOT_FOUND: '검색 결과가 없습니다. 다른 키워드로 검색해보세요',
  BOOK_SEARCH_FAILED: '도서 검색 중 오류가 발생했습니다',
  CONTENT_TOO_SHORT: '독후감 내용을 입력해주세요 (최소 10자)',
  CONTENT_TOO_LONG: '독후감이 너무 깁니다 (최대 10,000자)',
  IMAGE_UPLOAD_FAILED: '이미지 업로드에 실패했습니다',
  IMAGE_TOO_LARGE: '이미지 크기가 너무 큽니다 (최대 5MB)',
  QUOTA_EXCEEDED: '일일 업로드 용량을 초과했습니다',
  PUBLISH_FAILED: '독후감 게시 중 오류가 발생했습니다',
  AUTO_SAVE_FAILED: '자동저장에 실패했습니다'
};
```

## 접근성

### 키보드 단축키
```typescript
const useKeyboardShortcuts = (
  onBold: () => void,
  onItalic: () => void,
  onSave: () => void
) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'b':
            event.preventDefault();
            onBold();
            break;
          case 'i':
            event.preventDefault();
            onItalic();
            break;
          case 's':
            event.preventDefault();
            onSave();
            break;
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onBold, onItalic, onSave]);
};
```

## 성능 최적화

### 에디터 최적화
```typescript
// 대용량 텍스트 처리를 위한 가상화
const VirtualizedEditor = React.memo(({ value, onChange }: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // 디바운스된 onChange
  const debouncedOnChange = useMemo(
    () => debounce(onChange, 300),
    [onChange]
  );
  
  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => debouncedOnChange(e.target.value)}
      className="w-full h-full resize-none outline-none p-4"
      placeholder="독후감을 작성해주세요..."
    />
  );
});
```

## 성능 목표

### Core Web Vitals
- **LCP**: < 2.5초 (에디터 로딩)
- **FID**: < 100ms (타이핑 응답성)
- **CLS**: < 0.1 (자동저장 상태 변경)

### 사용자 경험 지표
- 에디터 초기화: < 1초
- 자동저장 응답: < 2초
- 이미지 업로드: < 5초
- 미리보기 렌더링: < 500ms

## 도입 기술 및 설치 패키지

### 에디터 및 콘텐츠 처리
- 에디터: Lexical 기반 WYSIWYG 에디터 채택
  - 패키지: `lexical`, `@lexical/react`, `@lexical/rich-text`, `@lexical/history`, `@lexical/utils`, `@lexical/link`, `@lexical/list`, `@lexical/code`, `@lexical/selection`, `@lexical/html`, `@lexical/markdown`
  - 목적: 마크다운 문법 입력 시 즉시 서식 적용(Markdown Shortcuts), 미리보기 없이 WYSIWYG 편집, 커스텀 노드 확장성 확보(이미지/북카드 등)
- 마크다운 지원: `@lexical/markdown`으로 기본 MD 입력 패턴 자동 변환(혼합 경험: 입력은 MD, 결과는 리치 텍스트)
- 렌더링 보안: `DOMPurify`로 HTML sanitize 후 출력(이미 의존성 존재)

### 저장 포맷 및 자동저장
- 초안 저장(Draft): Lexical JSON(`contentJson`) + Sanitized HTML(`contentHtml`) 동시 보관(서버/로컬)
- 게시 저장(Publish): `Review.content`에 Sanitized HTML 저장(향후 `contentJson` 컬럼 추가 여지)
- 자동저장: 2초 디바운스 + 30초 주기 저장, 페이지 이탈 보호(beforeunload)

### 가시성(Visibility) 및 추천 정책
- 추천: `isRecommended`(boolean)만 사용(별점(0~5) 미도입)
- 가시성 타입(프론트): `'public' | 'followers' | 'private'`
  - 현재 매핑: `public` → `isPublic=true`, `private` → `isPublic=false`
  - `followers`는 UI에 노출 가능하나 서버 저장은 보류(추후 권한/모델 확장 시 활성화)

### 초안 모델(ReviewDraft) 분리
- 테이블 분리: `ReviewDraft` 별도 테이블로 관리(권장)
  - 이점: 피드/통계 쿼리 오염 방지, 초안 전용 TTL/버전 관리, 자동저장 쓰기 부하 분리, 대용량 JSON 보관 용이
  - 핵심 필드 예: `id, userId, bookId?, isRecommended?, tags(json), visibility?, contentHtml, contentJson, updatedAt`

### 검색 페이지 전략 (업데이트됨)
- **독후감 작성** (`/write`): 카카오 API 전용으로 모든 도서 검색 가능
- **도서 검색** (`/search`): DB 우선으로 실제 리뷰가 있는 도서만 표시
- **작성 연계**: 도서 검색에서 선택 시 `bookId`로 전달, 독후감 작성에서는 게시 시 자동 생성

### 설치/도입 패키지 목록
- Frontend
  - `lexical`, `@lexical/react`, `@lexical/rich-text`, `@lexical/history`, `@lexical/utils`, `@lexical/link`, `@lexical/list`, `@lexical/code`, `@lexical/selection`, `@lexical/html`, `@lexical/markdown`
  - `dompurify`(이미 사용 중)
- Backend
  - `cloudinary`(서버사이드 업로드/서명 지원)
  - `multer`(multipart 처리, 이미 의존성 존재)

### 환경 변수(예시)
- Kakao: `KAKAO_API_KEY`, `KAKAO_BOOK_API_URL`
- Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### 향후 확장 포인트
- `Review.contentJson` 컬럼 도입으로 WYSIWYG 재편집 정확도 향상
- `visibility` 컬럼(ENUM) 및 팔로워 기반 접근 제어 가드 도입
- Lexical 커스텀 노드(이미지 캡션/정렬, 북카드, 해시태그 칩) 추가
