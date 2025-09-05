import { createFileRoute, useNavigate } from '@tanstack/react-router';
import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import LexicalEditor from '@/components/editor/LexicalEditor';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import useWriteStore, { type BookSummary } from '@/store/writeStore';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

// Simple debounce helper
const useDebounced = (cb: () => void, delay = 2000, deps: unknown[] = []) => {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => cb(), delay);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

function useQueryParam(name: string) {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search);

    return params.get(name) ?? undefined;
  }, [name]);
}

// Simple query highlighter
const Highlight = ({ text, query }: { text: string; query: string }) => {
  if (!query) {
    return <>{text}</>;
  }
  const parts = text.split(
    new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig')
  );

  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i % 2 === 1 ? (
            <mark className="bg-yellow-100 px-0.5">{part}</mark>
          ) : (
            part
          )}
        </Fragment>
      ))}
    </>
  );
};

function BookResultCard({
  book,
  onSelect,
  query,
}: {
  book: BookSummary;
  onSelect: (b: BookSummary) => void;
  query: string;
}) {
  const badge = book.isExisting
    ? 'DB'
    : book.source === 'api'
      ? 'API'
      : book.source === 'manual'
        ? '수동'
        : undefined;

  return (
    <div
      role="option"
      className="group relative flex gap-4 p-4 rounded-xl border bg-white/70 transition border-slate-200 hover:shadow-md cursor-pointer"
      onClick={() => onSelect(book)}
    >
      <div className="w-12 h-16 rounded-md bg-slate-100 overflow-hidden shadow-sm">
        {book.thumbnail ? (
          <img
            src={book.thumbnail}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : null}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <h3 className="font-semibold text-slate-900 line-clamp-2">
            <Highlight text={book.title} query={query} />
          </h3>
          {badge && (
            <span className="shrink-0 px-1.5 py-0.5 text-[11px] rounded bg-slate-100 text-slate-600">
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-600 mt-0.5 truncate">
          {book.author} {book.publisher ? `· ${book.publisher}` : ''}{' '}
          {book.publishedAt ? `· ${book.publishedAt?.slice(0, 10)}` : ''}
        </p>
        <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
          <span className="font-mono truncate">{book.isbn}</span>
          {book.isExisting && book.stats ? (
            <span>
              독후감 {book.stats.reviewCount}
              {typeof book.stats.averageRating === 'number'
                ? ` · 추천 ${Math.round(book.stats.averageRating * 100)}%`
                : ''}
            </span>
          ) : null}
        </div>
      </div>
      <div className="self-start">
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(book);
          }}
        >
          도서 선택
        </Button>
      </div>
    </div>
  );
}

function ManualBookCard({ onSelect }: { onSelect: (b: BookSummary) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    author: '',
    publisher: '',
    publishedAt: '',
    isbn: '',
    thumbnail: '',
  });
  const canSubmit = form.title.trim() && form.author.trim();

  return (
    <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-white/60">
      {!open ? (
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">찾는 도서가 없나요?</div>
            <div className="text-sm text-slate-600">
              수동으로 정보를 입력해 선택할 수 있어요.
            </div>
          </div>
          <Button variant="outline" onClick={() => setOpen(true)}>
            수동 입력
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="제목*"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Input
              placeholder="저자*"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
            />
            <Input
              placeholder="출판사"
              value={form.publisher}
              onChange={(e) => setForm({ ...form, publisher: e.target.value })}
            />
            <Input
              placeholder="출간연도 (YYYY-MM-DD)"
              value={form.publishedAt}
              onChange={(e) =>
                setForm({ ...form, publishedAt: e.target.value })
              }
            />
            <Input
              placeholder="ISBN"
              value={form.isbn}
              onChange={(e) => setForm({ ...form, isbn: e.target.value })}
            />
            <Input
              placeholder="표지 이미지 URL"
              value={form.thumbnail}
              onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button
              onClick={() => {
                const payload: BookSummary = {
                  title: form.title.trim(),
                  author: form.author.trim(),
                  isExisting: false,
                  source: 'manual',
                };

                if (form.publisher.trim()) {
                  payload.publisher = form.publisher.trim();
                }
                if (form.publishedAt.trim()) {
                  payload.publishedAt = form.publishedAt.trim();
                }
                if (form.isbn.trim()) {
                  payload.isbn = form.isbn.trim();
                }
                if (form.thumbnail.trim()) {
                  payload.thumbnail = form.thumbnail.trim();
                }
                onSelect(payload);
              }}
              disabled={!canSubmit}
            >
              생성하여 선택
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function BookDetailModal({
  open,
  onOpenChange,
  book,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: BookSummary | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!book) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>도서 정보</DialogTitle>
          <DialogDescription>
            선택한 도서에 대한 독후감을 작성하시겠습니까?
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 py-4">
          <div className="w-20 h-28 rounded-md bg-slate-100 overflow-hidden shadow-sm shrink-0">
            {book.thumbnail ? (
              <img
                src={book.thumbnail}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                표지 없음
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <h3 className="font-semibold text-lg leading-tight">
                {book.title}
              </h3>
              <p className="text-slate-600 text-sm">{book.author}</p>
            </div>

            {(Boolean(book.publisher) || Boolean(book.publishedAt)) && (
              <div className="text-sm text-slate-500">
                {book.publisher && <span>{book.publisher}</span>}
                {book.publisher && book.publishedAt && <span> · </span>}
                {book.publishedAt && (
                  <span>{book.publishedAt.slice(0, 10)}</span>
                )}
              </div>
            )}

            {book.isbn && (
              <div className="text-xs text-slate-500 font-mono">
                ISBN: {book.isbn}
              </div>
            )}

            {book.description && (
              <div className="text-sm text-slate-600 line-clamp-3">
                {book.description}
              </div>
            )}

            {book.isExisting && book.stats && (
              <div className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                독후감 {book.stats.reviewCount}개
                {typeof book.stats.averageRating === 'number' &&
                  ` · 추천율 ${Math.round(book.stats.averageRating * 100)}%`}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            다시 선택하기
          </Button>
          <Button onClick={onConfirm}>독후감 작성하기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BookSearchStep() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false); // initial load
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [results, setResults] = useState<BookSummary[]>([]);
  const pageRef = useRef<number>(1);
  const size = 20;
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [hasSearched, setHasSearched] = useState(false); // 검색 실행 여부 추적
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedForModal, setSelectedForModal] = useState<BookSummary | null>(
    null
  );
  // Kakao only for book search in write flow
  const seenIsbn = useRef<Set<string>>(new Set());
  const seenId = useRef<Set<string>>(new Set());
  const searchBooks = useWriteStore((s) => s.searchBooks);
  const setSelectedBook = useWriteStore((s) => s.setSelectedBook);
  const setStep = useWriteStore((s) => s.setStep);

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
    setHasSearched(true); // 검색 실행 표시
    // reset
    setResults([]);
    pageRef.current = 1;
    setHasMore(false);
    setTotal(undefined);
    seenId.current = new Set();
    seenIsbn.current = new Set();

    try {
      // Kakao only
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

  // Modal handlers
  const onBookSelect = (book: BookSummary) => {
    setSelectedForModal(book);
    setModalOpen(true);
  };

  const onModalConfirm = () => {
    if (selectedForModal) {
      setSelectedBook(selectedForModal);
      setStep('writing');
    }
    setModalOpen(false);
    setSelectedForModal(null);
  };

  const onModalCancel = () => {
    setModalOpen(false);
    setSelectedForModal(null);
  };

  // Infinite scroll setup
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
          onKeyDown={(e) => {
            if (
              e.key === 'Enter' &&
              !(e as React.KeyboardEvent<HTMLInputElement>).nativeEvent
                ?.isComposing
            ) {
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
            {/* Infinite scroll trigger */}
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
    </div>
  );
}

function WritingStep() {
  const navigate = useNavigate();
  const {
    selectedBook,
    title,
    isRecommended,
    tags,
    visibility,
    contentJson,
    isSaving,
    lastSavedAt,
    hasUnsavedChanges,
  } = useWriteStore();
  const setTitle = useWriteStore((s) => s.setTitle);
  const setRecommended = useWriteStore((s) => s.setRecommended);
  const setTags = useWriteStore((s) => s.setTags);
  const setVisibility = useWriteStore((s) => s.setVisibility);
  const setContent = useWriteStore((s) => s.setContent);
  const saveDraft = useWriteStore((s) => s.saveDraft);
  const publish = useWriteStore((s) => s.publish);

  // Debounced save when content/title/tags/visibility change
  useDebounced(
    () => {
      if (hasUnsavedChanges) {
        void saveDraft();
      }
    },
    2000,
    [title, isRecommended, tags.join(','), visibility, contentJson]
  );

  // 30s periodic save
  useEffect(() => {
    const id = setInterval(() => {
      if (hasUnsavedChanges) {
        void saveDraft();
      }
    }, 30000);

    return () => clearInterval(id);
  }, [hasUnsavedChanges, saveDraft]);

  // beforeunload protection
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handler);

    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  const [tagInput, setTagInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestIndex, setActiveSuggestIndex] = useState<number>(-1);
  const addTag = (t: string) => {
    const v = t.trim().replace(/^#/, '');

    if (!v) {
      return;
    }
    if (tags.includes(v) || tags.length >= 10) {
      return;
    }
    setTags([...tags, v]);
    setTagInput('');
    setShowSuggestions(false);
  };
  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  // Fetch tag suggestions (debounced)
  useDebounced(
    () => {
      const q = tagInput.trim().replace(/^#/, '');

      if (!q) {
        setSuggestions([]);
        setActiveSuggestIndex(-1);

        return;
      }
      (async () => {
        try {
          const url = new URL(`${API_BASE_URL}/api/tags/suggestions`);

          url.searchParams.set('query', q);
          url.searchParams.set('limit', '5');
          const res = await fetch(url.toString(), { credentials: 'include' });

          if (!res.ok) {
            return;
          }
          const data = await res.json();
          const s: { name: string; count: number }[] =
            data?.data?.suggestions ?? [];
          const list = s
            .map((x) => x.name)
            .filter((name) => !tags.includes(name));

          setSuggestions(list);
          setShowSuggestions(list.length > 0);
          setActiveSuggestIndex(list.length > 0 ? 0 : -1);
        } catch {
          // ignore
        }
      })();
    },
    300,
    [tagInput]
  );

  const onPublish = async () => {
    try {
      const id = await publish();

      navigate({ to: `/review/${id}` });
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(e instanceof Error ? e.message : '게시 중 오류가 발생했습니다');
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-3 border rounded bg-muted/30">
        <div className="font-medium">선택된 도서</div>
        {selectedBook ? (
          <div className="text-sm text-muted-foreground">
            {selectedBook.title} · {selectedBook.author}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            도서가 선택되지 않았습니다
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">제목</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="독후감 제목"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">내용</label>
        <LexicalEditor
          initialJson={contentJson}
          onChange={(html, json) => setContent(html, json)}
          onImageUpload={async (file) => {
            const url = await useWriteStore.getState().uploadImage(file);

            return url;
          }}
          placeholder="내용을 입력해 주세요..."
        />
        <div className="text-xs text-muted-foreground">
          {isSaving
            ? '저장 중…'
            : lastSavedAt
              ? `저장됨 • ${new Date(lastSavedAt).toLocaleTimeString()}`
              : '초안 저장 전'}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">태그</label>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span key={t} className="px-2 py-1 text-xs border rounded-full">
              #{t}
              <button
                className="ml-1 text-muted-foreground"
                onClick={() => removeTag(t)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="relative flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => {
              setTagInput(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={(e) => {
              if (showSuggestions && suggestions.length > 0) {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActiveSuggestIndex((i) => (i + 1) % suggestions.length);

                  return;
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActiveSuggestIndex(
                    (i) => (i - 1 + suggestions.length) % suggestions.length
                  );

                  return;
                }
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (
                    activeSuggestIndex >= 0 &&
                    activeSuggestIndex < suggestions.length
                  ) {
                    const suggestion = suggestions[activeSuggestIndex];

                    if (suggestion) {
                      addTag(suggestion);
                    }
                  } else {
                    addTag(tagInput);
                  }

                  return;
                }
                if (e.key === 'Escape') {
                  setShowSuggestions(false);
                  setActiveSuggestIndex(-1);

                  return;
                }
              }
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag(tagInput);
              }
            }}
            placeholder={
              tags.length < 10 ? '태그 입력 후 Enter (최대 10개)' : '최대 도달'
            }
            disabled={tags.length >= 10}
          />
          <Button
            variant="secondary"
            onClick={() => addTag(tagInput)}
            disabled={!tagInput.trim() || tags.length >= 10}
          >
            추가
          </Button>
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 top-full left-0 mt-1 w-full bg-white border rounded shadow">
              {suggestions.map((s, idx) => (
                <button
                  key={s}
                  className={`block w-full text-left px-3 py-2 hover:bg-gray-100 ${idx === activeSuggestIndex ? 'bg-gray-100' : ''}`}
                  onMouseEnter={() => setActiveSuggestIndex(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                  }}
                  onClick={() => addTag(s)}
                >
                  #{s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">추천 여부</label>
          <div className="flex items-center gap-2">
            <Button
              variant={isRecommended ? 'default' : 'outline'}
              onClick={() => setRecommended(true)}
            >
              추천
            </Button>
            <Button
              variant={!isRecommended ? 'default' : 'outline'}
              onClick={() => setRecommended(false)}
            >
              비추천
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">공개 범위</label>
          <div className="flex items-center gap-2">
            <Button
              variant={visibility === 'public' ? 'default' : 'outline'}
              onClick={() => setVisibility('public')}
            >
              전체 공개
            </Button>
            <Button
              variant={visibility === 'private' ? 'default' : 'outline'}
              onClick={() => setVisibility('private')}
            >
              비공개
            </Button>
            <Button
              variant="outline"
              disabled
              title="팔로워 공개는 추후 지원 예정"
            >
              팔로워만
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => void saveDraft()}>
          임시저장
        </Button>
        <Button onClick={onPublish} disabled={!selectedBook}>
          게시하기
        </Button>
      </div>
    </div>
  );
}

function WritePage() {
  const setStep = useWriteStore((s) => s.setStep);
  const setSelectedBook = useWriteStore((s) => s.setSelectedBook);
  const loadDraft = useWriteStore((s) => s.loadDraft);
  const selectedBook = useWriteStore((s) => s.selectedBook);
  const getBookById = useWriteStore((s) => s.getBookById);
  const currentStep = useWriteStore((s) => s.currentStep);

  const bookId = useQueryParam('bookId');

  // Load draft and book by query
  useEffect(() => {
    void loadDraft();
  }, [loadDraft]);

  useEffect(() => {
    const load = async () => {
      if (bookId && !selectedBook) {
        const b = await getBookById(bookId);

        if (b) {
          setSelectedBook(b);
          setStep('writing');
        }
      }
    };

    void load();
  }, [bookId, selectedBook, getBookById, setSelectedBook, setStep]);

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <h1 className="text-2xl font-bold mb-4">독후감 작성</h1>
        <div className="mb-4 flex gap-2 text-sm">
          <button
            className={`px-3 py-1 border rounded ${currentStep === 'book-search' ? 'bg-primary text-primary-foreground' : ''}`}
            onClick={() => setStep('book-search')}
          >
            1. 도서 선택
          </button>
          <button
            className={`px-3 py-1 border rounded ${currentStep === 'writing' ? 'bg-primary text-primary-foreground' : ''}`}
            onClick={() => setStep('writing')}
          >
            2. 작성
          </button>
        </div>

        {currentStep === 'book-search' ? <BookSearchStep /> : <WritingStep />}
      </div>
    </AuthGuard>
  );
}

export const Route = createFileRoute('/write')({
  component: WritePage,
});
