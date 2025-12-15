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
        <span className="ml-2 text-stone-600">통계를 불러오는 중...</span>
      </div>
    );
  }

  const hasData = genreStats.totalReviews > 0;

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-900">
                  {summary?.totalReviews ?? 0}
                </p>
                <p className="text-sm text-stone-500">독후감</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-900">
                  {summary?.totalBooks ?? 0}
                </p>
                <p className="text-sm text-stone-500">읽은 책</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Heart className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-900">
                  {summary?.totalLikes ?? 0}
                </p>
                <p className="text-sm text-stone-500">받은 좋아요</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Bookmark className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-900">
                  {summary?.totalBookmarks ?? 0}
                </p>
                <p className="text-sm text-stone-500">받은 북마크</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 기간 필터 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">장르별 독서 현황</CardTitle>
            <PeriodFilter
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
            />
          </div>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <div className="text-center py-12 text-stone-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-stone-300" />
              <p className="text-lg font-medium">아직 독후감이 없습니다</p>
              <p className="text-sm mt-1">
                첫 번째 독후감을 작성하면 독서 통계를 확인할 수 있어요!
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {/* 레이더 차트 */}
              <div>
                <h3 className="text-sm font-medium text-stone-700 mb-3">
                  독서 프로필
                </h3>
                <div className="h-[300px]">
                  <GenreRadarChart data={genreStats.topGenres} />
                </div>
              </div>

              {/* 바 차트 */}
              <div>
                <h3 className="text-sm font-medium text-stone-700 mb-3">
                  장르별 상세 ({genreStats.allGenres.length}개 장르)
                </h3>
                <div className="h-[300px]">
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
