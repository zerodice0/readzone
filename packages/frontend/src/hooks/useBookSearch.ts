import { useState, useCallback } from 'react';
import { useQuery, useAction, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { useDebounce } from './useDebounce';
import type { Id } from 'convex/_generated/dataModel';

// 로컬 DB에 저장된 책 타입
export interface LocalBook {
  _id: Id<'books'>;
  title: string;
  author: string;
  publisher?: string;
  publishedDate?: number;
  coverImageUrl?: string;
  description?: string;
  externalSource?: 'GOOGLE_BOOKS' | 'ALADIN' | 'MANUAL';
  externalId?: string;
}

// 알라딘 검색 결과 타입 (DB 저장 전)
export interface AladinBook {
  externalId: string;
  externalSource: 'ALADIN';
  isbn: string | null;
  title: string;
  author: string;
  publisher: string | null;
  publishedDate: number | null;
  coverImageUrl: string | null;
  description: string | null;
  pageCount: number | null;
  language: string | null;
}

interface UseBookSearchResult {
  // 상태
  isSearchingLocal: boolean;
  isSearchingAladin: boolean;
  localResults: LocalBook[];
  aladinResults: AladinBook[];
  aladinError: string | null;

  // 액션
  triggerAladinSearch: () => Promise<void>;
  selectAladinBook: (book: AladinBook) => Promise<Id<'books'>>;
  clearAladinResults: () => void;

  // 헬퍼
  hasLocalResults: boolean;
  hasAladinResults: boolean;
  hasSearched: boolean;
}

/**
 * 책 검색 통합 훅
 * 로컬 DB 검색 + 알라딘 API 검색을 통합 관리
 */
export function useBookSearch(query: string): UseBookSearchResult {
  const [isSearchingAladin, setIsSearchingAladin] = useState(false);
  const [aladinResults, setAladinResults] = useState<AladinBook[]>([]);
  const [aladinError, setAladinError] = useState<string | null>(null);
  const [hasSearchedAladin, setHasSearchedAladin] = useState(false);

  const debouncedQuery = useDebounce(query, 500);

  // 로컬 DB 검색 (기존 쿼리)
  const localResults = useQuery(
    api.books.search,
    debouncedQuery.trim().length >= 2
      ? { query: debouncedQuery.trim(), limit: 10 }
      : 'skip'
  ) as LocalBook[] | undefined;

  // 알라딘 검색 Action
  const searchAladin = useAction(api.aladin.searchBooks);

  // 알라딘 책 저장 Mutation
  const saveFromAladin = useMutation(api.books.saveFromAladin);

  // 알라딘 검색 트리거
  const triggerAladinSearch = useCallback(async () => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
      return;
    }

    setIsSearchingAladin(true);
    setAladinError(null);
    setHasSearchedAladin(true);

    try {
      const result = await searchAladin({
        query: debouncedQuery.trim(),
        maxResults: 10,
      });

      // 로컬 DB에 이미 있는 책 제외 (externalId 기준)
      const localExternalIds = new Set(
        (localResults || [])
          .filter((b) => b.externalSource === 'ALADIN' && b.externalId)
          .map((b) => b.externalId)
      );

      const newBooks = result.books.filter(
        (book: AladinBook) => !localExternalIds.has(book.externalId)
      );

      setAladinResults(newBooks);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '알라딘 검색에 실패했습니다';
      setAladinError(message);
      console.error('Aladin search error:', error);
    } finally {
      setIsSearchingAladin(false);
    }
  }, [debouncedQuery, localResults, searchAladin]);

  // 알라딘 책 선택 시 DB에 저장
  const selectAladinBook = useCallback(
    async (book: AladinBook): Promise<Id<'books'>> => {
      const bookId = await saveFromAladin({
        externalId: book.externalId,
        isbn: book.isbn || undefined,
        title: book.title,
        author: book.author,
        publisher: book.publisher || undefined,
        publishedDate: book.publishedDate || undefined,
        coverImageUrl: book.coverImageUrl || undefined,
        description: book.description || undefined,
        pageCount: book.pageCount || undefined,
        language: book.language || undefined,
      });

      return bookId;
    },
    [saveFromAladin]
  );

  // 알라딘 결과 초기화
  const clearAladinResults = useCallback(() => {
    setAladinResults([]);
    setAladinError(null);
    setHasSearchedAladin(false);
  }, []);

  return {
    // 상태
    isSearchingLocal: debouncedQuery.length >= 2 && localResults === undefined,
    isSearchingAladin,
    localResults: localResults || [],
    aladinResults,
    aladinError,

    // 액션
    triggerAladinSearch,
    selectAladinBook,
    clearAladinResults,

    // 헬퍼
    hasLocalResults: (localResults || []).length > 0,
    hasAladinResults: aladinResults.length > 0,
    hasSearched: hasSearchedAladin,
  };
}
