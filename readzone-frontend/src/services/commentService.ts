import api from './api';

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  parentId: string | null;
  content: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
  };
  replies: Comment[];
}

export interface CreateCommentData {
  content: string;
  parentId?: string;
}

export interface UpdateCommentData {
  content: string;
}

export interface CommentsResponse {
  comments: Comment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const commentService = {
  // 댓글 목록 조회
  getComments: async (postId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<CommentsResponse> => {
    const response = await api.get(`/posts/${postId}/comments`, { params });
    return response.data;
  },

  // 댓글 작성
  createComment: async (postId: string, data: CreateCommentData): Promise<Comment> => {
    const response = await api.post(`/posts/${postId}/comments`, data);
    return response.data;
  },

  // 댓글 수정
  updateComment: async (commentId: string, data: UpdateCommentData): Promise<Comment> => {
    const response = await api.put(`/comments/${commentId}`, data);
    return response.data;
  },

  // 댓글 삭제
  deleteComment: async (commentId: string): Promise<void> => {
    await api.delete(`/comments/${commentId}`);
  },
};