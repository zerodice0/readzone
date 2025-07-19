import api from './api';

export interface ReadingStatistics {
  summary: {
    totalBooks: number;
    completedBooks: number;
    currentlyReading: number;
    wantToRead: number;
  };
  monthlyStats: {
    month: number;
    monthName: string;
    count: number;
    books: {
      title: string;
      authors: string[];
      thumbnail: string | null;
      finishedAt: string;
    }[];
  }[];
  yearlyStats?: Record<number, number>;
  goalProgress: {
    target: number;
    completed: number;
    percentage: number;
  } | null;
  year: number;
  type: 'monthly' | 'yearly';
}

export interface ReadingTrends {
  trends: {
    period: string;
    count: number;
    books: any[];
  }[];
  speedAnalysis: {
    averagePagesPerDay: number;
    books: {
      title: string;
      totalPages: number;
      days: number;
      pagesPerDay: number;
    }[];
  };
  period: string;
  totalCompleted: number;
}

class StatisticsService {
  async getReadingStatistics(year?: number, type: 'monthly' | 'yearly' = 'monthly'): Promise<ReadingStatistics> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    params.append('type', type);
    
    const response = await api.get(`/statistics/reading?${params.toString()}`);
    return response.data.data;
  }

  async getReadingTrends(period: '3months' | '6months' | '1year' = '6months'): Promise<ReadingTrends> {
    const response = await api.get(`/statistics/trends?period=${period}`);
    return response.data.data;
  }
}

export default new StatisticsService();