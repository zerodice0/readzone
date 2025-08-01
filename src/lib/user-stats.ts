import { prisma } from '@/lib/db'

// 사용자 활동 통계 타입 정의
export interface UserActivityStats {
  // 기본 통계
  reviewCount: number          // 작성한 독후감 수
  opinionCount: number         // 작성한 도서 의견 수
  commentCount: number         // 작성한 댓글 수
  receivedLikesCount: number   // 받은 좋아요 수
  givenLikesCount: number      // 준 좋아요 수
  readBooksCount: number       // 읽은 책 수 (독후감 + 의견 기준)
  
  // 상세 통계
  recentActivity: {
    lastReviewDate: Date | null
    lastOpinionDate: Date | null
    lastCommentDate: Date | null
  }
  
  // 추천/비추천 비율
  recommendations: {
    recommendedCount: number
    notRecommendedCount: number
    recommendationRatio: number // 추천 비율 (0-1)
  }
  
  // 장르별 통계
  genreStats: Array<{
    genre: string
    count: number
    percentage: number
  }>
  
  // 월별 활동 통계 (최근 12개월)
  monthlyActivity: Array<{
    month: string // YYYY-MM 형식
    reviewCount: number
    opinionCount: number
    commentCount: number
  }>
}

// 사용자 프로필 정보
export interface UserProfile {
  id: string
  nickname: string
  email: string
  bio: string | null
  image: string | null
  createdAt: Date
  emailVerified: Date | null
  stats: UserActivityStats
}

/**
 * 사용자 활동 통계 계산
 */
