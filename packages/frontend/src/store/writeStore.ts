import { create } from 'zustand'
import DOMPurify from 'dompurify'
import { authenticatedApiCall } from './authStore'

type Visibility = 'public' | 'followers' | 'private'

export interface BookSummary {
  id?: string
  title: string
  author: string
  publisher?: string
  publishedAt?: string
  isbn?: string
  thumbnail?: string
  description?: string
  // data provenance and status
  source?: 'db' | 'api' | 'manual'
  isExisting?: boolean
  // optional stats when coming from DB search
  stats?: {
    reviewCount: number
    averageRating?: number
  }
}

interface DraftPayload {
  bookId?: string
  isRecommended?: boolean
  tags?: string[]
  visibility?: Visibility
  contentHtml: string
  contentJson: string
  title?: string
}

interface WriteState {
  // UI
  currentStep: 'book-search' | 'writing'

  // Data
  selectedBook: BookSummary | null
  title: string
  isRecommended: boolean
  tags: string[]
  visibility: Visibility
  contentHtml: string
  contentJson: string

  // Draft/Save
  draftId: string | null
  lastSavedAt: string | null
  isSaving: boolean
  hasUnsavedChanges: boolean

  // Actions
  setStep: (s: WriteState['currentStep']) => void
  setSelectedBook: (b: BookSummary | null) => void
  setTitle: (t: string) => void
  setRecommended: (v: boolean) => void
  setTags: (tags: string[]) => void
  setVisibility: (v: Visibility) => void
  setContent: (html: string, json: string) => void

  // API-like
  searchBooks: (
    query: string,
    page?: number,
    size?: number,
    source?: 'db' | 'kakao'
  ) => Promise<{
    books: BookSummary[]
    total?: number
    hasMore: boolean
    source?: 'db' | 'api'
  }>
  getBookById: (bookId: string) => Promise<BookSummary | null>
  saveDraft: () => Promise<void>
  loadDraft: () => Promise<void>
  publish: () => Promise<string>
  uploadImage: (file: File) => Promise<string>
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'

const STORAGE_KEY = 'write-draft'

const sanitize = (html: string) =>
  DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1','h2','h3','h4','h5','h6',
      'p','br','strong','em','u','del',
      'ul','ol','li','blockquote','code','pre',
      'a','img','hr'
    ],
    ALLOWED_ATTR: ['href','src','alt','title','target','rel'],
  })

