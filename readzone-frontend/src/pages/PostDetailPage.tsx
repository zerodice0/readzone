import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Share2, Star, BookOpen, Calendar, User, Edit3, Trash2 } from 'lucide-react';
import { postService, type Post } from '../services/postService';
import { useAuthStore } from '../stores/authStore';
import CommentList from '../components/comments/CommentList';
import Button from '../components/ui/Button';
import { cn } from '../utils/cn';

const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadPost();
    }
  }, [id]);

  const loadPost = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const postData = await postService.getPostById(id);
      setPost(postData);
    } catch (err) {
      console.error('게시글 로드 실패:', err);
      setError('게시글을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!post || !user) return;

    try {
      if (post.isLiked) {
        await postService.unlikePost(post.id);
        setPost(prev => prev ? {
          ...prev,
          isLiked: false,
          stats: { ...prev.stats, likesCount: prev.stats.likesCount - 1 }
        } : null);
      } else {
        await postService.likePost(post.id);
        setPost(prev => prev ? {
          ...prev,
          isLiked: true,
          stats: { ...prev.stats, likesCount: prev.stats.likesCount + 1 }
        } : null);
      }
    } catch (err) {
      console.error('좋아요 실패:', err);
    }
  };

  const handleShare = async () => {
    if (!post) return;

    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('링크가 복사되었습니다!');
    } catch (err) {
      console.error('공유 실패:', err);
    }
  };

  const handleEdit = () => {
    if (!post) return;
    navigate(`/posts/${post.id}/edit`);
  };

  const handleDelete = async () => {
    if (!post || !confirm('정말 이 게시글을 삭제하시겠습니까?')) return;

    try {
      await postService.deletePost(post.id);
      navigate('/dashboard');
    } catch (err) {
      console.error('게시글 삭제 실패:', err);
      alert('게시글 삭제 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-600 mb-4">{error || '게시글을 찾을 수 없습니다.'}</p>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              대시보드로 이동
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === post.user.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 뒤로가기 버튼 */}
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          돌아가기
        </Button>

        {/* 게시글 상세 */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="p-6">
            {/* 작성자 정보 */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  {post.user.avatar ? (
                    <img
                      src={post.user.avatar}
                      alt={post.user.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-blue-600" />
                  )}
                </div>
                <div>
                  <Link
                    to={`/users/${post.user.id}`}
                    className="font-semibold text-gray-900 hover:text-blue-600"
                  >
                    {post.user.displayName || post.user.username}
                  </Link>
                  <p className="text-sm text-gray-500">@{post.user.username}</p>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
                </div>
              </div>

              {isOwner && (
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={handleEdit}
                    variant="ghost"
                    size="sm"
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    수정
                  </Button>
                  <Button
                    onClick={handleDelete}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    삭제
                  </Button>
                </div>
              )}
            </div>

            {/* 책 정보 */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-4">
                <img
                  src={post.book.thumbnail || '/placeholder-book.jpg'}
                  alt={post.book.title}
                  className="w-16 h-20 object-cover rounded"
                />
                <div className="flex-1">
                  <Link
                    to={`/books/${post.book.id}`}
                    className="font-semibold text-gray-900 hover:text-blue-600 line-clamp-2"
                  >
                    {post.book.title}
                  </Link>
                  <p className="text-sm text-gray-600 mt-1">
                    {post.book.authors.join(', ')}
                  </p>
                  <div className="flex items-center mt-2 space-x-4">
                    {post.rating && (
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                        <span className="text-sm font-medium">{post.rating}/5</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <BookOpen className="w-4 h-4 text-blue-600 mr-1" />
                      <span className="text-sm font-medium">{post.readingProgress}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 게시글 내용 */}
            <div className="prose max-w-none mb-6">
              <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {post.content}
              </div>
            </div>

            {/* 태그 */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-6">
                <button
                  onClick={handleLike}
                  className={cn(
                    'flex items-center space-x-2 transition-colors',
                    post.isLiked
                      ? 'text-red-600 hover:text-red-700'
                      : 'text-gray-600 hover:text-red-600'
                  )}
                  disabled={!user}
                >
                  <Heart className={cn('w-5 h-5', post.isLiked && 'fill-current')} />
                  <span className="font-medium">{post.stats.likesCount}</span>
                </button>
                
                <div className="flex items-center space-x-2 text-gray-600">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">{post.stats.commentsCount}</span>
                </div>
                
                <button
                  onClick={handleShare}
                  className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  <span>공유</span>
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                {!post.isPublic && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    비공개
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 댓글 섹션 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <CommentList postId={post.id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;