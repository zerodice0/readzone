import { Router } from 'express';
import {
  searchBooks,
  getBookById,
  getBookByIsbn,
  getBookPosts,
  saveBook,
  getPopularBooks,
} from '@/controllers/bookController';
import { authenticateToken, optionalAuth } from '@/middleware/auth';

const router = Router();

// 공개 라우트
router.get('/search', searchBooks);
router.get('/popular', getPopularBooks);
router.get('/isbn/:isbn', optionalAuth, getBookByIsbn);
router.get('/isbn/:isbn/posts', optionalAuth, getBookPosts);
router.get('/:id', getBookById);

// 인증 필요 라우트
router.post('/', authenticateToken, saveBook);

export default router;