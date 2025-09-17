import { type KeyboardEvent, useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import useWriteStore, { type BookSummary } from '@/store/writeStore';
import { BookResultCard } from './BookResultCard';
import { ManualBookCard } from './ManualBookCard';
import { BookDetailModal } from './BookDetailModal';
import { DraftConfirmDialog } from '@/components/ui/draft-confirm-dialog';

export function BookSearchStep() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [results, setResults] = useState<BookSummary[]>([]);
  const pageRef = useRef<number>(1);
  const size = 20;
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [hasSearched, setHasSearched] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedForModal, setSelectedForModal] = useState<BookSummary | null>(
    null
  );
  const [draftDialogOpen, setDraftDialogOpen] = useState(false);
  const [pendingBook, setPendingBook] = useState<BookSummary | null>(null);
  const seenIsbn = useRef<Set<string>>(new Set());
  const seenId = useRef<Set<string>>(new Set());

  const searchBooks = useWriteStore((s) => s.searchBooks);
  const setSelectedBook = useWriteStore((s) => s.setSelectedBook);
  const setStep = useWriteStore((s) => s.setStep);
  const hasDraft = useWriteStore((s) => s.hasDraft);
  const getDraftInfo = useWriteStore((s) => s.getDraftInfo);
  const loadDraft = useWriteStore((s) => s.loadDraft);
  const clearDraft = useWriteStore((s) => s.clearDraft);

  const appendDedup = useCallback(
    (prev: BookSummary[], incoming: BookSummary[]) => {
      const next: BookSummary[] = [...prev];
      let duplicatedCount = 0;

      for (const b of incoming) {
        const key = b.id ?? `${b.title}-${b.isbn}`;
        const isDuplicated =
          next.filter((e) => e.id ?? `${e.title}-${e.isbn}` === key).length > 0;

        if (!isDuplicated) {
          next.push(b);
        } else {
          duplicatedCount++;
        }
      }

      if (total) {
        setTotal(total - duplicatedCount);
      }

      return next;
    },
    [total]
  );

  const onSearch = useCallback(async () => {
    setLoading(true);
    setHasSearched(true);
    setResults([]);
    pageRef.current = 1;
    setHasMore(false);
    setTotal(undefined);
    seenId.current = new Set();
    seenIsbn.current = new Set();

    try {
      const kakao = await searchBooks(q, 1, size, 'kakao');
      const newResults = appendDedup([], kakao.books as BookSummary[]);

      setResults(newResults);
      setHasMore(Boolean(kakao.hasMore));
      setTotal(kakao.total);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, [q, searchBooks, appendDedup]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) {
      return;
    }

    setLoadingMore(true);
    try {
      const nextPage = pageRef.current + 1;
      const r = await searchBooks(q, nextPage, size, 'kakao');

      setResults((prev) => appendDedup(prev, r.books));
      setHasMore(Boolean(r.hasMore));
      pageRef.current = nextPage;
    } catch (error) {
      console.error('Load more failed:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [q, size, loadingMore, hasMore, appendDedup, searchBooks]);

  const onBookSelect = (book: BookSummary) => {
    setSelectedForModal(book);
    setModalOpen(true);
  };

  const onModalConfirm = () => {
    if (selectedForModal) {
      // Check for existing draft before proceeding
      const existingDraft = hasDraft();

      if (existingDraft) {
        setPendingBook(selectedForModal);
        setDraftDialogOpen(true);
        setModalOpen(false);
        setSelectedForModal(null);
      } else {
        setSelectedBook(selectedForModal);
        setStep('writing');
        setModalOpen(false);
        setSelectedForModal(null);
      }
    }
  };

  const onUseDraft = async () => {
    if (pendingBook) {
      // Load existing draft and proceed with new book
      await loadDraft();
      setSelectedBook(pendingBook);
      setStep('writing');
    }
    setDraftDialogOpen(false);
    setPendingBook(null);
  };

  const onStartNew = () => {
    if (pendingBook) {
      // Clear all drafts and start fresh
      clearDraft();
      setSelectedBook(pendingBook);
      setStep('writing');
    }
    setDraftDialogOpen(false);
    setPendingBook(null);
  };

  const onModalCancel = () => {
    setModalOpen(false);
    setSelectedForModal(null);
  };

  const triggerRef = useInfiniteScroll({
    hasMore,
    isLoading: loadingMore,
    onLoadMore: loadMore,
  });

  return (
    <div className="space-y-4">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!loading && q.trim()) {
            void onSearch();
          }
        }}
      >
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' && !e.nativeEvent?.isComposing) {
              e.preventDefault();
              if (!loading && q.trim()) {
                void onSearch();
              }
            }
          }}
          placeholder="도서 제목/저자/ISBN으로 검색"
        />
        <Button type="submit" disabled={!q.trim() || loading}>
          {loading ? '검색 중...' : '검색'}
        </Button>
      </form>

      <div className="space-y-3">
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-xl border border-slate-200 bg-slate-50 animate-pulse"
              />
            ))}
          </div>
        ) : !hasSearched ? (
          <div className="text-center py-8">
            <div className="text-slate-500 mb-2">📚</div>
            <div className="text-sm text-slate-600">
              도서 제목, 저자 또는 ISBN으로 검색해보세요
            </div>
          </div>
        ) : results && results.length > 0 ? (
          <>
            <div className="text-sm text-slate-600">
              총 {total ?? results.length}권 · 소스: 카카오
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {results.map((b) => (
                <BookResultCard
                  key={b.id ?? `${b.title}-${b.isbn}`}
                  book={b}
                  onSelect={onBookSelect}
                  query={q}
                />
              ))}
            </div>
            <div ref={triggerRef} className="h-1" />
            {loadingMore && (
              <div className="flex justify-center py-4">
                <div className="text-sm text-slate-500">
                  더 많은 결과를 불러오는 중...
                </div>
              </div>
            )}
          </>
        ) : hasSearched ? (
          <div className="text-sm text-muted-foreground">
            검색 결과가 없습니다.
          </div>
        ) : null}

        {hasSearched && results.length === 0 && (
          <ManualBookCard onSelect={onBookSelect} />
        )}
      </div>

      <BookDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        book={selectedForModal}
        onConfirm={onModalConfirm}
        onCancel={onModalCancel}
      />

      <DraftConfirmDialog
        open={draftDialogOpen}
        onOpenChange={setDraftDialogOpen}
        bookTitle={pendingBook?.title ?? ''}
        draftBookTitle={getDraftInfo()?.bookTitle}
        draftBookAuthor={getDraftInfo()?.bookAuthor}
        onUseDraft={onUseDraft}
        onStartNew={onStartNew}
      />
    </div>
  );
}
