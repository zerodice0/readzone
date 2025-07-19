import api from './api';

// 타입 정의
export interface ReadingGoal {
  id: string;
  userId: string;
  year: number;
  booksTarget: number;
  pagesTarget: number;
  booksRead: number;
  pagesRead: number;
  progress: {
    booksProgress: number;
    pagesProgress: number;
    overallProgress: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ReadingGoalInput {
  booksTarget?: number;
  pagesTarget?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ReadingGoalResponse {
  success: boolean;
  data: ReadingGoal;
  message?: string;
}

export interface ReadingGoalsResponse {
  success: boolean;
  data: PaginatedResponse<ReadingGoal>;
}

export interface DeleteGoalResponse {
  success: boolean;
  message: string;
}

// 독서 목표 서비스
export const readingGoalService = {
  // 특정 연도 독서 목표 조회
  getReadingGoal: async (year: number): Promise<ReadingGoal> => {
    const response = await api.get<ReadingGoalResponse>(`/reading-goals/${year}`);
    return response.data.data;
  },

  // 독서 목표 설정/업데이트
  setReadingGoal: async (year: number, goal: ReadingGoalInput): Promise<ReadingGoal> => {
    const response = await api.post<ReadingGoalResponse>(`/reading-goals/${year}`, goal);
    return response.data.data;
  },

  // 모든 독서 목표 조회
  getReadingGoals: async (options: { page?: number; limit?: number } = {}): Promise<PaginatedResponse<ReadingGoal>> => {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await api.get<ReadingGoalsResponse>(`/reading-goals?${params}`);
    return response.data.data;
  },

  // 독서 목표 삭제
  deleteReadingGoal: async (year: number): Promise<void> => {
    await api.delete<DeleteGoalResponse>(`/reading-goals/${year}`);
  }
};

export default readingGoalService;