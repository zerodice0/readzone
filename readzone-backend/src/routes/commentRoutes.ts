import { Router } from 'express';
import { 
  getComments, 
  createComment, 
  updateComment, 
  deleteComment 
} from '../controllers/commentController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 댓글 목록 조회 (공개)
router.get('/posts/:postId/comments', getComments);

// 댓글 작성 (인증 필요)
router.post('/posts/:postId/comments', authenticateToken, createComment);

// 댓글 수정 (인증 필요)
router.put('/comments/:id', authenticateToken, updateComment);

// 댓글 삭제 (인증 필요)
router.delete('/comments/:id', authenticateToken, deleteComment);

export default router;