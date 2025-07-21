import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { postService, type Post } from '../services/postService';
import PostCard from '../components/posts/PostCard';
import Button from '../components/ui/Button';
import { BookOpen, TrendingUp, Users, Target, Plus, Loader2 } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalPosts: 0,
    completedBooks: 0,
    followers: 0,
    yearlyGoal: 12
  });

  useEffect(() => {
    if (user) {
      loadUserPosts();
    }
  }, [user]);

  const loadUserPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('DashboardPage: Loading user posts for user:', user?.id);
      
      const response = await postService.getPosts({ userId: user?.id, limit: 5 });
      console.log('DashboardPage: Posts loaded successfully:', response);
      
      setUserPosts(response.posts);
      
      // 통계 계산
      const completedBooks = response.posts.filter(post => post.readingProgress === 100).length;
      setStats(prev => ({
        ...prev,
        totalPosts: response.posts.length,
        completedBooks
      }));
    } catch (err) {
      console.error('DashboardPage: 사용자 게시글 로드 실패:', err);
      setError('게시글을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await postService.likePost(postId);
      setUserPosts(prevPosts => 
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
      setUserPosts(prevPosts => 
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                안녕하세요, {user?.nickname || user?.username}님!
              </h1>
              <p className="mt-2 text-gray-600 text-sm sm:text-base">
                오늘도 새로운 책과 함께 즐거운 독서 시간을 보내세요.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link to="/search" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">독서 기록 작성</span>
                  <span className="sm:hidden">기록 작성</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BookOpen className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      읽은 책
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.completedBooks}권
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      독서 기록
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalPosts}개
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      팔로워
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.followers}명
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Target className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      올해 목표
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.completedBooks}/{stats.yearlyGoal}권
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Posts */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  최근 독서 기록
                </h3>
              </div>
              <div className="p-6">
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">로딩 중...</span>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600">{error}</p>
                    <Button
                      onClick={loadUserPosts}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      다시 시도
                    </Button>
                  </div>
                )}

                {!loading && !error && userPosts.length === 0 && (
                  <div className="text-center py-12">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-sm font-medium text-gray-900">
                      아직 독서 기록이 없습니다
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      첫 번째 독서 기록을 작성해보세요!
                    </p>
                    <Link to="/search">
                      <Button className="mt-4">
                        독서 기록 작성하기
                      </Button>
                    </Link>
                  </div>
                )}

                {!loading && !error && userPosts.length > 0 && (
                  <div className="space-y-4">
                    {userPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onLike={handleLike}
                        onUnlike={handleUnlike}
                        onShare={handleShare}
                        className="shadow-sm"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Reading Goals */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  독서 목표
                </h3>
              </div>
              <div className="p-6">
                <div className="text-center">
                  <Target className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    올해 독서 목표를 설정해보세요
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  빠른 실행
                </h3>
              </div>
              <div className="p-6 space-y-3">
                <Link to="/search" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md block">
                  📚 책 검색하기
                </Link>
                <Link to="/search" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md block">
                  ✏️ 독서 기록 작성
                </Link>
                <Link to="/profile" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md block">
                  📖 내 서재 보기
                </Link>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                  🎯 독서 목표 설정
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;