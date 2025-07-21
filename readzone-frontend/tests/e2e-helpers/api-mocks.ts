import { Page } from '@playwright/test';

export class APIMocks {
  constructor(private page: Page) {}

  async mockBookSearch(books = [
    {
      id: 'book-1',
      isbn: '9788934942467',
      title: '테스트 도서',
      author: '테스트 작가',
      publisher: '테스트 출판사',
      publishedDate: '2024-01-01',
      description: '테스트용 도서 설명',
      thumbnail: 'https://example.com/book.jpg',
      pageCount: 300
    }
  ]) {
    await this.page.route('**/api/books/search**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { books }
        })
      });
    });
  }

  async mockEmptyBookSearch() {
    await this.page.route('**/api/books/search**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { books: [] }
        })
      });
    });
  }

  async mockPosts(posts = [
    {
      id: 'post-1',
      content: '테스트 독서 기록',
      rating: 5,
      tags: ['테스트', '소설'],
      isPublic: true,
      readingProgress: 100,
      createdAt: '2024-01-01T00:00:00Z',
      user: {
        id: 'user-1',
        username: 'testuser',
        displayName: 'Test User',
        avatar: null
      },
      book: {
        id: 'book-1',
        title: '테스트 도서',
        author: '테스트 작가',
        thumbnail: 'https://example.com/book.jpg'
      },
      _count: {
        comments: 3,
        likes: 15
      }
    }
  ]) {
    await this.page.route('**/api/posts**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              items: posts,
              pagination: {
                page: 1,
                limit: 20,
                total: posts.length,
                totalPages: 1,
                hasNext: false,
                hasPrev: false
              }
            }
          })
        });
      }
    });
  }

  async mockPostCreation(postData = {
    id: 'post-1',
    content: '테스트 독서 기록',
    rating: 5,
    isPublic: true,
    createdAt: new Date().toISOString()
  }) {
    await this.page.route('**/api/posts', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: postData
          })
        });
      }
    });
  }

  async mockPostCreationError(errorMessage = '서버 오류가 발생했습니다.') {
    await this.page.route('**/api/posts', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              message: errorMessage
            }
          })
        });
      }
    });
  }

  async mockComments(comments = [
    {
      id: 'comment-1',
      content: '좋은 책이네요!',
      createdAt: '2024-01-01T00:00:00Z',
      user: {
        id: 'user-2',
        username: 'commenter',
        displayName: 'Commenter User',
        avatar: null
      }
    }
  ]) {
    await this.page.route('**/api/posts/*/comments**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            items: comments,
            pagination: {
              page: 1,
              limit: 20,
              total: comments.length,
              totalPages: 1
            }
          }
        })
      });
    });
  }

  async mockUserProfile(userData = {
    id: 'user-1',
    username: 'testuser',
    displayName: 'Test User',
    email: 'test@example.com',
    avatar: null,
    bio: 'Test user bio',
    isPublic: true,
    createdAt: '2024-01-01T00:00:00Z',
    _count: {
      posts: 5,
      followers: 10,
      following: 8
    }
  }) {
    await this.page.route('**/api/users/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: userData
        })
      });
    });
  }

  async mockFollowUser() {
    await this.page.route('**/api/users/*/follow', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              isFollowing: true
            }
          })
        });
      }
    });
  }

  async mockUnfollowUser() {
    await this.page.route('**/api/users/*/follow', (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              isFollowing: false
            }
          })
        });
      }
    });
  }

  async mockLikePost() {
    await this.page.route('**/api/posts/*/like', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              isLiked: true,
              likesCount: 16
            }
          })
        });
      }
    });
  }

  async mockUnlikePost() {
    await this.page.route('**/api/posts/*/like', (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              isLiked: false,
              likesCount: 14
            }
          })
        });
      }
    });
  }

  async mockStatistics(stats = {
    totalBooks: 25,
    totalPages: 7500,
    averageRating: 4.2,
    readingStreak: 7,
    monthlyGoal: 10,
    monthlyProgress: 6,
    yearlyGoal: 50,
    yearlyProgress: 25,
    recentBooks: [],
    favoriteGenres: [
      { genre: '소설', count: 10 },
      { genre: '에세이', count: 8 },
      { genre: '자기계발', count: 7 }
    ]
  }) {
    await this.page.route('**/api/users/*/statistics', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: stats
        })
      });
    });
  }

  async mockNetworkError() {
    await this.page.route('**/api/**', (route) => {
      route.abort('failed');
    });
  }

  async mockSlowResponse(delay = 2000) {
    await this.page.route('**/api/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, delay));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {}
        })
      });
    });
  }
}