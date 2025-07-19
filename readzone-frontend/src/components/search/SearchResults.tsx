import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  User, 
  Hash, 
  MessageCircle, 
  Calendar
} from 'lucide-react';
import type { SearchResults as SearchResultsType } from '../../services/searchService';
import PostCard from '../posts/PostCard';
import Button from '../ui/Button';

interface SearchResultsProps {
  results: SearchResultsType;
  query: string;
  activeTab: 'all' | 'posts' | 'users' | 'tags';
  onTabChange: (tab: 'all' | 'posts' | 'users' | 'tags') => void;
  onLoadMore?: () => void;
  loading?: boolean;
  hasMore?: boolean;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  query,
  activeTab,
  onTabChange,
  onLoadMore,
  loading = false,
  hasMore = false
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTabCount = (tab: string) => {
    switch (tab) {
      case 'posts':
        return results.posts.length;
      case 'users':
        return results.users.length;
      case 'tags':
        return results.tags.length;
      default:
        return results.posts.length + results.users.length + results.tags.length;
    }
  };

  return (
    <div className="space-y-6">
      {/* 탭 네비게이션 */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {['all', 'posts', 'users', 'tags'].map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab as any)}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'all' && <BookOpen className="w-4 h-4 inline mr-2" />}
              {tab === 'posts' && <MessageCircle className="w-4 h-4 inline mr-2" />}
              {tab === 'users' && <User className="w-4 h-4 inline mr-2" />}
              {tab === 'tags' && <Hash className="w-4 h-4 inline mr-2" />}
              {tab === 'all' ? '전체' : 
               tab === 'posts' ? '게시글' :
               tab === 'users' ? '사용자' : '태그'}
              <span className="ml-1 text-xs text-gray-500">
                ({getTabCount(tab)})
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* 검색 결과 */}
      <div className="space-y-6">
        {/* 전체 탭 */}
        {activeTab === 'all' && (
          <>
            {/* 게시글 결과 */}
            {results.posts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  게시글 ({results.posts.length})
                </h3>
                <div className="space-y-4">
                  {results.posts.slice(0, 3).map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                  {results.posts.length > 3 && (
                    <div className="text-center">
                      <Button
                        variant="outline"
                        onClick={() => onTabChange('posts')}
                      >
                        게시글 더 보기 ({results.posts.length - 3}개 더)
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 사용자 결과 */}
            {results.users.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  사용자 ({results.users.length})
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {results.users.slice(0, 6).map((user) => (
                    <Link
                      key={user.id}
                      to={`/users/${user.id}`}
                      className="block bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.username}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {user.displayName || user.username}
                          </h4>
                          <p className="text-sm text-gray-600">@{user.username}</p>
                          {user.bio && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {user.bio}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>{user.stats.postsCount} 게시글</span>
                            <span>{user.stats.followersCount} 팔로워</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {results.users.length > 6 && (
                    <div className="flex items-center justify-center">
                      <Button
                        variant="outline"
                        onClick={() => onTabChange('users')}
                      >
                        사용자 더 보기
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 태그 결과 */}
            {results.tags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Hash className="w-5 h-5 mr-2" />
                  태그 ({results.tags.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {results.tags.slice(0, 10).map((tag) => (
                    <Link
                      key={tag.tag}
                      to={`/search/tags/${encodeURIComponent(tag.tag)}`}
                      className="inline-flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
                    >
                      <Hash className="w-3 h-3 mr-1" />
                      {tag.tag}
                      <span className="ml-2 text-xs text-gray-500">
                        {tag.count}
                      </span>
                    </Link>
                  ))}
                  {results.tags.length > 10 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onTabChange('tags')}
                    >
                      태그 더 보기
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* 게시글 탭 */}
        {activeTab === 'posts' && (
          <div>
            {results.posts.length > 0 ? (
              <div className="space-y-6">
                {results.posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
                
                {hasMore && (
                  <div className="text-center">
                    <Button
                      onClick={onLoadMore}
                      variant="outline"
                      loading={loading}
                      disabled={loading}
                    >
                      더 많은 게시글 보기
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  게시글을 찾을 수 없습니다
                </h3>
                <p className="text-gray-600">
                  '{query}' 와 관련된 게시글이 없습니다.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 사용자 탭 */}
        {activeTab === 'users' && (
          <div>
            {results.users.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {results.users.map((user) => (
                  <Link
                    key={user.id}
                    to={`/users/${user.id}`}
                    className="block bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="text-center">
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
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {user.displayName || user.username}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">@{user.username}</p>
                      {user.bio && (
                        <p className="text-sm text-gray-500 mb-4 line-clamp-3">
                          {user.bio}
                        </p>
                      )}
                      <div className="grid grid-cols-3 gap-4 text-center text-sm">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {user.stats.postsCount}
                          </div>
                          <div className="text-gray-600">게시글</div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {user.stats.followersCount}
                          </div>
                          <div className="text-gray-600">팔로워</div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {user.stats.followingCount}
                          </div>
                          <div className="text-gray-600">팔로잉</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-center mt-4 text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(user.createdAt)} 가입
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  사용자를 찾을 수 없습니다
                </h3>
                <p className="text-gray-600">
                  '{query}' 와 관련된 사용자가 없습니다.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 태그 탭 */}
        {activeTab === 'tags' && (
          <div>
            {results.tags.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.tags.map((tag) => (
                  <Link
                    key={tag.tag}
                    to={`/search/tags/${encodeURIComponent(tag.tag)}`}
                    className="block bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Hash className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="font-medium text-gray-900">{tag.tag}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {tag.count} 개
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Hash className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  태그를 찾을 수 없습니다
                </h3>
                <p className="text-gray-600">
                  '{query}' 와 관련된 태그가 없습니다.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;