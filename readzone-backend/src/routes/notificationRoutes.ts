import { Router } from 'express';
import { authenticateToken } from '@/middleware/auth';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} from '@/controllers/notificationController';

const router = Router();

// 모든 알림 라우트는 인증 필요
router.use(authenticateToken);

// 알림 목록 조회
router.get('/', getNotifications);

// 읽지 않은 알림 개수 조회
router.get('/unread-count', getUnreadCount);

// 모든 알림 읽음 처리
router.patch('/mark-all-read', markAllAsRead);

// 특정 알림 읽음 처리
router.patch('/:notificationId/read', markAsRead);

// 알림 삭제
router.delete('/:notificationId', deleteNotification);

export default router;