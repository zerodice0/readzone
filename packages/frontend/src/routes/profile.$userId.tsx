import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getUserProfile } from '@/lib/api/auth'

export const Route = createFileRoute('/profile/$userid')({
  component: ProfilePage,
})

function ProfilePage() {
  const { userid } = Route.useParams()
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user-profile', userid],
    queryFn: () => getUserProfile(userid),
    retry: false,
  })

  if (isLoading) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">프로필 로딩 중...</h2>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">프로필을 찾을 수 없습니다</h2>
        <p className="text-muted-foreground">사용자 @{userid}를 찾을 수 없습니다.</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">프로필을 찾을 수 없습니다</h2>
        <p className="text-muted-foreground">사용자 @{userid}를 찾을 수 없습니다.</p>
      </div>
    )
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* 프로필 헤더 */}
        <div className="flex items-center space-x-6 mb-6">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
            {user.profileImage ? (
              <img 
                src={user.profileImage} 
                alt={`${user.nickname}의 프로필`}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-gray-500">
                {user.nickname.charAt(0)}
              </span>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h1 className="text-2xl font-bold">{user.nickname}</h1>
              {user.isVerified && (
                <span className="text-blue-500 text-sm">✓ 인증</span>
              )}
            </div>
            <p className="text-gray-600 mb-1">@{user.userid}</p>
            {user.bio && (
              <p className="text-gray-700">{user.bio}</p>
            )}
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{user._count?.reviews ?? 0}</div>
            <div className="text-sm text-gray-600">독후감</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{user._count?.likes ?? 0}</div>
            <div className="text-sm text-gray-600">좋아요</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{user._count?.followers ?? 0}</div>
            <div className="text-sm text-gray-600">팔로워</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{user._count?.following ?? 0}</div>
            <div className="text-sm text-gray-600">팔로잉</div>
          </div>
        </div>

        {/* 가입 정보 */}
        <div className="text-sm text-gray-500">
          {new Date(user.createdAt).toLocaleDateString('ko-KR')}에 가입
        </div>
      </div>
    </div>
  )
}