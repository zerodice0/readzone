// Unified book types for the book selector system

export interface BaseBook {
  title: string
  authors: string[]
  thumbnail?: string
  publisher?: string
  genre?: string
  isbn?: string
  isManualEntry?: boolean
}

export interface CommunityBook extends BaseBook {
  id: string
  selectionCount?: number
  communityBook?: boolean
}

export interface KakaoBook extends BaseBook {
  id?: string
  newBook?: boolean
  kakaoBook?: boolean
  url?: string
  communityExists?: boolean
  existingBookId?: string
}

export interface ManualBook extends BaseBook {
  id?: string
}

export interface SelectedBook extends BaseBook {
  id: string
  _kakaoData?: {
    title: string
    authors: string[]
    publisher?: string
    genre?: string
    thumbnail?: string
    isbn?: string
    url?: string
  }
}

export type SearchTabId = 'community' | 'kakao' | 'manual'

export interface SearchTab {
  id: SearchTabId
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}