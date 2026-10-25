import { useState, useCallback } from 'react';
import { useQuery, useAction } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
import { api } from 'convex/_generated/api';
import { useDebounce } from './useDebounce';
import type { Id } from 'convex/_generated/dataModel';

// 로컬 DB에 저장된 책 타입
export interface LocalBook {
  _id: Id<'books'>;
  isbn?: string;
  title: string;
  author: string;
  publisher?: string;
  publishedDate?: number;
  coverImageUrl?: string;
  description?: string;
  externalSource?: 'GOOGLE_BOOKS' | 'ALADIN' | 'KAKAO' | 'MANUAL';
  externalId?: string;
}

// 외부(카카오 책 검색) 검색 결과 타입 (DB 저장 전)
export type ExternalBook = FunctionReturnType<
  typeof api.bookSearch.searchBooks
>['books'][number];

interface UseBookSearchResult {
  // 상태
  isSearchingLocal: boolean;
  isSearchingExternal: boolean;
  localResults: LocalBook[];
  externalResults: ExternalBook[];
  externalError: string | null;

  // 액션
  triggerExternalSearch: () => Promise<void>;
  selectExternalBook: (book: ExternalBook) => Promise<Id<'books'>>;
  clearExternalResults: () => void;

  // 헬퍼
  hasLocalResults: boolean;
  hasExternalResults: boolean;
  hasSearched: boolean;
}

/**
 * 책 검색 통합 훅
 * ReadZone에 이미 있는 책(로컬 DB) + 카카오 책 검색을 함께 관리
 */
export function useBookSearch(query: string): UseBookSearchResult {
  const [isSearchingExternal, setIsSearchingExternal] = useState(false);
  const [externalResults, setExternalResults] = useState<ExternalBook[]>([]);
  const [externalError, setExternalError] = useState<string | null>(null);
  const [hasSearchedExternal, setHasSearchedExternal] = useState(false);

  const debouncedQuery = useDebounce(query, 500);

  // 로컬 DB 검색
  const localResults = useQuery(
    api.books.search,
    debouncedQuery.trim().length >= 2
      ? { query: debouncedQuery.trim(), limit: 10 }
      : 'skip'
  ) as LocalBook[] | undefined;

  const searchBooks = useAction(api.bookSearch.searchBooks);
  const importBook = useAction(api.bookSearch.importBook);

  const triggerExternalSearch = useCallback(async () => {
    if (debouncedQuery.trim().length < 2) {
      return;
    }

    setIsSearchingExternal(true);
    setExternalError(null);
    setHasSearchedExternal(true);

    try {
      const result = await searchBooks({
        query: debouncedQuery.trim(),
        size: 20,
      });

      // ReadZone에 이미 있는 책은 위쪽 목록에 나오므로 제외 (ISBN 기준)
      const localIsbns = new Set(
        (localResults || [])
          .map((book) => book.isbn)
          .filter((isbn): isbn is string => Boolean(isbn))
      );

      setExternalResults(
        result.books.filter((book) => !book.isbn || !localIsbns.has(book.isbn))
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '도서 검색에 실패했습니다';
      setExternalError(message);
      console.error('Book search error:', error);
    } finally {
      setIsSearchingExternal(false);
    }
  }, [debouncedQuery, localResults, searchBooks]);

  // 검색 결과에서 고른 책을 ReadZone에 저장
  const selectExternalBook = useCallback(
    (book: ExternalBook): Promise<Id<'books'>> => importBook({ book }),
    [importBook]
  );

  const clearExternalResults = useCallback(() => {
    setExternalResults([]);
    setExternalError(null);
    setHasSearchedExternal(false);
  }, []);

  return {
    // 상태
    isSearchingLocal: debouncedQuery.length >= 2 && localResults === undefined,
    isSearchingExternal,
    localResults: localResults || [],
    externalResults,
    externalError,

    // 액션
    triggerExternalSearch,
    selectExternalBook,
    clearExternalResults,

    // 헬퍼
    hasLocalResults: (localResults || []).length > 0,
    hasExternalResults: externalResults.length > 0,
    hasSearched: hasSearchedExternal,
  };
}
