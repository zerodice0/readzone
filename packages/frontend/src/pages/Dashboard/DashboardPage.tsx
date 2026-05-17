import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useClerk, useSession, useUser } from '@clerk/clerk-react';
import { useQuery } from 'convex/react';
import {
  Loader2,
  BarChart3,
  FileText,
  Bookmark,
  User,
  LogOut,
  Save,
  Pencil,
  BookOpen,
} from 'lucide-react';
import { api } from 'convex/_generated/api';
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
import { Badge } from '../../components/ui/badge';
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
import {
  getUnsafeMetadataWithDisplayName,
  getUserDisplayName,
} from '../../utils/userDisplayName';

type ClerkUser = NonNullable<ReturnType<typeof useUser>['user']>;
type UserSession = Awaited<ReturnType<ClerkUser['getSessions']>>[number];
type DashboardTab = 'stats' | 'reviews' | 'bookmarks' | 'account';

const sessionDateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function getDashboardTab(value: string | null): DashboardTab {
  if (value === 'reviews' || value === 'bookmarks' || value === 'account') {
    return value;
  }

  return 'stats';
}

function formatMemberNumber(memberNumber: number) {
  return `#${memberNumber.toString().padStart(6, '0')}`;
}

function AccountPanel() {
  const { user } = useUser();
  const { session } = useSession();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const currentUserRecord = useQuery(
    api.users.getByClerkId,
    user ? { clerkUserId: user.id } : 'skip'
  );
  const [displayName, setDisplayName] = useState(getUserDisplayName(user));
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isSecurityBusy, setIsSecurityBusy] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  const email = user?.primaryEmailAddress?.emailAddress || '';
  const currentDisplayName = getUserDisplayName(user);
  const isDisplayNameUnchanged = displayName.trim() === currentDisplayName;
  const memberNumber = currentUserRecord?.memberNumber;
  const memberBadgeLabel =
    typeof memberNumber === 'number'
      ? formatMemberNumber(memberNumber)
      : '발급 대기';
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

  useEffect(() => {
    if (!isEditingDisplayName) {
      setDisplayName(currentDisplayName);
    }
  }, [currentDisplayName, isEditingDisplayName]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      return;
    }

    setMessage('');
    setError('');
    setIsSaving(true);

    try {
      const nextDisplayName = displayName.trim();

      await user.update({
        unsafeMetadata: getUnsafeMetadataWithDisplayName(
          user.unsafeMetadata,
          nextDisplayName
        ),
      });
      await user.reload();
      setDisplayName(nextDisplayName);
      setIsEditingDisplayName(false);
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
    <Card className="paper-surface rounded-xl border-paper-200/80 shadow-sm hover:shadow-sm">
      <CardHeader className="border-b border-paper-200/70 pb-4">
        <CardTitle className="text-xl text-stone-950">계정 관리</CardTitle>
        <CardDescription className="text-stone-500">
          표시 이름과 로그인 상태를 관리합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="paper-panel flex items-center gap-4 rounded-xl p-4">
          <Avatar className="h-16 w-16 border border-stone-200">
            <AvatarImage src={user.imageUrl} alt={getUserDisplayName(user)} />
            <AvatarFallback className="bg-primary-100 text-lg font-medium text-primary-700">
              {getUserDisplayName(user).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <p className="min-w-0 truncate font-medium text-stone-900">
                {currentDisplayName}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 px-2"
                disabled={isEditingDisplayName}
                onClick={() => {
                  setMessage('');
                  setError('');
                  setDisplayName(currentDisplayName);
                  setIsEditingDisplayName(true);
                }}
              >
                <Pencil className="h-4 w-4" />
                수정
              </Button>
            </div>
            <p className="truncate text-sm text-stone-500">{email}</p>
            <Badge
              variant="outline"
              className="mt-1 w-fit border-primary-200 bg-primary-50/70 font-mono text-[11px] tracking-wide text-primary-800"
              title={typeof memberNumber === 'number' ? undefined : user.id}
              aria-label={`회원 번호 ${memberBadgeLabel}`}
            >
              회원번호 {memberBadgeLabel}
            </Badge>
            <p className="mt-1 text-xs text-stone-500">
              {isVerified ? '이메일 인증 완료' : '이메일 인증 필요'}
            </p>
          </div>
        </div>

        {message && <p className="text-sm text-green-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {isEditingDisplayName && (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl border border-paper-200/80 bg-[#fffdf8]/70 p-4"
          >
            <div className="space-y-2">
              <label
                htmlFor="account-display-name"
                className="text-sm font-medium text-stone-700"
              >
                표시 이름 변경
              </label>
              <input
                id="account-display-name"
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                name="displayName"
                autoComplete="off"
                className="paper-input w-full rounded-xl px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="submit"
                disabled={isSaving || isDisplayNameUnchanged}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                표시 이름 저장
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={() => {
                  setDisplayName(currentDisplayName);
                  setIsEditingDisplayName(false);
                  setMessage('');
                  setError('');
                }}
              >
                취소
              </Button>
            </div>
          </form>
        )}

        <div className="rounded-xl border border-paper-200/70 bg-[#fffdf8]/55 p-4">
          <p className="text-sm text-stone-500">
            비밀번호 변경이 필요하면 로그아웃 후 로그인 화면에서 비밀번호
            재설정을 진행해주세요.
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => {
              handleSignOut().catch(() => {});
            }}
          >
            <LogOut className="h-4 w-4" />
            로그아웃
          </Button>
        </div>

        <div className="border-t border-paper-200/80 pt-6">
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
                  className="paper-panel flex flex-col gap-3 rounded-xl p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 text-sm">
                    <p className="font-medium text-stone-900">
                      {browser} / {device}
                      {isCurrent ? ' (현재 세션)' : ''}
                    </p>
                    <p className="text-stone-500">
                      마지막 활동:{' '}
                      {item.lastActiveAt
                        ? sessionDateFormatter.format(item.lastActiveAt)
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
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<DashboardTab>(() =>
    getDashboardTab(tabParam)
  );

  useEffect(() => {
    setActiveTab(getDashboardTab(tabParam));
  }, [tabParam]);

  const handleTabChange = (value: string) => {
    const nextTab = getDashboardTab(value);
    setActiveTab(nextTab);
    setSearchParams(nextTab === 'stats' ? {} : { tab: nextTab }, {
      replace: true,
    });
  };

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

      <div className="mx-auto max-w-5xl px-4 pb-8 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <section className="paper-surface mb-5 rounded-xl px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="mb-1 text-sm font-semibold text-primary-700">
                나의 독서 기록
              </p>
              <h1 className="text-2xl font-bold text-stone-950 text-pretty">
                대시보드
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600 break-keep">
                독후감, 북마크, 계정 정보를 한 곳에서 확인합니다.
              </p>
            </div>
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100/80 text-primary-700 sm:flex">
              <BookOpen className="h-6 w-6" />
            </div>
          </div>
        </section>

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          {/* 탭 네비게이션 - 모바일에서도 가로 스크롤 가능 */}
          <TabsList className="paper-surface mb-6 grid h-auto w-full grid-cols-4 gap-1 overflow-x-auto rounded-xl border-paper-200/80 p-1 shadow-sm">
            <TabsTrigger
              value="stats"
              className="h-11 min-w-0 gap-2 rounded-lg px-2 text-stone-600 data-[state=active]:bg-[#fffdf8] data-[state=active]:text-primary-800 data-[state=active]:ring-1 data-[state=active]:ring-paper-200"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">독서 통계</span>
              <span className="sm:hidden">통계</span>
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="h-11 min-w-0 gap-2 rounded-lg px-2 text-stone-600 data-[state=active]:bg-[#fffdf8] data-[state=active]:text-primary-800 data-[state=active]:ring-1 data-[state=active]:ring-paper-200"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">내 독후감</span>
              <span className="sm:hidden">독후감</span>
            </TabsTrigger>
            <TabsTrigger
              value="bookmarks"
              className="h-11 min-w-0 gap-2 rounded-lg px-2 text-stone-600 data-[state=active]:bg-[#fffdf8] data-[state=active]:text-primary-800 data-[state=active]:ring-1 data-[state=active]:ring-paper-200"
            >
              <Bookmark className="w-4 h-4" />
              <span>북마크</span>
            </TabsTrigger>
            <TabsTrigger
              value="account"
              className="h-11 min-w-0 gap-2 rounded-lg px-2 text-stone-600 data-[state=active]:bg-[#fffdf8] data-[state=active]:text-primary-800 data-[state=active]:ring-1 data-[state=active]:ring-paper-200"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">계정 관리</span>
              <span className="sm:hidden">계정</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="mt-0">
            <ReadingStatsSection />
          </TabsContent>

          <TabsContent value="reviews" className="mt-0">
            <MyReviewsSection />
          </TabsContent>

          <TabsContent value="bookmarks" className="mt-0">
            <BookmarksSection />
          </TabsContent>

          <TabsContent value="account" className="mt-0">
            <AccountPanel />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

export default DashboardPage;
