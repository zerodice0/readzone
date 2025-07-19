import React, { useEffect, useState } from 'react';
import { useStatisticsStore } from '../stores/statisticsStore';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import { BarChart, TrendingUp, Calendar, Target, BookOpen, Clock } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const StatisticsPage: React.FC = () => {
  const {
    statistics,
    trends,
    loading,
    error,
    selectedYear,
    selectedPeriod,
    fetchStatistics,
    fetchTrends,
    setSelectedYear,
    setSelectedPeriod,
    clearError
  } = useStatisticsStore();

  const [viewType, setViewType] = useState<'monthly' | 'yearly'>('monthly');
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchStatistics(selectedYear, viewType);
    fetchTrends(selectedPeriod);
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    fetchStatistics(year, viewType);
  };

  const handleViewTypeChange = (type: 'monthly' | 'yearly') => {
    setViewType(type);
    fetchStatistics(selectedYear, type);
  };

  const handlePeriodChange = (period: '3months' | '6months' | '1year') => {
    setSelectedPeriod(period);
    fetchTrends(period);
  };

  // 월별 차트 데이터
  const monthlyChartData = statistics?.monthlyStats ? {
    labels: statistics.monthlyStats.map(stat => stat.monthName),
    datasets: [
      {
        label: '완독한 책 수',
        data: statistics.monthlyStats.map(stat => stat.count),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  } : null;

  // 연도별 차트 데이터
  const yearlyChartData = statistics?.yearlyStats ? {
    labels: Object.keys(statistics.yearlyStats).sort(),
    datasets: [
      {
        label: '완독한 책 수',
        data: Object.keys(statistics.yearlyStats)
          .sort()
          .map(year => statistics.yearlyStats![parseInt(year)]),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  } : null;

  // 트렌드 차트 데이터
  const trendChartData = trends ? {
    labels: trends.trends.map(trend => trend.period),
    datasets: [
      {
        label: '완독한 책 수',
        data: trends.trends.map(trend => trend.count),
        borderColor: 'rgba(139, 69, 19, 1)',
        backgroundColor: 'rgba(139, 69, 19, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  } : null;

  // 도서 상태 분포 차트 데이터
  const statusChartData = statistics?.summary ? {
    labels: ['완독', '읽는 중', '읽고 싶은'],
    datasets: [
      {
        data: [
          statistics.summary.completedBooks,
          statistics.summary.currentlyReading,
          statistics.summary.wantToRead
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(249, 115, 22, 0.8)'
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(249, 115, 22, 1)'
        ],
        borderWidth: 2,
      }
    ]
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  if (loading && !statistics) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">독서 통계</h1>
          <p className="text-gray-600 mt-1">나의 독서 기록을 분석해보세요</p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={selectedYear}
            onChange={(e) => handleYearChange(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {Array.from({ length: 5 }, (_, i) => currentYear - i).map(year => (
              <option key={year} value={year}>{year}년</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* 요약 통계 */}
      {statistics?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">전체 도서</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.summary.totalBooks}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">완독한 책</p>
                <p className="text-2xl font-bold text-green-600">{statistics.summary.completedBooks}</p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">읽는 중</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.summary.currentlyReading}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">읽고 싶은</p>
                <p className="text-2xl font-bold text-orange-600">{statistics.summary.wantToRead}</p>
              </div>
              <Calendar className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      {/* 독서 목표 진행률 */}
      {statistics?.goalProgress && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedYear}년 독서 목표
            </h2>
            <span className="text-sm text-gray-600">
              {statistics.goalProgress.completed}/{statistics.goalProgress.target}권
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
            <div
              className="bg-green-500 h-4 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(statistics.goalProgress.percentage, 100)}%` }}
            />
          </div>
          
          <p className="text-sm text-gray-600">
            {statistics.goalProgress.percentage}% 달성
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 월별/연도별 독서 현황 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart className="w-5 h-5" />
              독서 현황
            </h2>
            <div className="flex gap-2">
              <Button
                variant={viewType === 'monthly' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleViewTypeChange('monthly')}
              >
                월별
              </Button>
              <Button
                variant={viewType === 'yearly' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleViewTypeChange('yearly')}
              >
                연도별
              </Button>
            </div>
          </div>
          
          {viewType === 'monthly' && monthlyChartData && (
            <Bar data={monthlyChartData} options={chartOptions} />
          )}
          
          {viewType === 'yearly' && yearlyChartData && (
            <Bar data={yearlyChartData} options={chartOptions} />
          )}
        </div>

        {/* 도서 상태 분포 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">도서 상태 분포</h2>
          {statusChartData && (
            <div className="flex justify-center">
              <div className="w-64 h-64">
                <Doughnut 
                  data={statusChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 독서 트렌드 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            독서 트렌드
          </h2>
          <div className="flex gap-2">
            <Button
              variant={selectedPeriod === '3months' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange('3months')}
            >
              3개월
            </Button>
            <Button
              variant={selectedPeriod === '6months' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange('6months')}
            >
              6개월
            </Button>
            <Button
              variant={selectedPeriod === '1year' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange('1year')}
            >
              1년
            </Button>
          </div>
        </div>
        
        {trendChartData && (
          <Line data={trendChartData} options={chartOptions} />
        )}
      </div>

      {/* 읽기 속도 분석 */}
      {trends?.speedAnalysis && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">읽기 속도 분석</h2>
          
          <div className="mb-4">
            <p className="text-2xl font-bold text-blue-600">
              {trends.speedAnalysis.averagePagesPerDay}
              <span className="text-sm text-gray-600 ml-1">페이지/일</span>
            </p>
            <p className="text-sm text-gray-600">평균 읽기 속도</p>
          </div>
          
          {trends.speedAnalysis.books.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">최근 완독 도서</h3>
              {trends.speedAnalysis.books.slice(0, 5).map((book, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-sm text-gray-900 truncate">{book.title}</span>
                  <span className="text-sm text-gray-600">
                    {book.pagesPerDay}페이지/일
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StatisticsPage;