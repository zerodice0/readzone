'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from '@/hooks/use-session';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    nickname: string;
    image?: string | null;
  };
}

interface CommentSectionProps {
  reviewId: string;
  initialComments: Comment[];
  commentCount: number;
}

export function CommentSection({ reviewId, initialComments, commentCount }: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);

  const displayedComments = showAllComments ? comments : comments.slice(0, 3);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session || !newComment.trim()) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/reviews/${reviewId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        const comment = await response.json();
        setComments([comment, ...comments]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <h3 className="text-lg font-semibold">댓글 {commentCount}개</h3>

      {/* 댓글 작성 폼 */}
      {session ? (
        <form onSubmit={handleSubmitComment} className="flex gap-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 작성하세요..."
            disabled={isSubmitting}
            className="flex-1"
          />
          <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
            {isSubmitting ? '작성 중...' : '작성'}
          </Button>
        </form>
      ) : (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            댓글을 작성하려면{' '}
            <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
              로그인
            </Link>
            이 필요합니다.
          </p>
        </div>
      )}

      {/* 댓글 목록 */}
      <div className="space-y-4">
        {displayedComments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <Link href={`/profile/${comment.user.id}`}>
              {comment.user.image ? (
                <Image
                  src={comment.user.image}
                  alt={comment.user.nickname}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {comment.user.nickname[0].toUpperCase()}
                  </span>
                </div>
              )}
            </Link>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Link
                  href={`/profile/${comment.user.id}`}
                  className="font-medium text-sm hover:underline"
                >
                  {comment.user.nickname}
                </Link>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-200">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 더보기 버튼 */}
      {comments.length > 3 && !showAllComments && (
        <Button
          variant="outline"
          onClick={() => setShowAllComments(true)}
          className="w-full"
        >
          댓글 {comments.length - 3}개 더 보기
        </Button>
      )}
    </section>
  );
}