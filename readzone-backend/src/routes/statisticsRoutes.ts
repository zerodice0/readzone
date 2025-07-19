import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getReadingStatistics, getReadingTrends } from '../controllers/statisticsController';

const router = express.Router();

// 독서 통계 조회
router.get('/reading', authenticateToken, getReadingStatistics);

// 독서 트렌드 분석
router.get('/trends', authenticateToken, getReadingTrends);

export default router;