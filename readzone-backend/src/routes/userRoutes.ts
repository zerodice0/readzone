import { Router } from 'express';
import {
  getUserProfile,
  getUserPosts,
  searchUsers,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
} from '@/controllers/userController';
import { authenticateToken, optionalAuth } from '@/middleware/auth';

const router = Router();

// 공개 라우트
router.get('/search', searchUsers);
router.get('/:userId', optionalAuth, getUserProfile);
router.get('/:userId/posts', optionalAuth, getUserPosts);
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);

// 보호된 라우트 (인증 필요)
router.post('/:userId/follow', authenticateToken, followUser);
router.delete('/:userId/follow', authenticateToken, unfollowUser);

export default router;