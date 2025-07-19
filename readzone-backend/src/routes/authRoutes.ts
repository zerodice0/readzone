import { Router } from 'express';
import {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
} from '@/controllers/authController';
import { authenticateToken } from '@/middleware/auth';

const router = Router();

// 공개 라우트 (인증 불필요)
router.post('/register', register);
router.post('/login', login);

// 보호된 라우트 (인증 필요)
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.post('/change-password', authenticateToken, changePassword);

export default router;