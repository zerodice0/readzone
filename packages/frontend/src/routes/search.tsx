import { createFileRoute, useNavigate } from '@tanstack/react-router';
import React, { Fragment, useCallback, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { NotificationDialog, type NotificationType } from '@/components/ui/notification-dialog';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

function useQueryParam(name: string) {
  const params = new URLSearchParams(window.location.search);

  return params.get(name) ?? undefined;
}

function SearchPage() {
  interface BookResult {
    id?: string;
    title: string;
    author: string;
    publisher?: string;
    publishedAt?: string;
    isbn?: string;
    coverImage?: string;
    thumbnail?: string;
    description?: string;
    source?: 'db' | 'api';
    isExisting?: boolean;
    stats?: { reviewCount: number; averageRating?: number };
  }

  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false); // initial load
  const [results, setResults] = useState<BookResult[]>([]);
  const [_page, setPage] = useState(1); // UI 디버깅용 (사용하지 않음)
  const pageRef = useRef(1); // 실제 페이지 추적용
  const [loadingMore, setLoadingMore] = useState(false); // 무한스크롤 로딩 상태
  const size = 20;
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [selectedSource, setSelectedSource] = useState<
    'db' | 'kakao' | undefined
  >(undefined);
  const seenIsbn = useRef<Set<string>>(new Set());
  const seenId = useRef<Set<string>>(new Set());
  const navigate = useNavigate();
  
  // Notification state
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<NotificationType>('info');

  const mode = useQueryParam('mode'); // 'select' | undefined
  const redirect = useQueryParam('redirect') ?? '/write';

  const appendDedup = useCallback(
    (prev: BookResult[], incoming: BookResult[]) => {
      const next = [...prev];

      for (const b of incoming) {
        const idKey = b.id ? String(b.id) : undefined;
        const isbnKey = b.isbn
          ? String(b.isbn).replace(/[-\s]/g, '')
          : undefined;

        if (idKey && seenId.current.has(idKey)) {
          continue;
        }
        if (isbnKey && seenIsbn.current.has(isbnKey)) {
          continue;
        }
        if (idKey) {
          seenId.current.add(idKey);
        }
        if (isbnKey) {
          seenIsbn.current.add(isbnKey);
        }
        next.push(b);
      }

      return next;
    },
    []
  );

  const onSearch = async (src?: 'db' | 'kakao') => {
    if (!q.trim()) {
      return;
    }
    setLoading(true);
    try {
      const source = src ?? 'db';

      setSelectedSource(source);
      setPage(1);
      pageRef.current = 1; // ref도 초기화
      setHasMore(false);
      setTotal(undefined);
      setResults([]);
      seenId.current = new Set();
      seenIsbn.current = new Set();
      const url = new URL(`${API_BASE_URL}/api/books/search`);

      url.searchParams.set('query', q);
      url.searchParams.set('page', '1');
      url.searchParams.set('size', String(size));
      url.searchParams.set('source', source);
      const res = await fetch(url.toString(), {
        credentials: 'include',
        cache: 'no-store',
      });
      const data = await res.json();
      const globalSource = data?.data?.source;
      const rawBooks: {
        id?: string;
        title: string;
        author: string;
        publisher?: string;
        publishedAt?: string;
        publishedDate?: string;
        isbn?: string;
        coverImage?: string;
        thumbnail?: string;
        description?: string;
        source?: string;
        stats?: { reviewCount: number; averageRating?: number };
      }[] = data?.data?.books ?? [];
      const mapped: BookResult[] = rawBooks.map((b) => {
        const srcRaw: string | undefined = b?.source ?? globalSource;
        const source: 'db' | 'api' | undefined = b?.id
          ? 'db'
          : srcRaw === 'db'
            ? 'db'
            : srcRaw === 'kakao' || srcRaw === 'api'
              ? 'api'
              : undefined;
        const base: BookResult = {
          title: b.title,
          author: b.author,
          isExisting: Boolean(b.id),
        };

        if (b.id !== undefined) {
          base.id = b.id;
        }
        if (b.publisher !== undefined) {
          base.publisher = b.publisher;
        }
        const publishedDate = b.publishedAt ?? b.publishedDate;

        if (publishedDate !== undefined) {
          base.publishedAt = publishedDate;
        }
        if (b.isbn !== undefined) {
          base.isbn = b.isbn;
        }
        if (b.coverImage !== undefined) {
          base.coverImage = b.coverImage;
        }
        const thumbnailValue = b.thumbnail ?? b.coverImage;

        if (thumbnailValue !== undefined) {
          base.thumbnail = thumbnailValue;
        }
        if (b.description !== undefined) {
          base.description = b.description;
        }
        if (source !== undefined) {
          base.source = source;
        }
        if (b?.stats) {
          const stats: { reviewCount: number; averageRating?: number } = {
            reviewCount: Number(b.stats.reviewCount ?? 0),
          };

          if (typeof b.stats.averageRating === 'number') {
            stats.averageRating = b.stats.averageRating;
          }
          base.stats = stats;
        }

        return base;
      });

      setResults((prev) => appendDedup(prev, mapped));
      const hasMore =
        typeof data?.data?.hasMore === 'boolean'
          ? data.data.hasMore
          : rawBooks.length === size;

      setHasMore(hasMore);
      setTotal(data?.data?.total);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(async () => {
    // 로딩 중이거나 더 불러올 데이터가 없으면 종료
    if (loadingMore || !hasMore) {
      return;
    }

    setLoadingMore(true); // 로딩 상태 설정
    const nextPage = pageRef.current + 1;

    pageRef.current = nextPage;

    try {
      const url = new URL(`${API_BASE_URL}/api/books/search`);

      url.searchParams.set('query', q);
      url.searchParams.set('page', String(nextPage));
      url.searchParams.set('size', String(size));
      url.searchParams.set('source', selectedSource ?? 'kakao');
      const res = await fetch(url.toString(), {
        credentials: 'include',
        cache: 'no-store',
      });
      const data = await res.json();
      const globalSource = data?.data?.source;
      const rawBooks: {
        id?: string;
        title: string;
        author: string;
        publisher?: string;
        publishedAt?: string;
        publishedDate?: string;
        isbn?: string;
        coverImage?: string;
        thumbnail?: string;
        description?: string;
        source?: string;
        stats?: { reviewCount: number; averageRating?: number };
      }[] = data?.data?.books ?? [];
      const mapped: BookResult[] = rawBooks.map((b) => {
        const sRaw = b?.source ?? globalSource;
        const src: 'db' | 'api' | undefined = b?.id
          ? 'db'
          : sRaw === 'kakao'
            ? 'api'
            : (sRaw as 'db' | undefined);
        const base: BookResult = {
          title: b.title,
          author: b.author,
          isExisting: Boolean(b.id),
        };

        if (b.id !== undefined) {
          base.id = b.id;
        }
        if (b.publisher !== undefined) {
          base.publisher = b.publisher;
        }
        const publishedDate = b.publishedAt ?? b.publishedDate;

        if (publishedDate !== undefined) {
          base.publishedAt = publishedDate;
        }
        if (b.isbn !== undefined) {
          base.isbn = b.isbn;
        }
        if (b.coverImage !== undefined) {
          base.coverImage = b.coverImage;
        }
        const thumbnailValue = b.thumbnail ?? b.coverImage;

        if (thumbnailValue !== undefined) {
          base.thumbnail = thumbnailValue;
        }
        if (b.description !== undefined) {
          base.description = b.description;
        }
        if (src !== undefined) {
          base.source = src;
        }
        if (b?.stats) {
          const stats: { reviewCount: number; averageRating?: number } = {
            reviewCount: Number(b.stats.reviewCount ?? 0),
          };

          if (typeof b.stats.averageRating === 'number') {
            stats.averageRating = b.stats.averageRating;
          }
          base.stats = stats;
        }

        return base;
      });

      setResults((prev) => appendDedup(prev, mapped));
      const hasMore =
        typeof data?.data?.hasMore === 'boolean'
          ? data.data.hasMore
          : rawBooks.length === size;

      setHasMore(hasMore);
      setPage(nextPage); // 성공 시에만 state 업데이트
    } catch (error) {
      pageRef.current = pageRef.current - 1; // 실패 시 롤백
      throw error;
    } finally {
      setLoadingMore(false); // 로딩 상태 해제
    }
  }, [loadingMore, hasMore, q, selectedSource, appendDedup]);

  // Infinite scroll setup
  const triggerRef = useInfiniteScroll({
    hasMore,
    isLoading: loadingMore,
    onLoadMore: loadMore,
  });

  const onSelect = (book: BookResult) => {
    if (mode === 'select') {
      if (book.id) {
        navigate({ to: `${redirect}?bookId=${book.id}` });
      } else {
        navigate({ to: `${redirect}` });
      }
    } else if (book.id) {
      navigate({ to: `/books/${book.id}` });
    }
  };

  function Highlight({ text, query }: { text: string; query: string }) {
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
  }

  const BookResultCard = ({ book }: { book: BookResult }) => {
    const reviewCount =
      book.isExisting && book.stats ? book.stats.reviewCount : 0;
    const go = () => onSelect(book);

    return (
      <div className="group relative flex gap-4 p-4 rounded-xl border bg-white/70 transition border-slate-200 hover:shadow-md">
        <div className="w-12 h-16 rounded-md bg-slate-100 overflow-hidden shadow-sm">
          {book.thumbnail ? (
            <img
              src={book.thumbnail}
              alt={book.title}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : null}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <h3 className="font-semibold text-slate-900 line-clamp-2">
              <Highlight text={book.title} query={q} />
            </h3>
            {reviewCount > 0 && (
              <span className="shrink-0 px-1.5 py-0.5 text-[11px] rounded bg-green-100 text-green-700">
                📚 독후감 {reviewCount}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 mt-0.5 truncate">
            {book.author} {book.publisher ? `· ${book.publisher}` : ''}{' '}
            {book.publishedAt ? `· ${book.publishedAt}` : ''}
          </p>
          {book.isExisting &&
            book.stats &&
            typeof book.stats.averageRating === 'number' && (
              <div className="mt-1 text-xs text-slate-500">
                추천 {Math.round(book.stats.averageRating * 100)}%
              </div>
            )}
        </div>
        <div className="self-start">
          <Button size="sm" onClick={go}>
            {mode === 'select' ? '선택' : book.id ? '도서 상세' : '선택'}
          </Button>
        </div>
      </div>
    );
  };

  async function createManualBook(form: {
    title: string;
    author: string;
    publisher?: string;
    publishedAt?: string;
    isbn?: string;
    thumbnail?: string;
  }) {
    const body: Record<string, string> = {
      title: form.title,
      author: form.author,
    };

    if (form.publisher) {
      body.publisher = form.publisher;
    }
    if (form.publishedAt) {
      body.publishedDate = form.publishedAt;
    }
    if (form.isbn) {
      body.isbn = form.isbn;
    }
    if (form.thumbnail) {
      body.coverImage = form.thumbnail;
    }
    const tryPost = async (path: string) => {
      const res = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        return null;
      }
      const data = await res.json();

      return data?.data?.book ?? data?.book;
    };

    return (
      (await tryPost('/api/books')) ?? (await tryPost('/api/books/manual'))
    );
  }

  const ManualBookCard = () => {
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
                수동으로 추가하거나 바로 선택할 수 있어요.
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
                onChange={(e) =>
                  setForm({ ...form, publisher: e.target.value })
                }
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
                onChange={(e) =>
                  setForm({ ...form, thumbnail: e.target.value })
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                취소
              </Button>
              <Button
                disabled={!canSubmit}
                onClick={async () => {
                  try {
                    const created = await createManualBook({
                      title: form.title.trim(),
                      author: form.author.trim(),
                      ...(form.publisher.trim() && {
                        publisher: form.publisher.trim(),
                      }),
                      ...(form.publishedAt.trim() && {
                        publishedAt: form.publishedAt.trim(),
                      }),
                      ...(form.isbn.trim() && { isbn: form.isbn.trim() }),
                      ...(form.thumbnail.trim() && {
                        thumbnail: form.thumbnail.trim(),
                      }),
                    });

                    if (created?.id) {
                      if (mode === 'select') {
                        navigate({ to: `${redirect}?bookId=${created.id}` });
                      } else {
                        navigate({ to: `/books/${created.id}` });
                      }
                    }
                  } catch {
                    setNotificationMessage('도서 생성에 실패했습니다');
                    setNotificationType('error');
                    setShowNotification(true);
                  }
                }}
              >
                생성하여 이동
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">도서 검색</h1>
      <form
        className="flex gap-2 mb-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!loading && q.trim()) {
            void onSearch('kakao');
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
                void onSearch('kakao');
              }
            }
          }}
          placeholder="도서 제목/저자/ISBN으로 검색"
        />
        <Button type="submit" disabled={!q.trim() || loading}>
          {loading ? '검색 중…' : '검색'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => onSearch('kakao')}
          disabled={!q.trim() || loading}
        >
          카카오 검색
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
        ) : results.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            검색 결과가 없습니다.
          </div>
        ) : (
          <>
            <div className="text-sm text-slate-600">
              총 {typeof total === 'number' ? total : results.length}권
              {results.filter(
                (b) => b.isExisting && b.stats && b.stats.reviewCount > 0
              ).length > 0 && (
                <span>
                  ,{' '}
                  {
                    results.filter(
                      (b) => b.isExisting && b.stats && b.stats.reviewCount > 0
                    ).length
                  }
                  권에 독후감이 있습니다
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {results.map((b) => (
                <BookResultCard key={b.id ?? `${b.title}-${b.isbn}`} book={b} />
              ))}
            </div>
            {/* Infinite scroll trigger */}
            {!loadingMore && <div ref={triggerRef} className="h-1" />}
            {loadingMore && (
              <div className="flex justify-center py-4">
                <div className="text-sm text-slate-500">
                  더 많은 결과를 불러오는 중...
                </div>
              </div>
            )}
          </>
        )}
        {results.length === 0 && !loading && q.trim() && <ManualBookCard />}
      </div>
      
      <NotificationDialog
        open={showNotification}
        onOpenChange={setShowNotification}
        message={notificationMessage}
        type={notificationType}
      />
    </div>
  );
}

export const Route = createFileRoute('/search')({
  component: SearchPage,
});
