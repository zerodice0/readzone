import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import Button from '../components/ui/Button';
import PostCard from '../components/posts/PostCard';
import { postService, type Post } from '../services/postService';
import { BookOpen, Users, Star, TrendingUp, Loader2 } from 'lucide-react';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadPosts();
    }
  }, [isAuthenticated]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await postService.getPosts({ limit: 10 });
      setPosts(response.posts);
    } catch (err) {
      console.error('피드 로드 실패:', err);
      setError('피드를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await postService.likePost(postId);
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, isLiked: true, stats: { ...post.stats, likesCount: post.stats.likesCount + 1 } }
            : post
        )
      );
    } catch (err) {
      console.error('좋아요 실패:', err);
    }
  };

  const handleUnlike = async (postId: string) => {
    try {
      await postService.unlikePost(postId);
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, isLiked: false, stats: { ...post.stats, likesCount: post.stats.likesCount - 1 } }
            : post
        )
      );
    } catch (err) {
      console.error('좋아요 취소 실패:', err);
    }
  };

  const handleShare = async (postId: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/posts/${postId}`);
      alert('링크가 복사되었습니다!');
    } catch (err) {
      console.error('공유 실패:', err);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ReadZone 피드</h1>
            <p className="text-gray-600">커뮤니티의 최신 독서 기록들을 확인해보세요.</p>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-4 mb-8">
            <Link to="/search">
              <Button variant="outline">
                <BookOpen className="w-4 h-4 mr-2" />
                독서 기록 작성
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline">
                대시보드
              </Button>
            </Link>
          </div>

          {/* 피드 */}
          <div className="space-y-6">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">피드를 불러오는 중...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{error}</p>
                <Button
                  onClick={loadPosts}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  다시 시도
                </Button>
              </div>
            )}

            {!loading && !error && posts.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  아직 독서 기록이 없습니다
                </h3>
                <p className="text-gray-600 mb-4">
                  첫 번째 독서 기록을 작성해보세요!
                </p>
                <Link to="/search">
                  <Button>
                    독서 기록 작성하기
                  </Button>
                </Link>
              </div>
            )}

            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onUnlike={handleUnlike}
                onShare={handleShare}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              독서의 새로운 경험
              <br />
              <span className="text-blue-600">ReadZone</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              책을 읽고, 기록하고, 공유하세요. 
              일상적이고 캐주얼한 독서 문화를 만들어가는 모던한 플랫폼입니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto">
                    대시보드로 이동
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="lg" className="w-full sm:w-auto">
                      지금 시작하기
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      로그인
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              왜 ReadZone을 선택해야 할까요?
            </h2>
            <p className="text-lg text-gray-600">
              독서를 더 즐겁고 의미있게 만드는 기능들을 만나보세요.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                간편한 독서 기록
              </h3>
              <p className="text-gray-600">
                책을 읽으며 떠오르는 생각들을 쉽고 빠르게 기록할 수 있습니다.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                커뮤니티 공유
              </h3>
              <p className="text-gray-600">
                다른 독자들과 독서 경험을 공유하고 새로운 책을 발견하세요.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                개인 서재
              </h3>
              <p className="text-gray-600">
                나만의 디지털 서재를 구성하고 독서 목표를 관리하세요.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mb-4">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                독서 통계
              </h3>
              <p className="text-gray-600">
                내 독서 패턴을 분석하고 더 나은 독서 습관을 만들어보세요.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            오늘부터 시작해보세요
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            ReadZone과 함께 더 풍부한 독서 경험을 만들어보세요.
          </p>
          {!isAuthenticated && (
            <Link to="/register">
              <Button variant="secondary" size="lg">
                무료로 시작하기
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;