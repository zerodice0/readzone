import { create } from 'zustand';
import statisticsService, { type ReadingStatistics, type ReadingTrends } from '../services/statisticsService';

interface StatisticsState {
  statistics: ReadingStatistics | null;
  trends: ReadingTrends | null;
  loading: boolean;
  error: string | null;
  selectedYear: number;
  selectedPeriod: '3months' | '6months' | '1year';
  
  // Actions
  fetchStatistics: (year?: number, type?: 'monthly' | 'yearly') => Promise<void>;
  fetchTrends: (period?: '3months' | '6months' | '1year') => Promise<void>;
  setSelectedYear: (year: number) => void;
  setSelectedPeriod: (period: '3months' | '6months' | '1year') => void;
  clearError: () => void;
}

export const useStatisticsStore = create<StatisticsState>((set, get) => ({
  statistics: null,
  trends: null,
  loading: false,
  error: null,
  selectedYear: new Date().getFullYear(),
  selectedPeriod: '6months',

  fetchStatistics: async (year?: number, type: 'monthly' | 'yearly' = 'monthly') => {
    set({ loading: true, error: null });
    
    try {
      const statistics = await statisticsService.getReadingStatistics(year, type);
      set({ statistics, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error?.message || '통계 데이터를 불러오는 중 오류가 발생했습니다.',
        loading: false 
      });
    }
  },

  fetchTrends: async (period: '3months' | '6months' | '1year' = '6months') => {
    set({ loading: true, error: null });
    
    try {
      const trends = await statisticsService.getReadingTrends(period);
      set({ trends, loading: false, selectedPeriod: period });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error?.message || '트렌드 데이터를 불러오는 중 오류가 발생했습니다.',
        loading: false 
      });
    }
  },

  setSelectedYear: (year: number) => {
    set({ selectedYear: year });
    get().fetchStatistics(year);
  },

  setSelectedPeriod: (period: '3months' | '6months' | '1year') => {
    set({ selectedPeriod: period });
    get().fetchTrends(period);
  },

  clearError: () => set({ error: null })
}));