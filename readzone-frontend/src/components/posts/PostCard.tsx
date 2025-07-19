import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Star, BookOpen, Calendar, User } from 'lucide-react';
import { cn } from '../../utils/cn';

interface PostCardProps {
  post: {
    id: string;
    content: string;
    rating?: number;
    readingProgress: number;
    tags: string[];
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
    user: {
      id: string;
      username: string;
      displayName: string | null;
      avatar: string | null;
    };
    book: {
      id: string;
      title: string;
      authors: string[];
      thumbnail: string | null;
      isbn: string;
    };
    stats: {
      likesCount: number;
      commentsCount: number;
    };
    isLiked?: boolean;
  };
  onLike?: (postId: string) => void;
  onUnlike?: (postId: string) => void;
  onShare?: (postId: string) => void;
  className?: string;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onUnlike,
  onShare,
  className,
}) => {
  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (post.isLiked && onUnlike) {
      onUnlike(post.id);
    } else if (!post.isLiked && onLike) {
      onLike(post.id);
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onShare) {
      onShare(post.id);
    }
  };

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow', className)}>
      <div className="p-4 sm:p-6">
        {/* 사용자 정보 */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
              {post.user.avatar ? (
                <img
                  src={post.user.avatar}
                  alt={post.user.username}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <Link
              to={`/users/${post.user.id}`}
              className="font-medium text-gray-900 hover:text-blue-600 text-sm sm:text-base truncate block"
            >
              {post.user.displayName || post.user.username}
            </Link>
            <p className="text-xs sm:text-sm text-gray-500 truncate">@{post.user.username}</p>
          </div>
          <div className="flex-shrink-0 flex items-center text-xs sm:text-sm text-gray-500">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <span className="hidden sm:inline">{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
            <span className="sm:hidden">{new Date(post.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>

        {/* 책 정보 */}
        <div className="flex items-center space-x-3 mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
          <div className="flex-shrink-0">
            <img
              src={post.book.thumbnail || '/placeholder-book.jpg'}
              alt={post.book.title}
              className="w-10 h-12 sm:w-12 sm:h-16 object-cover rounded"
            />
          </div>
          <div className="flex-1 min-w-0">
            <Link
              to={`/books/${post.book.id}`}
              className="font-medium text-gray-900 hover:text-blue-600 line-clamp-1 text-sm sm:text-base"
            >
              {post.book.title}
            </Link>
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-1">
              {post.book.authors.join(', ')}
            </p>
            <div className="flex items-center mt-1 flex-wrap gap-1 sm:gap-3">
              {post.rating && (
                <div className="flex items-center">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current mr-1" />
                  <span className="text-xs sm:text-sm text-gray-600">{post.rating}/5</span>
                </div>
              )}
              <div className="flex items-center">
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 mr-1" />
                <span className="text-xs sm:text-sm text-gray-600">{post.readingProgress}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 게시글 내용 */}
        <div className="mb-4">
          <Link to={`/posts/${post.id}`} className="block">
            <p className="text-gray-800 leading-relaxed line-clamp-3 text-sm sm:text-base">
              {post.content}
            </p>
          </Link>
        </div>

        {/* 태그 */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 sm:gap-2 mb-4">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-block bg-gray-100 text-gray-700 text-xs sm:text-sm px-2 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="inline-block text-gray-500 text-xs sm:text-sm px-2 py-1">
                +{post.tags.length - 3}개
              </span>
            )}
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-3 sm:space-x-6">
            <button
              onClick={handleLikeClick}
              className={cn(
                'flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm transition-colors',
                post.isLiked
                  ? 'text-red-600 hover:text-red-700'
                  : 'text-gray-600 hover:text-red-600'
              )}
            >
              <Heart className={cn('w-4 h-4 sm:w-5 sm:h-5', post.isLiked && 'fill-current')} />
              <span>{post.stats.likesCount}</span>
            </button>
            
            <Link
              to={`/posts/${post.id}`}
              className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{post.stats.commentsCount}</span>
            </Link>
            
            <button
              onClick={handleShareClick}
              className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600 hover:text-green-600 transition-colors"
            >
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">공유</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2">
            {!post.isPublic && (
              <span className="text-xs text-gray-500 bg-gray-100 px-1 sm:px-2 py-1 rounded">
                비공개
              </span>
            )}
            <Link
              to={`/posts/${post.id}`}
              className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <span className="hidden sm:inline">자세히 보기</span>
              <span className="sm:hidden">더보기</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;