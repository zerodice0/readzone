import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import bookRoutes from '../src/routes/bookRoutes';
import { errorHandler } from '../src/middleware/errorHandler';
import { 
  createTestBook,
  testBooks,
  expectErrorResponse, 
  expectSuccessResponse,
  cleanupTestData 
} from './helpers/testHelpers';

// Create test app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/books', bookRoutes);

// Error handling
app.use(errorHandler);

describe('Books Endpoints', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  describe('POST /api/books/search', () => {
    it('should search books successfully', async () => {
      const searchData = {
        query: '해리포터',
        page: 1,
        size: 10
      };

      const response = await request(app)
        .post('/api/books/search')
        .send(searchData);

      expectSuccessResponse(response);
      expect(response.body.data).toHaveProperty('books');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.books).toBeInstanceOf(Array);
    });

    it('should return 400 for missing query', async () => {
      const searchData = {
        page: 1,
        size: 10
        // Missing query
      };

      const response = await request(app)
        .post('/api/books/search')
        .send(searchData);

      expectErrorResponse(response, 400);
    });

    it('should return 400 for empty query', async () => {
      const searchData = {
        query: '',
        page: 1,
        size: 10
      };

      const response = await request(app)
        .post('/api/books/search')
        .send(searchData);

      expectErrorResponse(response, 400);
    });

    it('should handle invalid page numbers', async () => {
      const searchData = {
        query: '해리포터',
        page: -1,
        size: 10
      };

      const response = await request(app)
        .post('/api/books/search')
        .send(searchData);

      expectErrorResponse(response, 400);
    });

    it('should handle invalid size numbers', async () => {
      const searchData = {
        query: '해리포터',
        page: 1,
        size: 0
      };

      const response = await request(app)
        .post('/api/books/search')
        .send(searchData);

      expectErrorResponse(response, 400);
    });

    it('should limit maximum page size', async () => {
      const searchData = {
        query: '해리포터',
        page: 1,
        size: 100 // Too large
      };

      const response = await request(app)
        .post('/api/books/search')
        .send(searchData);

      expectErrorResponse(response, 400);
    });
  });

  describe('GET /api/books/:isbn', () => {
    let testBook: any;

    beforeEach(async () => {
      testBook = await createTestBook(testBooks.book1);
    });

    it('should get book by ISBN from database', async () => {
      const response = await request(app)
        .get(`/api/books/${testBook.isbn}`);

      expectSuccessResponse(response);
      expect(response.body.data.book.isbn).toBe(testBook.isbn);
      expect(response.body.data.book.title).toBe(testBook.title);
      expect(response.body.data.book.author).toBe(testBook.author);
    });

    it('should get book from external API if not in database', async () => {
      const isbn = '9788934942999'; // Non-existent in database
      
      const response = await request(app)
        .get(`/api/books/${isbn}`);

      // Should either return success from API or 404 if API doesn't have it
      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.data.book).toHaveProperty('isbn');
        expect(response.body.data.book).toHaveProperty('title');
        expect(response.body.data.book).toHaveProperty('author');
      }
    });

    it('should return 400 for invalid ISBN format', async () => {
      const response = await request(app)
        .get('/api/books/invalid-isbn');

      expectErrorResponse(response, 400, 'ISBN 형식이 올바르지 않습니다');
    });

    it('should return 404 for non-existent book', async () => {
      const isbn = '9999999999999'; // Invalid ISBN that won't be found
      
      const response = await request(app)
        .get(`/api/books/${isbn}`);

      expectErrorResponse(response, 404, '도서를 찾을 수 없습니다');
    });
  });

  describe('GET /api/books/:isbn/posts', () => {
    let testBook: any;

    beforeEach(async () => {
      testBook = await createTestBook(testBooks.book1);
    });

    it('should get posts for a book', async () => {
      const response = await request(app)
        .get(`/api/books/${testBook.isbn}/posts`)
        .query({ page: 1, limit: 10 });

      expectSuccessResponse(response);
      expect(response.body.data).toHaveProperty('posts');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.posts).toBeInstanceOf(Array);
    });

    it('should include user information in posts', async () => {
      const response = await request(app)
        .get(`/api/books/${testBook.isbn}/posts`);

      expectSuccessResponse(response);
      
      if (response.body.data.posts.length > 0) {
        const post = response.body.data.posts[0];
        expect(post).toHaveProperty('user');
        expect(post.user).toHaveProperty('username');
      }
    });

    it('should return 400 for invalid ISBN', async () => {
      const response = await request(app)
        .get('/api/books/invalid-isbn/posts');

      expectErrorResponse(response, 400, 'ISBN 형식이 올바르지 않습니다');
    });

    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get(`/api/books/${testBook.isbn}/posts`)
        .query({ page: 1, limit: 5 });

      expectSuccessResponse(response);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(5);
    });
  });

  describe('GET /api/books/popular', () => {
    it('should return popular books', async () => {
      const response = await request(app)
        .get('/api/books/popular')
        .query({ limit: 10 });

      expectSuccessResponse(response);
      expect(response.body.data.books).toBeInstanceOf(Array);
      expect(response.body.data.books.length).toBeLessThanOrEqual(10);
    });

    it('should include post count for popular books', async () => {
      const response = await request(app)
        .get('/api/books/popular');

      expectSuccessResponse(response);
      
      if (response.body.data.books.length > 0) {
        const book = response.body.data.books[0];
        expect(book).toHaveProperty('_count');
        expect(book._count).toHaveProperty('posts');
      }
    });

    it('should handle limit parameter', async () => {
      const response = await request(app)
        .get('/api/books/popular')
        .query({ limit: 5 });

      expectSuccessResponse(response);
      expect(response.body.data.books.length).toBeLessThanOrEqual(5);
    });

    it('should return 400 for invalid limit', async () => {
      const response = await request(app)
        .get('/api/books/popular')
        .query({ limit: -1 });

      expectErrorResponse(response, 400);
    });
  });
});