export async function calculateUserStats(userId: string): Promise<UserActivityStats> {
  try {
    // 병렬로 모든 통계 데이터 조회
    const [
      reviewStats,
      opinionStats,
      commentStats,
      receivedLikes,
      givenLikes,
      readBooks,
      recentActivity,
      recommendations
    ] = await Promise.all([
      // 독후감 통계
      prisma.bookReview.aggregate({
        where: { userId },
        _count: { id: true }
      }),
      
      // 도서 의견 통계
      prisma.bookOpinion.aggregate({
        where: { userId },
        _count: { id: true }
      }),
      
      // 댓글 통계
      prisma.comment.aggregate({
        where: { userId, isDeleted: false },
        _count: { id: true }
      }),
      
      // 받은 좋아요 수 (독후감 + 댓글)
      Promise.all([
        prisma.reviewLike.count({
          where: {
            review: { userId }
          }
        }),
        prisma.commentLike.count({
          where: {
            comment: { userId }
          }
        })
      ]),
      
      // 준 좋아요 수
      Promise.all([
        prisma.reviewLike.count({ where: { userId } }),
        prisma.commentLike.count({ where: { userId } })
      ]),
      
      // 읽은 책 수 (중복 제거)
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(DISTINCT bookId) as count
        FROM (
          SELECT bookId FROM BookReview WHERE userId = ${userId}
          UNION
          SELECT bookId FROM BookOpinion WHERE userId = ${userId}
        ) as combined_books
      `,
      
      // 최근 활동 날짜
      Promise.all([
        prisma.bookReview.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true }
        }),
        prisma.bookOpinion.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true }
        }),
        prisma.comment.findFirst({
          where: { userId, isDeleted: false },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true }
        })
      ]),
      
      // 추천/비추천 통계
      Promise.all([
        prisma.bookReview.count({
          where: { userId, isRecommended: true }
        }),
        prisma.bookReview.count({
          where: { userId, isRecommended: false }
        }),
        prisma.bookOpinion.count({
          where: { userId, isRecommended: true }
        }),
        prisma.bookOpinion.count({
          where: { userId, isRecommended: false }
        })
      ])
    ])

    // 받은 좋아요 수 합계
    const totalReceivedLikes = receivedLikes[0] + receivedLikes[1]
    
    // 준 좋아요 수 합계
    const totalGivenLikes = givenLikes[0] + givenLikes[1]
    
    // 읽은 책 수
    const totalReadBooks = Number(readBooks[0].count)
    
    // 추천 통계 계산
    const reviewRecommended = recommendations[0]
    const reviewNotRecommended = recommendations[1]
    const opinionRecommended = recommendations[2]
    const opinionNotRecommended = recommendations[3]
    
    const totalRecommended = reviewRecommended + opinionRecommended
    const totalNotRecommended = reviewNotRecommended + opinionNotRecommended
    const totalRecommendations = totalRecommended + totalNotRecommended
    
    // 장르별 통계 조회
    const genreStats = await getGenreStats(userId)
    
    // 월별 활동 통계 조회
    const monthlyActivity = await getMonthlyActivity(userId)

    return {
      reviewCount: reviewStats._count.id,
      opinionCount: opinionStats._count.id,
      commentCount: commentStats._count.id,
      receivedLikesCount: totalReceivedLikes,
      givenLikesCount: totalGivenLikes,
      readBooksCount: totalReadBooks,
      
      recentActivity: {
        lastReviewDate: recentActivity[0]?.createdAt || null,
        lastOpinionDate: recentActivity[1]?.createdAt || null,
        lastCommentDate: recentActivity[2]?.createdAt || null
      },
      
      recommendations: {
        recommendedCount: totalRecommended,
        notRecommendedCount: totalNotRecommended,
        recommendationRatio: totalRecommendations > 0 ? totalRecommended / totalRecommendations : 0
      },
      
      genreStats,
      monthlyActivity
    }
    
  } catch (error) {
    console.error('Error calculating user stats:', error)
    throw new Error('사용자 통계 계산 중 오류가 발생했습니다.')
  }
}

/**
 * 장르별 통계 조회
 */
async function getGenreStats(userId: string): Promise<Array<{ genre: string; count: number; percentage: number }>> {
  try {
    const genreData = await prisma.$queryRaw<Array<{ genre: string; count: bigint }>>`
      SELECT 
        COALESCE(b.genre, '기타') as genre,
        COUNT(*) as count
      FROM (
        SELECT bookId FROM BookReview WHERE userId = ${userId}
        UNION ALL
        SELECT bookId FROM BookOpinion WHERE userId = ${userId}
      ) as user_books
      JOIN Book b ON b.id = user_books.bookId
      WHERE b.genre IS NOT NULL
      GROUP BY b.genre
      ORDER BY count DESC
      LIMIT 10
    `

    const totalCount = genreData.reduce((sum: number, item: typeof genreData[0]) => sum + Number(item.count), 0)
    
    return genreData.map((item: typeof genreData[0]) => ({
      genre: item.genre,
      count: Number(item.count),
      percentage: totalCount > 0 ? Number(item.count) / totalCount : 0
    }))
    
  } catch (error) {
    console.error('Error getting genre stats:', error)
    return []
  }
}

/**
 * 월별 활동 통계 조회 (최근 12개월)
 */
async function getMonthlyActivity(userId: string): Promise<Array<{
  month: string
  reviewCount: number
  opinionCount: number
  commentCount: number
}>> {
  try {
    const monthsAgo = new Date()
    monthsAgo.setMonth(monthsAgo.getMonth() - 12)
    
    const monthlyData = await prisma.$queryRaw<Array<{
      month: string
      reviewCount: bigint
      opinionCount: bigint
      commentCount: bigint
    }>>`
      WITH months AS (
        SELECT DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL n.n MONTH), '%Y-%m') as month
        FROM (
          SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 
          UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 
          UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11
        ) n
      ),
      review_counts AS (
        SELECT 
          DATE_FORMAT(createdAt, '%Y-%m') as month,
          COUNT(*) as reviewCount
        FROM BookReview 
        WHERE userId = ${userId} AND createdAt >= ${monthsAgo}
        GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
      ),
      opinion_counts AS (
        SELECT 
          DATE_FORMAT(createdAt, '%Y-%m') as month,
          COUNT(*) as opinionCount
        FROM BookOpinion 
        WHERE userId = ${userId} AND createdAt >= ${monthsAgo}
        GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
      ),
      comment_counts AS (
        SELECT 
          DATE_FORMAT(createdAt, '%Y-%m') as month,
          COUNT(*) as commentCount
        FROM Comment 
        WHERE userId = ${userId} AND isDeleted = 0 AND createdAt >= ${monthsAgo}
        GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
      )
      SELECT 
        m.month,
        COALESCE(r.reviewCount, 0) as reviewCount,
        COALESCE(o.opinionCount, 0) as opinionCount,
        COALESCE(c.commentCount, 0) as commentCount
      FROM months m
      LEFT JOIN review_counts r ON m.month = r.month
      LEFT JOIN opinion_counts o ON m.month = o.month
      LEFT JOIN comment_counts c ON m.month = c.month
      ORDER BY m.month DESC
    `

    return monthlyData.map((item: typeof monthlyData[0]) => ({
      month: item.month,
      reviewCount: Number(item.reviewCount),
      opinionCount: Number(item.opinionCount),
      commentCount: Number(item.commentCount)
    }))
    
  } catch (error) {
    console.error('Error getting monthly activity:', error)
    // SQLite 대체 쿼리 (MySQL 함수가 지원되지 않는 경우)
    return []
  }
}

/**
 * 사용자 프로필 정보와 통계 조회
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        email: true,
        bio: true,
        image: true,
        createdAt: true,
        emailVerified: true
      }
    })

    if (!user) {
      return null
    }

    const stats = await calculateUserStats(userId)

    return {
      ...user,
      stats
    }
    
  } catch (error) {
    console.error('Error getting user profile:', error)
    throw new Error('사용자 프로필 조회 중 오류가 발생했습니다.')
  }
}

/**
 * 사용자 랭킹 조회 (선택적 기능)
 */
export async function getUserRanking(userId: string): Promise<{
  reviewRank: number
  likeRank: number
  totalUsers: number
}> {
  try {
    const [reviewRank, likeRank, totalUsers] = await Promise.all([
      // 독후감 수 기준 랭킹
      prisma.$queryRaw<[{ rank: bigint }]>`
        SELECT COUNT(*) + 1 as rank
        FROM (
          SELECT userId, COUNT(*) as reviewCount
          FROM BookReview
          GROUP BY userId
          HAVING reviewCount > (
            SELECT COUNT(*) FROM BookReview WHERE userId = ${userId}
          )
        ) as higher_users
      `,
      
      // 받은 좋아요 수 기준 랭킹
      prisma.$queryRaw<[{ rank: bigint }]>`
        SELECT COUNT(*) + 1 as rank
        FROM (
          SELECT u.id, 
                 COALESCE(rl.likeCount, 0) + COALESCE(cl.likeCount, 0) as totalLikes
          FROM User u
          LEFT JOIN (
            SELECT r.userId, COUNT(*) as likeCount
            FROM ReviewLike rl
            JOIN BookReview r ON rl.reviewId = r.id
            GROUP BY r.userId
          ) rl ON u.id = rl.userId
          LEFT JOIN (
            SELECT c.userId, COUNT(*) as likeCount
            FROM CommentLike cl
            JOIN Comment c ON cl.commentId = c.id
            GROUP BY c.userId
          ) cl ON u.id = cl.userId
          HAVING totalLikes > (
            SELECT COALESCE(rl2.likeCount, 0) + COALESCE(cl2.likeCount, 0)
            FROM User u2
            LEFT JOIN (
              SELECT r.userId, COUNT(*) as likeCount
              FROM ReviewLike rl
              JOIN BookReview r ON rl.reviewId = r.id
              WHERE r.userId = ${userId}
              GROUP BY r.userId
            ) rl2 ON u2.id = rl2.userId
            LEFT JOIN (
              SELECT c.userId, COUNT(*) as likeCount
              FROM CommentLike cl
              JOIN Comment c ON cl.commentId = c.id
              WHERE c.userId = ${userId}
              GROUP BY c.userId
            ) cl2 ON u2.id = cl2.userId
            WHERE u2.id = ${userId}
          )
        ) as higher_users
      `,
      
      // 전체 사용자 수
      prisma.user.count()
    ])

    return {
      reviewRank: Number(reviewRank[0]?.rank || 1),
      likeRank: Number(likeRank[0]?.rank || 1),
      totalUsers
    }
    
  } catch (error) {
    console.error('Error getting user ranking:', error)
    return {
      reviewRank: 1,
      likeRank: 1,
      totalUsers: 1
    }
  }
}