import { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Loader2, BookOpen, Heart, Bookmark, TrendingUp } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { PeriodFilter, type PeriodOption } from './PeriodFilter';
import { GenreRadarChart } from './GenreRadarChart';
import { GenreBarChart } from './GenreBarChart';

/**
 * 기간 옵션별 시작 날짜 계산
 */
function getStartDate(period: PeriodOption): number | undefined {
  if (period === 'all') return undefined;

  const now = new Date();
  const startDate = new Date();

  switch (period) {
    case '1m':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case '3m':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case '6m':
      startDate.setMonth(now.getMonth() - 6);
      break;
    case '1y':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  return startDate.getTime();
}

export function ReadingStatsSection() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('all');

  const startDate = useMemo(
    () => getStartDate(selectedPeriod),
    [selectedPeriod]
  );

  // 장르 통계 쿼리
  const genreStats = useQuery(api.stats.getGenreStats, {
    startDate,
    endDate: undefined,
  });

  // 전체 요약 통계
  const summary = useQuery(api.stats.getSummary);

  const isLoading = genreStats === undefined || summary === undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        <span className="ml-2 text-stone-600">통계를 불러오는 중…</span>
      </div>
    );
  }

  const hasData = genreStats.totalReviews > 0;

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Card className="paper-panel rounded-xl border-paper-200/80 shadow-sm hover:shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50">
                <BookOpen className="h-5 w-5 text-violet-600" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold tracking-tight text-stone-950 tabular-nums">
                  {summary?.totalReviews ?? 0}
                </p>
                <p className="text-sm font-medium text-stone-500">
                  작성한 독후감
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="paper-panel rounded-xl border-paper-200/80 shadow-sm hover:shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold tracking-tight text-stone-950 tabular-nums">
                  {summary?.totalBooks ?? 0}
                </p>
                <p className="text-sm font-medium text-stone-500">읽은 책</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="paper-panel rounded-xl border-paper-200/80 shadow-sm hover:shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50">
                <Heart className="h-5 w-5 text-rose-600" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold tracking-tight text-stone-950 tabular-nums">
                  {summary?.totalLikes ?? 0}
                </p>
                <p className="text-sm font-medium text-stone-500">
                  받은 좋아요
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="paper-panel rounded-xl border-paper-200/80 shadow-sm hover:shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                <Bookmark className="h-5 w-5 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold tracking-tight text-stone-950 tabular-nums">
                  {summary?.totalBookmarks ?? 0}
                </p>
                <p className="text-sm font-medium text-stone-500">
                  받은 북마크
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 기간 필터 */}
      <Card className="paper-surface rounded-xl border-paper-200/80 shadow-sm hover:shadow-sm">
        <CardHeader className="border-b border-paper-200/70 pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg font-semibold text-stone-950">
              장르별 독서 현황
            </CardTitle>
            <PeriodFilter
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
            />
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          {!hasData ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-paper-50">
                <BookOpen className="w-8 h-8 text-stone-300" />
              </div>
              <h3 className="text-lg font-semibold text-stone-900 mb-1">
                아직 데이터가 충분하지 않아요
              </h3>
              <p className="text-stone-500 max-w-sm mx-auto">
                첫 번째 독후감을 작성하고 나만의 독서 취향을 분석해보세요.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {/* 레이더 차트 */}
              <div className="rounded-xl bg-[#fffdf8]/65 p-4">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-stone-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                  독서 프로필
                </h3>
                <div className="h-[260px] sm:h-[320px]">
                  <GenreRadarChart data={genreStats.topGenres} />
                </div>
              </div>

              {/* 바 차트 */}
              <div className="rounded-xl bg-[#fffdf8]/65 p-4">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-stone-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                  장르별 상세{' '}
                  <span className="text-stone-400 font-normal">
                    ({genreStats.allGenres.length}개)
                  </span>
                </h3>
                <div className="h-[260px] sm:h-[320px]">
                  <GenreBarChart data={genreStats.allGenres} />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
