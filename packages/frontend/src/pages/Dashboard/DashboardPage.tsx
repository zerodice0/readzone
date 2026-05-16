import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk, useSession, useUser } from '@clerk/clerk-react';
import {
  Loader2,
  BarChart3,
  FileText,
  Bookmark,
  User,
  LogOut,
  Save,
} from 'lucide-react';
import EmailVerificationBanner from '../../components/EmailVerificationBanner';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { ReadingStatsSection } from './components/ReadingStatsSection';
import { MyReviewsSection } from './components/MyReviewsSection';
import { BookmarksSection } from './components/BookmarksSection';

type ClerkUser = NonNullable<ReturnType<typeof useUser>['user']>;
type UserSession = Awaited<ReturnType<ClerkUser['getSessions']>>[number];
type TotpSetup = Awaited<ReturnType<ClerkUser['createTOTP']>>;

function getUserDisplayName(user: ReturnType<typeof useUser>['user']) {
  return (
    user?.fullName ||
    user?.firstName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    '사용자'
  );
}

function splitDisplayName(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ') || undefined,
  };
}

function AccountPanel() {
  const { user } = useUser();
  const { session } = useSession();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(getUserDisplayName(user));
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [totpSetup, setTotpSetup] = useState<TotpSetup | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isSecurityBusy, setIsSecurityBusy] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  const email = user?.primaryEmailAddress?.emailAddress || '';
  const isVerified =
    user?.primaryEmailAddress?.verification.status === 'verified';

  const loadSessions = async () => {
    if (!user) {
      return;
    }

    setIsLoadingSessions(true);

    try {
      setSessions(await user.getSessions());
    } catch {
      setError('세션 정보를 불러오지 못했습니다.');
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    loadSessions().catch(() => {});
  }, [user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      return;
    }

    setMessage('');
    setError('');
    setIsSaving(true);

    try {
      const { firstName, lastName } = splitDisplayName(displayName);

      await user.update({ firstName, lastName });
      await user.reload();
      setMessage('프로필이 저장되었습니다.');
    } catch {
      setError('프로필 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    void navigate('/feed');
  };

  const handleCreateTOTP = async () => {
    if (!user) {
      return;
    }

    setMessage('');
    setError('');
    setBackupCodes([]);
    setIsSecurityBusy(true);

    try {
      const result = await user.createTOTP();
      setTotpSetup(result);
      setMessage('인증 앱에 설정 값을 등록한 뒤 코드를 입력해주세요.');
    } catch {
      setError('인증 앱 설정을 시작하지 못했습니다.');
    } finally {
      setIsSecurityBusy(false);
    }
  };

  const handleVerifyTOTP = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      return;
    }

    setMessage('');
    setError('');
    setIsSecurityBusy(true);

    try {
      const result = await user.verifyTOTP({ code: totpCode });
      await user.reload();
      setTotpSetup(null);
      setTotpCode('');
      setBackupCodes(result.backupCodes ?? backupCodes);
      setMessage('인증 앱 2단계 인증이 켜졌습니다.');
    } catch {
      setError('인증 코드를 확인해주세요.');
    } finally {
      setIsSecurityBusy(false);
    }
  };

  const handleDisableTOTP = async () => {
    if (!user) {
      return;
    }

    const confirmed = window.confirm(
      '인증 앱 2단계 인증을 끄면 계정 보호 수준이 낮아집니다. 계속할까요?'
    );

    if (!confirmed) {
      return;
    }

    setMessage('');
    setError('');
    setIsSecurityBusy(true);

    try {
      await user.disableTOTP();
      await user.reload();
      setTotpSetup(null);
      setBackupCodes([]);
      setMessage('인증 앱 2단계 인증이 꺼졌습니다.');
    } catch {
      setError('2단계 인증을 끄지 못했습니다.');
    } finally {
      setIsSecurityBusy(false);
    }
  };

  const handleRevokeSession = async (targetSession: UserSession) => {
    if (targetSession.id === session?.id) {
      setError('현재 사용 중인 세션은 여기에서 종료할 수 없습니다.');
      return;
    }

    setMessage('');
    setError('');
    setIsSecurityBusy(true);

    try {
      await targetSession.revoke();
      await loadSessions();
      setMessage('선택한 세션을 종료했습니다.');
    } catch {
      setError('세션을 종료하지 못했습니다.');
    } finally {
      setIsSecurityBusy(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-xl">계정 관리</CardTitle>
        <CardDescription>표시 이름과 로그인 상태를 관리합니다.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border border-stone-200">
            <AvatarImage src={user.imageUrl} alt={getUserDisplayName(user)} />
            <AvatarFallback className="bg-primary-100 text-lg font-medium text-primary-700">
              {getUserDisplayName(user).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium text-stone-900">
              {getUserDisplayName(user)}
            </p>
            <p className="truncate text-sm text-stone-500">{email}</p>
            <p className="mt-1 text-xs text-stone-500">
              {isVerified ? '이메일 인증 완료' : '이메일 인증 필요'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="account-display-name"
              className="text-sm font-medium text-stone-700"
            >
              표시 이름
            </label>
            <input
              id="account-display-name"
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="paper-input w-full rounded-xl px-4 py-3 outline-none"
            />
          </div>

          {message && <p className="text-sm text-green-700">{message}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <p className="text-sm text-stone-500">
            비밀번호 변경이 필요하면 로그아웃 후 로그인 화면에서 비밀번호
            재설정을 진행해주세요.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              저장
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                handleSignOut().catch(() => {});
              }}
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </Button>
          </div>
        </form>

        <div className="border-t border-stone-200 pt-6">
          <h3 className="font-semibold text-stone-900">보안</h3>
          <div className="mt-3 grid gap-2 text-sm text-stone-600 sm:grid-cols-3">
            <p>2단계 인증: {user.twoFactorEnabled ? '켜짐' : '꺼짐'}</p>
            <p>인증 앱: {user.totpEnabled ? '켜짐' : '꺼짐'}</p>
            <p>백업 코드: {user.backupCodeEnabled ? '있음' : '없음'}</p>
          </div>

          <div className="mt-4 space-y-4">
            {!user.totpEnabled ? (
              <>
                {!totpSetup ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSecurityBusy}
                    onClick={() => {
                      handleCreateTOTP().catch(() => {});
                    }}
                  >
                    인증 앱 2단계 인증 설정
                  </Button>
                ) : (
                  <form onSubmit={handleVerifyTOTP} className="space-y-3">
                    <div className="rounded-xl bg-stone-50 p-3 text-sm text-stone-700">
                      <p className="font-medium">인증 앱에 등록할 값</p>
                      {totpSetup.uri && (
                        <p className="mt-2 break-all">URI: {totpSetup.uri}</p>
                      )}
                      {totpSetup.secret && (
                        <p className="mt-2 break-all">
                          Secret: {totpSetup.secret}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="totp-setup-code"
                        className="text-sm font-medium text-stone-700"
                      >
                        인증 앱 코드
                      </label>
                      <input
                        id="totp-setup-code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={totpCode}
                        onChange={(event) => setTotpCode(event.target.value)}
                        className="paper-input w-full rounded-xl px-4 py-3 outline-none"
                        required
                      />
                    </div>
                    <Button type="submit" disabled={isSecurityBusy}>
                      인증 앱 확인
                    </Button>
                  </form>
                )}
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled={isSecurityBusy}
                onClick={() => {
                  handleDisableTOTP().catch(() => {});
                }}
              >
                인증 앱 2단계 인증 끄기
              </Button>
            )}

            {backupCodes.length > 0 && (
              <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3">
                <p className="text-sm font-medium text-yellow-900">
                  백업 코드는 다시 볼 수 없습니다. 안전한 곳에 보관해주세요.
                </p>
                <div className="mt-2 grid gap-1 text-sm text-yellow-900 sm:grid-cols-2">
                  {backupCodes.map((code) => (
                    <code key={code} className="rounded bg-white/70 px-2 py-1">
                      {code}
                    </code>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-stone-200 pt-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-stone-900">로그인 세션</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isLoadingSessions}
              onClick={() => {
                loadSessions().catch(() => {});
              }}
            >
              새로고침
            </Button>
          </div>
          <div className="mt-3 space-y-3">
            {sessions.map((item) => {
              const isCurrent = item.id === session?.id;
              const activity = item.latestActivity;
              const browser = activity.browserName || '알 수 없는 브라우저';
              const device = activity.deviceType || '알 수 없는 기기';

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-xl border border-stone-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 text-sm">
                    <p className="font-medium text-stone-900">
                      {browser} / {device}
                      {isCurrent ? ' (현재 세션)' : ''}
                    </p>
                    <p className="text-stone-500">
                      마지막 활동:{' '}
                      {item.lastActiveAt
                        ? item.lastActiveAt.toLocaleString('ko-KR')
                        : '알 수 없음'}
                    </p>
                    <p className="text-stone-500">
                      위치:{' '}
                      {[activity.city, activity.country]
                        .filter(Boolean)
                        .join(', ') || '알 수 없음'}
                    </p>
                  </div>
                  {!isCurrent && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSecurityBusy}
                      onClick={() => {
                        handleRevokeSession(item).catch(() => {});
                      }}
                    >
                      세션 종료
                    </Button>
                  )}
                </div>
              );
            })}
            {sessions.length === 0 && (
              <p className="text-sm text-stone-500">표시할 세션이 없습니다.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 대시보드 페이지
 * 모든 사용자 관련 기능을 탭으로 통합
 * - 독서 통계
 * - 내 독후감
 * - 북마크
 * - 계정 관리
 */
function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState('stats');

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          <p className="text-stone-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Email Verification Banner */}
      {user && user.primaryEmailAddress?.verification.status !== 'verified' && (
        <EmailVerificationBanner />
      )}

      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 페이지 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-900">대시보드</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* 탭 네비게이션 - 모바일에서도 가로 스크롤 가능 */}
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap mb-6 h-auto p-1">
            <TabsTrigger
              value="stats"
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">독서 통계</span>
              <span className="sm:hidden">통계</span>
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">내 독후감</span>
              <span className="sm:hidden">독후감</span>
            </TabsTrigger>
            <TabsTrigger
              value="bookmarks"
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <Bookmark className="w-4 h-4" />
              <span>북마크</span>
            </TabsTrigger>
            <TabsTrigger
              value="account"
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">계정 관리</span>
              <span className="sm:hidden">계정</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
            <ReadingStatsSection />
          </TabsContent>

          <TabsContent value="reviews">
            <MyReviewsSection />
          </TabsContent>

          <TabsContent value="bookmarks">
            <BookmarksSection />
          </TabsContent>

          <TabsContent value="account">
            <AccountPanel />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

export default DashboardPage;
