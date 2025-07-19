import { Router } from 'express';
import {
  getReadingGoal,
  setReadingGoal,
  getReadingGoals,
  deleteReadingGoal
} from '@/controllers/readingGoalController';
import { authenticateToken } from '@/middleware/auth';

const router = Router();

// 모든 라우트는 인증 필요
router.use(authenticateToken);

// 독서 목표 관련 라우트
router.get('/', getReadingGoals);           // 모든 독서 목표 조회
router.get('/:year', getReadingGoal);       // 특정 연도 독서 목표 조회
router.post('/:year', setReadingGoal);      // 독서 목표 설정/업데이트
router.delete('/:year', deleteReadingGoal); // 독서 목표 삭제

export default router;