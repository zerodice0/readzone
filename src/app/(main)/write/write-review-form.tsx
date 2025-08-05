'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { BookSelector } from '@/components/book/book-selector'
import { RichTextEditor } from '@/components/editor/rich-text-editor'
import { TagInput } from '@/components/ui/tag-input'
import { useHtmlAutosave } from '@/hooks/use-html-autosave'
import { postJson, extractData, ApiError } from '@/lib/api-client'
import type { CreateReviewResponse } from '@/types/api-responses'
import { 
  Save, 
  Eye, 
  BookOpen, 
  Heart, 
  HeartOff,
  Link,
  Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { CreateReviewRequest } from '@/hooks/use-reviews-api'

interface SelectedBook {
  id: string
  title: string
  authors: string[]
  thumbnail?: string
  publisher?: string
  genre?: string
  isbn?: string
  kakaoData?: {
    title: string
    authors: string[]
    publisher?: string
    genre?: string
    thumbnail?: string
    isbn?: string
    url?: string
  }
}

interface ReviewFormData {
  bookId: string
  title: string
  content: string
  isRecommended: boolean
  tags: string[]
  purchaseLink: string
}

const POPULAR_TAGS = [
  '재미있음', '감동적', '지루함', '놀라움', '슬픔', '따뜻함',
  '로맨스', '판타지', '미스터리', '추리', 'SF', '역사', '자기계발',
  '초보자추천', '전문가용', '청소년추천', '성인추천',
  '쉬운책', '어려운책', '중간난이도',
  '짧은책', '긴책', '시리즈', '번역서', '한국작가', '외국작가'
]

export default function WriteReviewForm() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // 폼 상태
  const [selectedBook, setSelectedBook] = useState<SelectedBook | null>(null)
  const [formData, setFormData] = useState<ReviewFormData>({
    bookId: '',
    title: '',
    content: '',
    isRecommended: true,
    tags: [],
    purchaseLink: ''
  })
  
  // UI 상태
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showBookSelector, setShowBookSelector] = useState(true)
  const [tagSuggestions, setTagSuggestions] = useState<string[]>(POPULAR_TAGS)
  const [isLoadingDraft, setIsLoadingDraft] = useState(false)
  const [draftLoaded, setDraftLoaded] = useState(false)

  // 초기 데이터 복구 완료 플래그 추가
  const isInitialRestoreCompleted = useRef(false)
  
  // HTML 콘텐츠 특화 자동저장 설정
  const autosave = useHtmlAutosave<{
    content?: string;
    selectedBook?: typeof selectedBook;
    formData?: typeof formData;
  }>({
    key: `review-draft-${session?.user?.id || 'anonymous'}`,
    data: {
      content: formData.content,
      selectedBook,
      formData
    },
    storage: 'both',
    compareTextOnly: false,  // HTML 구조 변경도 감지
    minTextLength: 10,       // 실제 텍스트 10자 이상일 때만 저장
    onSave: async (data) => {
      if (data.selectedBook && data.formData?.content) {
        await fetch('/api/reviews/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: data.formData?.content,
            bookId: data.selectedBook.id,
            title: data.formData?.title,
            metadata: {
              book: data.selectedBook,
              isRecommended: data.formData?.isRecommended,
              tags: data.formData?.tags,
              purchaseLink: data.formData?.purchaseLink
            }
          })
        })
      }
    },
    onError: (error) => {
      console.error('자동저장 실패:', error)
      toast.error('자동저장에 실패했습니다.')
    },
    onSuccess: () => {
      console.log('자동저장 완료')
    }
  })

  // autosave 참조를 최신 상태로 업데이트
  const autosaveRef = useRef(autosave)
  useEffect(() => {
    autosaveRef.current = autosave
  }, [autosave])

  // 세션 체크 및 리다이렉트
  useEffect(() => {
    if (!session) {
      router.push('/login?callbackUrl=/write')
    }
  }, [session, router])

  // Draft 로딩 함수 - 향상된 에러 처리 및 fallback 전략
  const loadDraft = useCallback(async (draftId: string) => {
    setIsLoadingDraft(true)
    try {
      const response = await fetch(`/api/reviews/draft/${draftId}`)
      
      if (!response.ok) {
        // 상태 코드별 세분화된 처리
        if (response.status === 404) {
          toast.error('요청하신 임시저장 데이터를 찾을 수 없습니다.')
        } else if (response.status === 401) {
          toast.error('로그인이 만료되었습니다. 다시 로그인해주세요.')
        } else if (response.status >= 500) {
          toast.error('서버 오류로 임시저장을 불러올 수 없습니다.')
        } else {
          toast.error('임시저장을 불러오는 중 문제가 발생했습니다.')
        }
        
        // 서버 draft 로드 실패 시 localStorage에서 fallback 시도
        try {
          const restored = autosave.restore()
          if (restored && restored.selectedBook && restored.formData) {
            setSelectedBook(restored.selectedBook)
            setFormData(restored.formData)
            setShowBookSelector(false)
            toast.success('로컬에 저장된 내용을 복원했습니다.')
            isInitialRestoreCompleted.current = true
            return
          }
        } catch (fallbackError) {
          console.warn('Fallback restoration failed:', fallbackError)
        }
        
        return // draft 로드 실패해도 페이지는 정상 작동
      }

      const data = await response.json()
      const draft = data.data?.draft

      if (!draft) {
        toast.error('임시저장 데이터가 손상되었습니다.')
        return
      }

      // Parse metadata with error handling
      let metadata: any = {}
      try {
        metadata = typeof draft.metadata === 'string' 
          ? JSON.parse(draft.metadata) 
          : draft.metadata || {}
      } catch (e) {
        console.warn('Failed to parse draft metadata, using defaults:', e)
        metadata = {}
      }

      // Restore form data with validation
      setFormData({
        bookId: draft.bookId || '',
        title: draft.title || '',
        content: draft.content || '',
        isRecommended: metadata.isRecommended ?? true,
        tags: Array.isArray(metadata.tags) ? metadata.tags : [],
        purchaseLink: metadata.purchaseLink || ''
      })

      // Restore book data with error handling
      if (metadata.book) {
        setSelectedBook(metadata.book)
        setShowBookSelector(false)
      } else if (draft.bookData) {
        try {
          const bookData = typeof draft.bookData === 'string' 
            ? JSON.parse(draft.bookData) 
            : draft.bookData
          
          if (bookData && bookData.title) {
            setSelectedBook({
              id: draft.bookId || 'temp-' + Date.now(),
              title: bookData.title,
              authors: Array.isArray(bookData.authors) ? bookData.authors : [],
              thumbnail: bookData.thumbnail,
              publisher: bookData.publisher,
              genre: bookData.genre,
              isbn: bookData.isbn,
              kakaoData: bookData
            })
            setShowBookSelector(false)
          }
        } catch (e) {
          console.warn('Failed to parse book data:', e)
        }
      }

      setDraftLoaded(true)
      toast.success('작성하던 독후감을 불러왔습니다')

      // Clear draft from URL
      const url = new URL(window.location.href)
      url.searchParams.delete('draft')
      router.replace(url.pathname + url.search, { scroll: false })

    } catch (error) {
      console.error('Draft loading error:', error)
      
      // 네트워크 에러 등의 경우 fallback 시도
      try {
        const restored = autosave.restore()
        if (restored && restored.selectedBook && restored.formData) {
          setSelectedBook(restored.selectedBook)
          setFormData(restored.formData)
          setShowBookSelector(false)
          toast.success('로컬에 저장된 내용을 복원했습니다.')
          isInitialRestoreCompleted.current = true
          return
        }
      } catch (fallbackError) {
        console.warn('Emergency fallback failed:', fallbackError)
      }
      
      // 모든 복구 시도 실패 시 사용자 친화적 메시지
      toast.error('임시저장을 불러올 수 없지만, 새로 작성하실 수 있습니다.')
    } finally {
      setIsLoadingDraft(false)
    }
  }, [router, autosave])

  // URL에서 draft ID 확인 및 로딩
  useEffect(() => {
    const draftId = searchParams.get('draft')
    if (draftId && session?.user?.id && !draftLoaded && !isLoadingDraft) {
      loadDraft(draftId)
    }
  }, [searchParams, session?.user?.id, draftLoaded, isLoadingDraft, loadDraft])

  // Progressive Enhancement: 서버 draft → localStorage → 빈 폼 순서로 복구
  useEffect(() => {
    // 이미 복구가 완료되었으면 실행하지 않음
    if (isInitialRestoreCompleted.current) return
    
    const draftId = searchParams.get('draft')
    
    if (draftId && session?.user?.id && !draftLoaded && !isLoadingDraft) {
      // 1. 서버 draft 복구 시도
      loadDraft(draftId)
    } else if (!draftId && !draftLoaded && !isLoadingDraft) {
      // 2. localStorage에서 복구 시도 (서버 draft가 없을 때)
      try {
        const restored = autosave.restore()
        if (restored && restored.selectedBook && restored.formData) {
          setSelectedBook(restored.selectedBook)
          setFormData(restored.formData)
          setShowBookSelector(false)
          toast.success('이전에 작성하던 내용을 복원했습니다.')
          
          // 복구 완료 플래그 설정
          isInitialRestoreCompleted.current = true
        } else {
          // 3. 복구할 데이터가 없으면 빈 폼으로 시작
          isInitialRestoreCompleted.current = true
        }
      } catch (error) {
        // localStorage 복구 실패 시 조용히 처리
        console.warn('Failed to restore from localStorage:', error)
        isInitialRestoreCompleted.current = true
      }
    }
  }, [searchParams, session?.user?.id, draftLoaded, isLoadingDraft, loadDraft])

  // 도서 선택 처리
  const handleBookSelect = (book: SelectedBook) => {
    setSelectedBook(book)
    setFormData(prev => ({ ...prev, bookId: book.id }))
    setShowBookSelector(false)
    
    // 도서 장르에 따른 태그 추천
    if (book.genre) {
      const genreTags = POPULAR_TAGS.filter(tag => 
        tag.toLowerCase().includes(book.genre!.toLowerCase()) ||
        book.genre!.toLowerCase().includes(tag.toLowerCase())
      )
      setTagSuggestions([...genreTags, ...POPULAR_TAGS.filter(tag => !genreTags.includes(tag))])
    }
  }

  // 폼 데이터 업데이트
  const updateFormData = (updates: Partial<ReviewFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }


  // 독후감 제출
  const handleSubmit = async () => {
    if (!selectedBook) {
      toast.error('도서를 선택해주세요.')
      return
    }

    // HTML 태그를 제거한 실제 텍스트 길이 체크
    const textLength = formData.content.replace(/<[^>]*>/g, '').trim().length
    if (textLength < 10) {
      toast.error('독후감 내용을 10자 이상 작성해주세요.')
      return
    }

    setIsSubmitting(true)

    try {
      // 임시 도서인 경우 카카오 데이터도 함께 전송
      const requestData: CreateReviewRequest = {
        bookId: formData.bookId,
        title: formData.title || undefined,
        content: formData.content,
        isRecommended: formData.isRecommended,
        tags: formData.tags,
        purchaseLink: formData.purchaseLink || undefined,
      }

      // 임시 도서인 경우 카카오 원본 데이터 포함 (fallback 포함)
      if (selectedBook && formData.bookId.startsWith('temp_')) {
        if ('kakaoData' in selectedBook && selectedBook.kakaoData) {
          // 원본 카카오 데이터가 있는 경우
          requestData.kakaoData = selectedBook.kakaoData
        } else {
          // fallback: selectedBook 자체를 카카오 데이터로 사용
          requestData.kakaoData = {
            title: selectedBook.title,
            authors: selectedBook.authors,
            publisher: selectedBook.publisher,
            genre: selectedBook.genre,
            thumbnail: selectedBook.thumbnail,
            isbn: selectedBook.isbn,
            url: undefined // 복원 시 손실된 경우
          }
        }
      }

      // 타입 안전한 API 요청
      const response = await postJson<CreateReviewRequest, CreateReviewResponse>('/api/reviews', requestData);

      // 데이터 추출 (타입 안전)
      const data = extractData(response);
      
      // 임시저장 데이터 삭제
      autosave.clear();
      
      toast.success('독후감이 성공적으로 게시되었습니다!');
      // 이제 TypeScript가 data.review.id의 존재를 보장합니다
      router.push(`/review/${data.review.id}`);
    } catch (error) {
      console.error('독후감 게시 실패:', error);
      
      // ApiError 타입 체크로 더 나은 에러 메시지 제공
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error('독후감 게시에 실패했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // 임시저장 수동 트리거 - 안전한 래퍼 함수로 변경
  const handleSave = useCallback(async () => {
    try {
      await autosaveRef.current.save()
      toast.success('임시저장되었습니다.')
    } catch (error) {
      console.error('수동 저장 실패:', error)
      toast.error('저장에 실패했습니다.')
    }
  }, [])


  // event callback
  const handlePreview = () => 
    window.open(`/review/preview?data=${encodeURIComponent(JSON.stringify({ selectedBook, formData }))}`, '_blank');

  const handleChangePurchaseLink = (e: React.ChangeEvent<HTMLInputElement>) => updateFormData({ purchaseLink: e.target.value });
  const handleCancel = () => {
    if (confirm('작성을 취소하시겠습니까? 저장되지 않은 내용은 사라집니다.')) {
      router.push('/')
    }
  }
  const handleChangeTags = (tags: string[]) => updateFormData({ tags });
  const handleChangeTitle = (e: React.ChangeEvent<HTMLInputElement>) => updateFormData({ title: e.target.value });
  const handleChangeIsRecommended = (recommend: boolean) => updateFormData({ isRecommended: recommend });
  const handleChangeContent = (content: string) => updateFormData({ content });

  if (!session) {
    return (
      <Card className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600 dark:text-gray-400" />
        <p className="text-gray-700 dark:text-gray-300">로그인 페이지로 이동 중...</p>
      </Card>
    )
  }

  // Draft 로딩 중 상태
  if (isLoadingDraft) {
    return (
      <Card className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-600 dark:text-primary-400" />
        <p className="text-gray-700 dark:text-gray-300">작성하던 독후감을 불러오는 중...</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 자동저장 제어 */}
      {/* <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-blue-700 dark:text-blue-300">
              자동저장 활성화됨 (5분 간격)
            </span>
          </div>
          <div className="flex items-center gap-2">
            {autosave.error && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                저장 실패
              </Badge>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSave}
              disabled={autosave.isSaving}
            >
              {autosave.isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              수동 저장
            </Button>
          </div>
        </div>
      </Card> */}

      {/* 도서 선택 */}
      {showBookSelector ? (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">도서 선택</h2>
          </div>
          <BookSelector onSelect={handleBookSelect} />
        </Card>
      ) : selectedBook && (
        <Card className="p-6">
          <div className="flex items-start gap-4">
            {selectedBook.thumbnail && (
              <Image 
                src={selectedBook.thumbnail} 
                alt={selectedBook.title}
                width={64}
                height={80}
                className="w-16 h-20 object-cover rounded"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{selectedBook.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedBook.authors.join(', ')}
                {selectedBook.publisher && ` | ${selectedBook.publisher}`}
              </p>
              {selectedBook.genre && (
                <Badge variant="secondary" className="mt-1">
                  {selectedBook.genre}
                </Badge>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowBookSelector(true)}
            >
              다시 선택
            </Button>
          </div>
        </Card>
      )}

      {/* 독후감 작성 폼 */}
      {selectedBook && (
        <Card className="p-6 space-y-6">
          {/* 제목 입력 */}
          <div>
            <Label htmlFor="title" className="text-base font-medium text-gray-900 dark:text-gray-100">
              독후감 제목 <span className="text-gray-500 dark:text-gray-400">(선택사항)</span>
            </Label>
            <Input
              id="title"
              placeholder="독후감 제목을 입력하세요"
              value={formData.title}
              onChange={handleChangeTitle}
              maxLength={200}
              className="mt-2"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formData.title.length}/200자
            </p>
          </div>

          <Separator />

          {/* 추천/비추천 선택 */}
          <div>
            <Label className="text-base font-medium text-gray-900 dark:text-gray-100">이 책을 추천하시나요?</Label>
            <div className="flex items-center gap-4 mt-3">
              <Button
                variant={formData.isRecommended ? "default" : "outline"}
                onClick={() => handleChangeIsRecommended(true)}
                className="flex items-center gap-2"
              >
                <Heart className={`h-4 w-4 ${formData.isRecommended ? 'fill-current' : ''}`} />
                추천
              </Button>
              <Button
                variant={!formData.isRecommended ? "default" : "outline"}
                onClick={() => handleChangeIsRecommended(false)}
                className="flex items-center gap-2"
              >
                <HeartOff className="h-4 w-4" />
                비추천
              </Button>
            </div>
          </div>

          <Separator />

          {/* 내용 작성 */}
          <div>
            <Label className="text-base font-medium text-gray-900 dark:text-gray-100">독후감 내용</Label>
            <div className="mt-3">
              <RichTextEditor
                value={formData.content}
                onChange={handleChangeContent}
                placeholder="독후감 내용을 작성해주세요..."
                height="500px"
                onSave={handleSave}
                isLoading={autosave.isSaving}
                autofocus={true}
                // 자동저장 상태 통합
                autosaveStatus={autosave.status}
                lastSaved={autosave.lastSaved}
                showAutosaveStatus={true}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {formData.content.replace(/<[^>]*>/g, '').length}/50,000자 | 서식 도구를 사용해 내용을 꾸밀 수 있습니다.
            </p>
          </div>

          <Separator />

          {/* 해시태그 입력 */}
          <div>
            <Label className="text-base font-medium text-gray-900 dark:text-gray-100">해시태그</Label>
            <TagInput
              value={formData.tags}
              onChange={handleChangeTags}
              suggestions={tagSuggestions}
              placeholder="태그를 입력하세요"
              maxTags={10}
              className="mt-3"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              최대 10개까지 추가할 수 있습니다.
            </p>
          </div>

          <Separator />

          {/* 구매 링크 입력 */}
          <div>
            <Label htmlFor="purchaseLink" className="text-base font-medium text-gray-900 dark:text-gray-100">
              구매 링크 <span className="text-gray-500 dark:text-gray-400">(선택사항)</span>
            </Label>
            <div className="flex items-center gap-2 mt-2">
              <Link className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                id="purchaseLink"
                type="url"
                placeholder="https://example.com/book"
                value={formData.purchaseLink}
                onChange={handleChangePurchaseLink}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              독자들이 이 책을 구매할 수 있는 링크를 추가하세요.
            </p>
          </div>
        </Card>
      )}

      {/* 액션 버튼 */}
      {selectedBook && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={isSubmitting || autosave.isSaving}
              >
                {autosave.isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                임시저장
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={isSubmitting || !formData.content}
                className="hidden sm:flex"
              >
                <Eye className="h-4 w-4 mr-2" />
                미리보기
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.content || formData.content.replace(/<[^>]*>/g, '').trim().length < 10}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <BookOpen className="h-4 w-4 mr-2" />
                )}
                독후감 게시
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}