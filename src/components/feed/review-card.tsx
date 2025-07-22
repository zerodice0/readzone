'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useSession } from '@/hooks/use-session';
import { useRouter } from 'next/navigation';

interface ReviewCardProps {
  review: {
    id: string;
    title?: string;
    content: string;
    isRecommended: boolean;
    createdAt: string;
    user: {
      id: string;
      nickname: string;
      image?: string;
    };
    book: {
      id: string;
      title: string;
      authors: string;
      thumbnail?: string;
      genre?: string;
    };
    _count: {
      likes: number;
      comments: number;
    };
  };
  isPreview?: boolean;
}

export function ReviewCard({ review, isPreview = false }: ReviewCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  
  const displayContent = isPreview && review.content.length > 200
    ? review.content.slice(0, 200) + '...'
    : review.content;

  const handleInteraction = (e: React.MouseEvent, action: string) => {
    e.preventDefault();
    if (!session) {
      router.push('/login');
      return;
    }
    // TODO: 실제 상호작용 구현
    console.log(`${action} for review ${review.id}`);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* 도서 썸네일 */}
          {review.book.thumbnail && (
            <div className="flex-shrink-0">
              <Image
                src={review.book.thumbnail}
                alt={review.book.title}
                width={60}
                height={80}
                className="rounded object-cover"
              />
            </div>
          )}
          
          {/* 콘텐츠 */}
          <div className="flex-1 min-w-0">
            {/* 도서 정보 */}
            <div className="mb-2">
              <h3 className="font-semibold text-sm line-clamp-1">
                {review.book.title}
              </h3>
              <p className="text-xs text-gray-600">
                {review.book.authors} {review.book.genre && `· ${review.book.genre}`}
              </p>
            </div>
            
            {/* 독후감 내용 */}
            <div className="mb-3">
              {review.title && (
                <h4 className="font-medium mb-1">{review.title}</h4>
              )}
              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                {displayContent}
              </p>
              {isPreview && review.content.length > 200 && (
                <Link
                  href={`/review/${review.id}`}
                  className="text-sm text-blue-600 hover:underline inline-block mt-1"
                >
                  더보기
                </Link>
              )}
            </div>
            
            {/* 추천/비추천 표시 */}
            <div className="mb-3">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                review.isRecommended
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {review.isRecommended ? '추천' : '비추천'}
              </span>
            </div>
            
            {/* 하단 정보 */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <button
                  onClick={(e) => handleInteraction(e, 'like')}
                  className="flex items-center gap-1 text-gray-600 hover:text-red-600 transition-colors"
                >
                  <Heart className="w-4 h-4" />
                  <span>{review._count.likes}</span>
                </button>
                <button
                  onClick={(e) => handleInteraction(e, 'comment')}
                  className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{review._count.comments}</span>
                </button>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Link
                  href={`/profile/${review.user.id}`}
                  className="hover:underline"
                >
                  @{review.user.nickname}
                </Link>
                <span>·</span>
                <span>{formatDate(review.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}