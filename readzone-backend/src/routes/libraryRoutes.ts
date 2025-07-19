import { Router } from 'express';
import { authenticateToken } from '@/middleware/auth';
import {
  getLibraryBooks,
  getLibraryBook,
  addOrUpdateLibraryBook,
  removeLibraryBook,
  getLibraryStats,
  updateReadingProgress,
} from '@/controllers/libraryController';

const router = Router();

// 모든 도서 서재 라우트는 인증 필요
router.use(authenticateToken);

// 서재 통계 조회
router.get('/stats', getLibraryStats);

// 서재 도서 목록 조회
router.get('/', getLibraryBooks);

// 특정 도서의 서재 정보 조회
router.get('/books/:bookId', getLibraryBook);

// 도서를 서재에 추가 또는 상태 업데이트
router.put('/books/:bookId', addOrUpdateLibraryBook);

// 서재에서 도서 제거
router.delete('/books/:bookId', removeLibraryBook);

// 읽기 진행률 업데이트
router.patch('/books/:bookId/progress', updateReadingProgress);

export default router;