export const useWriteStore = create<WriteState>((set, get) => ({
  currentStep: 'book-search',
  selectedBook: null,
  title: '',
  isRecommended: true,
  tags: [],
  visibility: 'public',
  contentHtml: '',
  contentJson: '',
  draftId: null,
  lastSavedAt: null,
  isSaving: false,
  hasUnsavedChanges: false,

  setStep: (s) => set({ currentStep: s }),
  setSelectedBook: (b) => set({ selectedBook: b, hasUnsavedChanges: true }),
  setTitle: (t) => set({ title: t, hasUnsavedChanges: true }),
  setRecommended: (v) => set({ isRecommended: v, hasUnsavedChanges: true }),
  setTags: (tags) => set({ tags, hasUnsavedChanges: true }),
  setVisibility: (v) => set({ visibility: v, hasUnsavedChanges: true }),
  setContent: (html, json) => set({ contentHtml: sanitize(html), contentJson: json, hasUnsavedChanges: true }),

  searchBooks: async (query: string, page = 1, size = 20, source?: 'db' | 'kakao') => {
    if (!query.trim()) {return { books: [], total: 0, hasMore: false }}
    try {
      const url = new URL(`${API_BASE_URL}/api/books/search`)

      url.searchParams.set('query', query)
      url.searchParams.set('page', String(page))
      url.searchParams.set('size', String(size))
      if (source) {url.searchParams.set('source', source)}
      // avoid adding unknown query params (ValidationPipe forbids non‑whitelisted keys)
      const res = await fetch(url.toString(), { credentials: 'include', cache: 'no-store' })

      if (!res.ok) {throw new Error('BOOK_SEARCH_FAILED')}
      const json = await res.json()
      const data = json?.data ?? json
      const globalSource = data?.source // 'db' | 'kakao'
      const rawBooks = (data?.books ?? data?.results ?? [])
      const books = rawBooks.map((b: {
        id?: string;
        title: string;
        author: string;
        publisher?: string;
        publishedAt?: string;
        publishedDate?: string;
        isbn?: string;
        thumbnail?: string;
        coverImage?: string;
        description?: string;
        source?: string;
        stats?: { reviewCount: number; averageRating?: number };
      }) => {
        const srcRaw: string | undefined = b?.source ?? globalSource
        const norm = typeof srcRaw === 'string' ? srcRaw.toLowerCase() : undefined
        const source: 'db' | 'api' | undefined = b?.id
          ? 'db'
          : norm === 'db'
          ? 'db'
          : norm === 'kakao' || norm === 'api' || norm === 'kakao_api'
          ? 'api'
          : undefined

        const stats = b?.stats
          ? (() => {
              const result: { reviewCount: number; averageRating?: number } = {
                reviewCount: Number(b.stats.reviewCount ?? 0),
              }

              if (typeof b.stats.averageRating === 'number') {
                result.averageRating = b.stats.averageRating
              }

              return result
            })()
          : undefined

        const mapped: BookSummary = {
          title: b.title,
          author: b.author,
          isExisting: Boolean(b.id),
        }

        if (b.id !== undefined) {mapped.id = b.id}
        if (b.publisher !== undefined) {mapped.publisher = b.publisher}
        const publishedDate = b.publishedAt ?? b.publishedDate

        if (publishedDate !== undefined) {mapped.publishedAt = publishedDate}
        if (b.isbn !== undefined) {mapped.isbn = b.isbn}
        const thumbnailValue = b.thumbnail ?? b.coverImage

        if (thumbnailValue !== undefined) {mapped.thumbnail = thumbnailValue}
        if (b.description !== undefined) {mapped.description = b.description}
        if (source !== undefined) {mapped.source = source}
        if (stats) {mapped.stats = stats}

        return mapped
      }) as BookSummary[]
      const pagination = data?.pagination
      const hasMore = typeof data?.hasMore === 'boolean'
        ? data.hasMore
        : typeof pagination?.total === 'number'
        ? page * size < Number(pagination.total)
        : rawBooks.length === size
      const total = typeof data?.total === 'number' ? data.total : pagination?.total
      const mappedSource: 'db' | 'api' | undefined = (typeof globalSource === 'string' && globalSource.toLowerCase() === 'kakao') ? 'api' : globalSource

      return mappedSource !== undefined ? { books, hasMore, total, source: mappedSource } : { books, hasMore, total }
    } catch {
      return { books: [], total: 0, hasMore: false }
    }
  },

  getBookById: async (bookId: string) => {
    if (!bookId) {return null}
    try {
      const url = `${API_BASE_URL}/api/books/${encodeURIComponent(bookId)}`
      const res = await fetch(url, { credentials: 'include' })

      if (!res.ok) {throw new Error('BOOK_FETCH_FAILED')}
      const data = await res.json()
      const b = data?.data?.book

      if (!b) {return null}

      return {
        id: b.id,
        title: b.title,
        author: b.author,
        publisher: b.publisher,
        publishedAt: b.publishedAt,
        isbn: b.isbn,
        thumbnail: b.thumbnail,
        description: b.description,
        isExisting: true,
        source: 'db',
      } as BookSummary
    } catch {
      return null
    }
  },


  saveDraft: async () => {
    const s = get()
    const payload: DraftPayload = {
      isRecommended: s.isRecommended,
      tags: s.tags,
      visibility: s.visibility,
      contentHtml: s.contentHtml,
      contentJson: s.contentJson,
      title: s.title,
      ...(s.selectedBook?.id ? { bookId: s.selectedBook.id } : {}),
    }

    // Save to localStorage immediately
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...payload, savedAt: new Date().toISOString() }))

    // Try server draft API (optional; may not exist yet)
    try {
      set({ isSaving: true })
      const resJson = await authenticatedApiCall('/api/reviews/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (resJson) {
        const result = resJson

        set({ draftId: result?.draftId ?? result?.data?.draftId ?? null, lastSavedAt: result?.savedAt ?? result?.data?.savedAt ?? new Date().toISOString(), isSaving: false, hasUnsavedChanges: false })

        return
      }
    } catch {
      // ignore server draft errors for now
    } finally {
      set({ isSaving: false })
    }

    // Fallback: mark local save
    set({ lastSavedAt: new Date().toISOString(), hasUnsavedChanges: false })
  },

  loadDraft: async () => {
    try {
      const localRaw = localStorage.getItem(STORAGE_KEY)
      const localData = localRaw ? JSON.parse(localRaw) : null
      let latest = localData

      // Try server draft
      try {
        const data = await authenticatedApiCall('/api/reviews/drafts/latest')
        const serverDraft = data?.data?.draft ?? data?.draft

        if (serverDraft) {
          latest = serverDraft
        }
      } catch {
        // ignore server errors
      }

      if (!latest) {return}
      set({
        title: latest.title ?? '',
        isRecommended: latest.isRecommended ?? true,
        tags: latest.tags ? (Array.isArray(latest.tags) ? latest.tags : JSON.parse(latest.tags)) : [],
        visibility: latest.visibility ?? 'public',
        contentHtml: latest.contentHtml ?? '',
        contentJson: latest.contentJson ?? '',
      })
    } catch {
      // ignore parse errors
    }
  },

  publish: async () => {
    const s = get()

    if (!s.selectedBook) {throw new Error('BOOK_REQUIRED')}
    if (!s.title.trim()) {throw new Error('TITLE_REQUIRED')}
    if (!s.contentHtml.trim()) {throw new Error('CONTENT_REQUIRED')}

    const body = {
      ...(s.selectedBook.id 
        ? { bookId: s.selectedBook.id }
        : {
            bookData: {
              isbn: s.selectedBook.isbn,
              title: s.selectedBook.title,
              author: s.selectedBook.author,
              publisher: s.selectedBook.publisher,
              publishedAt: s.selectedBook.publishedAt,
              thumbnail: s.selectedBook.thumbnail,
              description: s.selectedBook.description
            }
          }
      ),
      title: s.title,
      content: s.contentHtml,
      isRecommended: s.isRecommended,
      // rating omitted by policy
      tags: s.tags,
      isPublic: s.visibility === 'public',
    }

    const result = await authenticatedApiCall('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const reviewId = result?.data?.review?.id

    if (!reviewId) {throw new Error('PUBLISH_FAILED')}
    // Clear local draft on publish
    localStorage.removeItem(STORAGE_KEY)

    return reviewId as string
  },
  
  uploadImage: async (file: File) => {
    if (!file.type.startsWith('image/')) {throw new Error('이미지 파일만 업로드 가능합니다')}
    if (file.size > 5 * 1024 * 1024) {throw new Error('이미지 크기는 5MB 이하여야 합니다')}

    const fd = new FormData()

    fd.append('file', file)
    const result = await authenticatedApiCall('/api/upload/image', {
      method: 'POST',
      body: fd as unknown as BodyInit,
    })
    const url = result?.data?.url

    if (!url) {throw new Error('이미지 업로드에 실패했습니다')}

    return url as string
  },
}))

export default useWriteStore
