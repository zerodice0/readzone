import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getGroups,
  getGroup,
  createGroup,
  joinGroup,
  leaveGroup
} from '../controllers/groupController';

const router = express.Router();

// 독서 그룹 목록 조회
router.get('/', getGroups);

// 독서 그룹 상세 조회
router.get('/:id', getGroup);

// 독서 그룹 생성 (인증 필요)
router.post('/', authenticateToken, createGroup);

// 독서 그룹 가입 (인증 필요)
router.post('/:id/join', authenticateToken, joinGroup);

// 독서 그룹 탈퇴 (인증 필요)
router.post('/:id/leave', authenticateToken, leaveGroup);

export default router;