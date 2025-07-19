import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createRecommendation,
  getReceivedRecommendations,
  getSentRecommendations,
  markRecommendationAsRead,
  addRecommendationFeedback,
  getPersonalizedRecommendations
} from '../controllers/recommendationController';

const router = express.Router();

// 도서 추천하기 (인증 필요)
router.post('/', authenticateToken, createRecommendation);

// 받은 추천 목록 조회 (인증 필요)
router.get('/received', authenticateToken, getReceivedRecommendations);

// 보낸 추천 목록 조회 (인증 필요)
router.get('/sent', authenticateToken, getSentRecommendations);

// 개인화된 도서 추천 (인증 필요)
router.get('/personalized', authenticateToken, getPersonalizedRecommendations);

// 추천 읽음 처리 (인증 필요)
router.patch('/:id/read', authenticateToken, markRecommendationAsRead);

// 추천 피드백 작성 (인증 필요)
router.patch('/:id/feedback', authenticateToken, addRecommendationFeedback);

export default router;