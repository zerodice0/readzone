import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import bookRoutes from './bookRoutes';
import postRoutes from './postRoutes';
import commentRoutes from './commentRoutes';
import readingGoalRoutes from './readingGoalRoutes';
import searchRoutes from './searchRoutes';
import notificationRoutes from './notificationRoutes';
import libraryRoutes from './libraryRoutes';
import statisticsRoutes from './statisticsRoutes';
import groupRoutes from './groupRoutes';
import recommendationRoutes from './recommendationRoutes';

const router = Router();

// API 라우트 등록
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/books', bookRoutes);
router.use('/posts', postRoutes);
router.use('/reading-goals', readingGoalRoutes);
router.use('/search', searchRoutes);
router.use('/notifications', notificationRoutes);
router.use('/library', libraryRoutes);
router.use('/statistics', statisticsRoutes);
router.use('/groups', groupRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/', commentRoutes);

export default router;