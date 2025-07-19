import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  User, 
  Calendar, 
  Users, 
  BookOpen, 
  UserPlus, 
  UserMinus, 
  Eye,
  EyeOff,
  Settings,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { userService, type User as UserType, type UserPost } from '../services/userService';
import { useAuthStore } from '../stores/authStore';
import Button from '../components/ui/Button';
import PostCard from '../components/posts/PostCard';

const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuthStore();
  const [user, setUser] = useState<UserType | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'followers' | 'following'>('posts');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    if (userId) {
      loadUserProfile();
    }
  }, [userId]);

  useEffect(() => {
    if (userId && activeTab === 'posts') {
      loadUserPosts();
    }
  }, [userId, activeTab]);

  const loadUserProfile = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const userData = await userService.getUserProfile(userId);
      setUser(userData);
    } catch (err) {
      console.error('사용자 프로필 로드 실패:', err);
      setError('사용자 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadUserPosts = async (page = 1) => {
    if (!userId) return;

    try {
      setPostsLoading(true);
      const response = await userService.getUserPosts(userId, { page, limit: 10 });
      
      if (page === 1) {
        setPosts(response.items);
      } else {
        setPosts(prev => [...prev, ...response.items]);
      }
      
      setPagination(response.pagination);
    } catch (err) {
      console.error('사용자 게시글 로드 실패:', err);
      setError('게시글을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setPostsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!userId || !user) return;

    try {
      setFollowLoading(true);
      
      if (user.isFollowing) {
        await userService.unfollowUser(userId);
        setUser(prev => prev ? {
          ...prev,
          isFollowing: false,
          stats: {
            ...prev.stats,
            followersCount: prev.stats.followersCount - 1
          }
        } : null);
      } else {
        await userService.followUser(userId);
        setUser(prev => prev ? {
          ...prev,
          isFollowing: true,
          stats: {
            ...prev.stats,
            followersCount: prev.stats.followersCount + 1
          }
        } : null);
      }
    } catch (err) {
      console.error('팔로우 처리 실패:', err);
      alert('팔로우 처리 중 오류가 발생했습니다.');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (pagination.page < pagination.totalPages && !postsLoading) {
      loadUserPosts(pagination.page + 1);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">프로필을 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md">
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              프로필을 불러올 수 없습니다
            </h3>
            <p className="text-gray-600 mb-4">
              {error || '사용자를 찾을 수 없습니다.'}
            </p>
            <Button onClick={loadUserProfile} variant="outline">
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 비공개 프로필 처리
  if (!user.isPublic && !isOwnProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-gray-500" />
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {user.displayName || user.username}
            </h2>
            <p className="text-gray-600 mb-4 flex items-center justify-center">
              <EyeOff className="w-4 h-4 mr-1" />
              비공개 계정입니다
            </p>
            {currentUser && (
              <Button
                onClick={handleFollow}
                loading={followLoading}
                disabled={followLoading}
                variant={user.isFollowing ? "outline" : "primary"}
              >
                {user.isFollowing ? (
                  <>
                    <UserMinus className="w-4 h-4 mr-2" />
                    언팔로우
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    팔로우
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* 프로필 헤더 */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-gray-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {user.displayName || user.username}
                    </h1>
                    {user.isPublic ? (
                      <Eye className="w-5 h-5 text-green-500" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <p className="text-gray-600">@{user.username}</p>
                  {user.bio && (
                    <p className="text-gray-700 mt-2">{user.bio}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(user.createdAt)} 가입
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {isOwnProfile ? (
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    프로필 편집
                  </Button>
                ) : currentUser ? (
                  <Button
                    onClick={handleFollow}
                    loading={followLoading}
                    disabled={followLoading}
                    variant={user.isFollowing ? "outline" : "primary"}
                    size="sm"
                  >
                    {user.isFollowing ? (
                      <>
                        <UserMinus className="w-4 h-4 mr-2" />
                        언팔로우
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        팔로우
                      </>
                    )}
                  </Button>
                ) : null}
              </div>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {user.stats.postsCount}
                </div>
                <div className="text-sm text-gray-600">게시글</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {user.stats.followersCount}
                </div>
                <div className="text-sm text-gray-600">팔로워</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {user.stats.followingCount}
                </div>
                <div className="text-sm text-gray-600">팔로잉</div>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('posts')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'posts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-2" />
              게시글
            </button>
            <button
              onClick={() => setActiveTab('followers')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'followers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              팔로워
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'following'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              팔로잉
            </button>
          </nav>
        </div>

        {/* 컨텐츠 */}
        {activeTab === 'posts' && (
          <div>
            {postsLoading && posts.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">게시글을 불러오는 중...</span>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md">
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    게시글이 없습니다
                  </h3>
                  <p className="text-gray-600">
                    {isOwnProfile 
                      ? '첫 번째 독서 기록을 작성해보세요!'
                      : '아직 작성한 게시글이 없습니다.'
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
                
                {/* 더 보기 버튼 */}
                {pagination.page < pagination.totalPages && (
                  <div className="text-center">
                    <Button
                      onClick={handleLoadMore}
                      variant="outline"
                      loading={postsLoading}
                      disabled={postsLoading}
                    >
                      더 많은 게시글 보기
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'followers' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6">
              <p className="text-center text-gray-600">
                팔로워 목록 기능은 준비 중입니다.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'following' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6">
              <p className="text-center text-gray-600">
                팔로잉 목록 기능은 준비 중입니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;