import { useState } from 'react';
import { Heart, MessageCircle, MoreHorizontal, Share } from 'lucide-react';
import type { ReviewCard as ReviewCardType } from '@/types/feed';
import { formatTimeAgo } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ReviewCardProps {
  review: ReviewCardType;
  onLike: (reviewId: string) => void;
  onComment: (reviewId: string) => void;
  onShare: (reviewId: string) => void;
  onProfileClick: (userId: string) => void;
  onBookClick: (bookId: string) => void;
  onReviewClick: (reviewId: string) => void;
  isAuthenticated: boolean;
}

const ReviewCard = ({
  review,
  onLike,
  onComment,
  onShare,
  onProfileClick,
  onBookClick,
  onReviewClick,
  isAuthenticated
}: ReviewCardProps) => {
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const { toast } = useToast();

  const handleLike = () => {
    if (!isAuthenticated) {
      toast({
        variant: 'warning',
        title: '로그인 필요',
        description: '좋아요를 누르려면 로그인이 필요합니다.',
      });
      
      return;
    }
    
    setIsLikeAnimating(true);
    onLike(review.id);
    
    // 애니메이션 완료 후 상태 리셋
    setTimeout(() => setIsLikeAnimating(false), 300);
  };

  const handleComment = () => {
    if (!isAuthenticated) {
      toast({
        variant: 'warning',
        title: '로그인 필요',
        description: '댓글을 남기려면 로그인이 필요합니다.',
      });
      
      return;
    }
    onComment(review.id);
  };

  const handleShare = () => {
    onShare(review.id);
  };

  const isLiked = review.userInteraction?.isLiked ?? false;

  return (
    <article className="review-card bg-card border border-border rounded-lg p-6 space-y-4 hover:shadow-md transition-shadow">
      {/* 작성자 정보 */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => onProfileClick(review.author.id)}
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            {review.author.profileImage ? (
              <img
                src={review.author.profileImage}
                alt={`${review.author.username}의 프로필`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium text-muted-foreground">
                {review.author.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="text-left">
            <p className="font-medium text-foreground">{review.author.username}</p>
            <p className="text-xs text-muted-foreground">
              {formatTimeAgo(review.createdAt)}
            </p>
          </div>
        </button>
        
        <div className="ml-auto">
          <button className="p-1 rounded-full hover:bg-muted transition-colors">
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* 도서 정보 */}
      <div className="flex space-x-4">
        <button
          onClick={() => onBookClick(review.book.id)}
          className="flex-shrink-0 hover:opacity-80 transition-opacity"
        >
          <div className="w-16 h-20 bg-muted rounded-md overflow-hidden">
            {review.book.cover ? (
              <img
                src={review.book.cover}
                alt={`${review.book.title} 표지`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-xs text-muted-foreground text-center px-1">
                  표지 없음
                </span>
              </div>
            )}
          </div>
        </button>
        
        <div className="flex-grow min-w-0">
          <button
            onClick={() => onBookClick(review.book.id)}
            className="text-left hover:opacity-80 transition-opacity"
          >
            <h3 className="font-medium text-foreground line-clamp-2 mb-1">
              {review.book.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              {review.book.author}
            </p>
          </button>
        </div>
      </div>

      {/* 독후감 내용 */}
      <div className="space-y-2">
        <button
          onClick={() => onReviewClick(review.id)}
          className="text-left w-full hover:opacity-80 transition-opacity"
        >
          <p className="text-foreground line-clamp-4 whitespace-pre-line">
            {review.content}
          </p>
        </button>
      </div>

      {/* 상호작용 버튼 */}
      <div className="flex items-center space-x-6 pt-2">
        <button
          onClick={handleLike}
          className={`flex items-center space-x-2 group transition-colors ${
            isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
          }`}
        >
          <Heart 
            className={`h-5 w-5 transition-all duration-300 ${
              isLiked ? 'fill-current' : 'group-hover:scale-110'
            } ${
              isLikeAnimating ? 'scale-125' : ''
            }`}
          />
          <span className="text-sm font-medium">
            {review.stats.likes > 0 ? review.stats.likes : ''}
          </span>
        </button>

        <button
          onClick={handleComment}
          className="flex items-center space-x-2 text-muted-foreground hover:text-blue-500 transition-colors group"
        >
          <MessageCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">
            {review.stats.comments > 0 ? review.stats.comments : ''}
          </span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center space-x-2 text-muted-foreground hover:text-green-500 transition-colors group"
        >
          <Share className="h-5 w-5 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">
            {review.stats.shares > 0 ? review.stats.shares : ''}
          </span>
        </button>
      </div>
    </article>
  );
};

export default ReviewCard;