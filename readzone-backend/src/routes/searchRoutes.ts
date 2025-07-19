import { Router } from 'express';
import {
  searchAll,
  getPostsByTag,
  getPopularTags
} from '@/controllers/searchController';
import { optionalAuth } from '@/middleware/auth';

const router = Router();

// 모든 검색 라우트에 옵셔널 인증 적용
router.use(optionalAuth);

// 검색 라우트
router.get('/', searchAll);                    // 통합 검색
router.get('/tags', getPopularTags);           // 인기 태그 조회
router.get('/tags/:tag', getPostsByTag);       // 태그별 게시글 조회

export default router;