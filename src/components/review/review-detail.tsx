'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from '@/hooks/use-session';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { Heart, MessageCircle, Share2, BookOpen, ExternalLink } from 'lucide-react';
import { CommentSection } from '@/components/review/comment-section';
import { ShareDialog } from '@/components/review/share-dialog';

interface ReviewDetailProps {
  review: {
    id: string;
    title?: string | null;
    content: string;
    isRecommended: boolean;
    tags: string;
    purchaseLink?: string | null;
    linkClicks: number;
    createdAt: Date;
    updatedAt: Date;
    user: {
      id: string;
      nickname: string;
      image?: string | null;
    };
    book: {
      id: string;
      title: string;
      authors: string;
      thumbnail?: string | null;
      genre?: string | null;
      publisher?: string | null;
      pageCount?: number | null;
    };
    _count: {
      likes: number;
      comments: number;
    };
    comments: Array<{
      id: string;
      content: string;
      createdAt: Date;
      user: {
        id: string;
        nickname: string;
        image?: string | null;
      };
    }>;
  };
}

export function ReviewDetail({ review }: ReviewDetailProps) {
  const { data: session } = useSession();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(review._count.likes);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const handleLike = async () => {
    if (!session) {
      // TODO: 로그인 모달 또는 리다이렉트
      return;
    }

    try {
      const response = await fetch(`/api/reviews/${review.id}/like`, {
        method: isLiked ? 'DELETE' : 'POST',
      });

      if (response.ok) {
        setIsLiked(!isLiked);
        setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
      }
    } catch (error) {
      console.error('Failed to update like:', error);
    }
  };

  const handlePurchaseLinkClick = async () => {
    if (review.purchaseLink) {
      // 클릭 수 증가
      await fetch(`/api/reviews/${review.id}/click`, {
        method: 'POST',
      });
    }
  };

  const tags = review.tags ? JSON.parse(review.tags) : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 도서 정보 */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex gap-6">
            {review.book.thumbnail && (
              <div className="flex-shrink-0">
                <Image
                  src={review.book.thumbnail}
                  alt={review.book.title}
                  width={120}
                  height={160}
                  className="rounded-lg shadow-md"
                />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{review.book.title}</h1>
              <div className="space-y-1 text-sm text-gray-600">
                <p>저자: {review.book.authors}</p>
                {review.book.publisher && <p>출판사: {review.book.publisher}</p>}
                {review.book.genre && <p>장르: {review.book.genre}</p>}
                {review.book.pageCount && <p>페이지: {review.book.pageCount}쪽</p>}
              </div>
              <div className="mt-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  review.isRecommended
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {review.isRecommended ? '추천' : '비추천'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 독후감 내용 */}
      <article className="mb-8">
        {review.title && (
          <h2 className="text-xl font-semibold mb-4">{review.title}</h2>
        )}
        
        {/* 작성자 정보 */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/profile/${review.user.id}`}
            className="flex items-center gap-3 hover:opacity-80"
          >
            {review.user.image ? (
              <Image
                src={review.user.image}
                alt={review.user.nickname}
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">
                  {review.user.nickname[0].toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="font-medium">{review.user.nickname}</p>
              <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowShareDialog(true)}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 본문 */}
        <div className="prose prose-lg max-w-none mb-6">
          <p className="whitespace-pre-wrap">{review.content}</p>
        </div>

        {/* 태그 */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {tags.map((tag: string, index: number) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* 구매 링크 */}
        {review.purchaseLink && (
          <div className="mb-6">
            <a
              href={review.purchaseLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handlePurchaseLinkClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              도서 구매하기
              <ExternalLink className="w-4 h-4" />
            </a>
            <p className="text-xs text-gray-500 mt-1">
              {review.linkClicks}명이 이 링크를 클릭했습니다
            </p>
          </div>
        )}

        {/* 상호작용 버튼 */}
        <div className="flex items-center gap-4 py-4 border-t border-b">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${
              isLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span>{likeCount}</span>
          </button>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MessageCircle className="w-5 h-5" />
            <span>{review._count.comments}</span>
          </div>
        </div>
      </article>

      {/* 댓글 섹션 */}
      <CommentSection
        reviewId={review.id}
        initialComments={review.comments}
        commentCount={review._count.comments}
      />

      {/* 공유 다이얼로그 */}
      {showShareDialog && (
        <ShareDialog
          reviewId={review.id}
          bookTitle={review.book.title}
          onClose={() => setShowShareDialog(false)}
        />
      )}
    </div>
  );
}