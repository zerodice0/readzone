import { Router } from 'express';
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
} from '@/controllers/postController';
import { authenticateToken, optionalAuth } from '@/middleware/auth';

const router = Router();

// 공개 라우트 (인증 선택사항)
router.get('/', optionalAuth, getPosts);
router.get('/:id', optionalAuth, getPostById);

// 인증 필요 라우트
router.post('/', authenticateToken, createPost);
router.put('/:id', authenticateToken, updatePost);
router.delete('/:id', authenticateToken, deletePost);
router.post('/:id/like', authenticateToken, likePost);
router.delete('/:id/like', authenticateToken, unlikePost);

export default router;