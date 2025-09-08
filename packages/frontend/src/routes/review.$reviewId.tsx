import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import DOMPurify from 'dompurify'
import { authenticatedApiCall, useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { BookInfoCard } from '@/components/common/BookInfoCard'
import type { BookSummary } from '@/store/writeStore'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

function ReviewDetailPage() {
  const { reviewId } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<{
    _count?: { likes: number };
    userHasLiked?: boolean;
    content?: string;
    title: string;
    user?: { nickname: string };
    createdAt: string;
    book?: { title: string; author: string; publishedAt?: string };
    tags?: string | string[];
    comments?: unknown[];
  } | null>(null);
  const { isAuthenticated } = useAuthStore();
  const [comments, setComments] = useState<
    {
      id: string;
      parentId?: string;
      user?: { nickname: string };
      createdAt: string;
      content: string;
    }[]
  >([]);
  const [newComment, setNewComment] = useState('');
  const [replyBoxes, setReplyBoxes] = useState<Record<string, string>>({});

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}`, {
          credentials: 'include',
        });
        const data = await res.json();

        if (!data.success) {
          throw new Error(data?.error?.message ?? '로드 실패');
        }
        setReview(data.data.review);
        setComments(
          Array.isArray(data.data.review.comments)
            ? data.data.review.comments
            : []
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : '오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [reviewId]);

  const [likeCount, setLikeCount] = useState<number>(0);
  const [userHasLiked, setUserHasLiked] = useState<boolean>(false);

  useEffect(() => {
    if (review) {
      setLikeCount(review._count?.likes ?? 0);
      setUserHasLiked(Boolean(review.userHasLiked));
    }
  }, [review]);

  if (loading) {
    return <div className="container mx-auto px-4 py-6">불러오는 중…</div>;
  }
  if (error || !review) {
    return (
      <div className="container mx-auto px-4 py-6 text-red-600">
        {error ?? '리뷰를 찾을 수 없습니다'}
      </div>
    );
  }

  const safeHtml = DOMPurify.sanitize(review.content ?? '');

  const toggleLike = async () => {
    if (!isAuthenticated) {
      // eslint-disable-next-line no-alert
      alert('로그인 후 이용해 주세요');

      return;
    }
    const action = userHasLiked ? 'unlike' : 'like';

    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action }),
      });
      const data = await res.json();

      if (data.success) {
        setUserHasLiked(action === 'like');
        setLikeCount(data.data.likeCount);
      }
    } catch {
      // Handle error silently for like functionality
    }
  };

  const tags: string[] = Array.isArray(review.tags)
    ? review.tags
    : review.tags
      ? (() => {
          try {
            return JSON.parse(review.tags);
          } catch {
            return [];
          }
        })()
      : [];

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = encodeURIComponent(`${review.title} - ReadZone`);

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">{review.title}</h1>
      <div className="text-sm text-muted-foreground mb-4">
        {review.user?.nickname ?? '작성자'} ·{' '}
        {new Date(review.createdAt).toLocaleString()}
      </div>
      {review.book && (
        <BookInfoCard
          book={{
            title: review.book.title,
            author: review.book.author,
            publisher: 'publisher' in review.book ? review.book.publisher : undefined,
            publishedAt: review.book.publishedAt,
            thumbnail: 'thumbnail' in review.book ? review.book.thumbnail : undefined,
            description: 'description' in review.book ? review.book.description : undefined,
            isbn: 'isbn' in review.book ? review.book.isbn : undefined,
            isExisting: true,
            source: 'db'
          } as BookSummary}
          className="mb-6"
        />
      )}
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant={userHasLiked ? 'default' : 'outline'}
          size="sm"
          onClick={toggleLike}
        >
          {userHasLiked ? '좋아요 취소' : '좋아요'} ({likeCount})
        </Button>
        <div className="flex gap-2">
          {tags.map((t) => (
            <span key={t} className="px-2 py-1 text-xs border rounded-full">
              #{t}
            </span>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (navigator.share) {
                try {
                  await navigator.share({
                    title: review.title,
                    url: shareUrl,
                    text: `${review.title} - ReadZone`,
                  });
                } catch {
                  // Handle share failure silently
                }
              } else {
                try {
                  await navigator.clipboard.writeText(shareUrl);
                  // eslint-disable-next-line no-alert
                  alert('링크가 복사되었습니다');
                } catch {
                  // Handle clipboard failure silently
                }
              }
            }}
          >
            공유
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(shareUrl);
                // eslint-disable-next-line no-alert
                alert('링크가 복사되었습니다');
              } catch {
                // Handle clipboard failure silently
              }
            }}
          >
            링크 복사
          </Button>
          <a
            className="px-3 py-1 text-sm border rounded"
            href={`https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            X 공유
          </a>
        </div>
      </div>
      <article className="prose max-w-none">
        <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
      </article>
      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-2">댓글 ({comments.length})</h2>
        {isAuthenticated && (
          <div className="mb-4">
            <textarea
              className="w-full border rounded p-2 min-h-[80px]"
              placeholder="댓글을 입력하세요"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <div className="flex justify-end mt-2">
              <Button
                size="sm"
                onClick={async () => {
                  if (!newComment.trim()) {
                    return;
                  }
                  try {
                    const data = await authenticatedApiCall(
                      `/api/reviews/${reviewId}/comments`,
                      {
                        method: 'POST',
                        body: JSON.stringify({ content: newComment }),
                      }
                    );

                    if (data.success) {
                      setComments((prev) => [...prev, data.data.comment]);
                      setNewComment('');
                    }
                  } catch {
                    // Handle comment creation failure silently
                  }
                }}
              >
                댓글 작성
              </Button>
            </div>
          </div>
        )}

        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments
              .filter((c) => !c.parentId)
              .map(
                (c: {
                  id: string;
                  parentId?: string;
                  user?: { nickname: string };
                  createdAt: string;
                  content: string;
                }) => {
                  const replies = comments.filter((r) => r.parentId === c.id);

                  return (
                    <div key={c.id} className="p-3 border rounded">
                      <div className="text-sm font-medium">
                        {c.user?.nickname ?? '사용자'}
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {new Date(c.createdAt).toLocaleString()}
                      </div>
                      <div className="text-sm whitespace-pre-wrap mb-2">
                        {c.content}
                      </div>
                      {isAuthenticated && (
                        <div className="mb-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setReplyBoxes((prev) => ({
                                ...prev,
                                [c.id]: prev[c.id] ?? '',
                              }));
                            }}
                          >
                            답글
                          </Button>
                        </div>
                      )}
                      {replyBoxes[c.id] !== undefined && (
                        <div className="mb-3">
                          <textarea
                            className="w-full border rounded p-2 min-h-[60px]"
                            placeholder="답글을 입력하세요"
                            value={replyBoxes[c.id]}
                            onChange={(e) =>
                              setReplyBoxes((prev) => ({
                                ...prev,
                                [c.id]: e.target.value,
                              }))
                            }
                          />
                          <div className="flex gap-2 justify-end mt-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                setReplyBoxes((prev) => {
                                  const cp = { ...prev };
                                  const { [c.id]: _, ...rest } = cp;

                                  return rest;
                                })
                              }
                            >
                              취소
                            </Button>
                            <Button
                              size="sm"
                              onClick={async () => {
                                const content = replyBoxes[c.id]?.trim();

                                if (!content) {
                                  return;
                                }
                                try {
                                  const data = await authenticatedApiCall(
                                    `/api/reviews/${reviewId}/comments`,
                                    {
                                      method: 'POST',
                                      body: JSON.stringify({
                                        content,
                                        parentId: c.id,
                                      }),
                                    }
                                  );

                                  if (data.success) {
                                    setComments((prev) => [
                                      ...prev,
                                      data.data.comment,
                                    ]);
                                    setReplyBoxes((prev) => {
                                      const cp = { ...prev };
                                      const { [c.id]: _, ...rest } = cp;

                                      return rest;
                                    });
                                  }
                                } catch {
                                  // Handle reply creation failure silently
                                }
                              }}
                            >
                              답글 작성
                            </Button>
                          </div>
                        </div>
                      )}
                      {replies.length > 0 && (
                        <div className="pl-4 border-l space-y-2">
                          {replies.map((r) => (
                            <div key={r.id} className="">
                              <div className="text-sm font-medium">
                                {r.user?.nickname ?? '사용자'}
                              </div>
                              <div className="text-xs text-muted-foreground mb-1">
                                {new Date(r.createdAt).toLocaleString()}
                              </div>
                              <div className="text-sm whitespace-pre-wrap">
                                {r.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
              )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            아직 댓글이 없습니다.
          </div>
        )}
      </section>
    </div>
  );
}

export const Route = createFileRoute('/review/$reviewId')({
  component: ReviewDetailPage,
});
