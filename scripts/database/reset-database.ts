#!/usr/bin/env tsx

/**
 * ReadZone 데이터베이스 초기화 스크립트
 * 
 * 이 스크립트는 개발 환경에서 데이터베이스를 완전히 초기화합니다.
 * - 모든 사용자 데이터 삭제 (BookReview, BookOpinion, Comment 등)
 * - 시스템 필수 데이터는 보존 (User, Book 등은 옵션에 따라)
 * - 캐시 및 로그 데이터 정리
 * 
 * 사용법:
 * npm run db:reset          # 모든 데이터 삭제 (사용자 제외)
 * npm run db:reset --all    # 모든 데이터 삭제 (사용자 포함)
 * npm run db:reset --help   # 도움말 표시
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface ResetOptions {
  includeUsers: boolean
  includeBooks: boolean
  includeCaches: boolean
  includeAuth: boolean
  backup: boolean
  dryRun: boolean
  verbose: boolean
}

/**
 * 명령행 인수 파싱
 */
function parseArguments(): ResetOptions {
  const args = process.argv.slice(2)
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp()
    process.exit(0)
  }
  
  return {
    includeUsers: args.includes('--all') || args.includes('--users'),
    includeBooks: args.includes('--all') || args.includes('--books'),
    includeCaches: args.includes('--all') || args.includes('--caches'),
    includeAuth: args.includes('--all') || args.includes('--auth'),
    backup: !args.includes('--no-backup'),
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose') || args.includes('-v')
  }
}

/**
 * 도움말 표시
 */
function showHelp(): void {
  console.log(`
ReadZone 데이터베이스 초기화 스크립트

사용법: npm run db:reset [옵션]

옵션:
  --all         모든 데이터 삭제 (사용자, 도서 포함)
  --users       사용자 데이터도 삭제
  --books       도서 데이터도 삭제  
  --caches      캐시 데이터만 삭제
  --auth        인증 관련 데이터도 삭제
  --no-backup   백업 생성 건너뛰기
  --dry-run     실제 삭제 없이 계획만 표시
  --verbose     상세 로그 출력
  --help        이 도움말 표시

예시:
  npm run db:reset                    # 콘텐츠만 삭제 (안전)
  npm run db:reset --all              # 모든 데이터 삭제
  npm run db:reset --users --books    # 사용자와 도서 삭제
  npm run db:reset --dry-run          # 계획만 확인
  npm run db:reset --caches           # 캐시만 정리

⚠️  주의: 이 작업은 되돌릴 수 없습니다. 프로덕션에서 절대 사용하지 마세요.
`)
}

/**
 * 환경 안전성 검사
 */
function checkEnvironmentSafety(): void {
  const env = process.env.NODE_ENV
  
  if (env === 'production') {
    console.error('❌ 프로덕션 환경에서는 이 스크립트를 실행할 수 없습니다.')
    process.exit(1)
  }
  
  const dbUrl = process.env.DATABASE_URL || 'file:./dev.db'
  if (!dbUrl.includes('dev.db') && !dbUrl.includes('test.db')) {
    console.error('❌ 개발/테스트 데이터베이스가 아닌 것 같습니다.')
    console.error(`   DATABASE_URL: ${dbUrl}`)
    process.exit(1)
  }
}

/**
 * 데이터베이스 백업 생성
 */
async function createBackup(): Promise<string | null> {
  try {
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
    
    if (!fs.existsSync(dbPath)) {
      console.warn('⚠️  데이터베이스 파일을 찾을 수 없어 백업을 건너뜁니다.')
      return null
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = path.join(process.cwd(), 'backups', `dev-${timestamp}.db`)
    
    // 백업 디렉토리 생성
    const backupDir = path.dirname(backupPath)
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }
    
    // 파일 복사
    fs.copyFileSync(dbPath, backupPath)
    
    console.log(`✅ 데이터베이스 백업 생성: ${backupPath}`)
    return backupPath
  } catch (error) {
    console.error('❌ 백업 생성 실패:', error)
    return null
  }
}

/**
 * 테이블별 레코드 수 조회
 */
async function getTableCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {}
  
  try {
    counts.BookReview = await prisma.bookReview.count()
    counts.BookOpinion = await prisma.bookOpinion.count()
    counts.Comment = await prisma.comment.count()
    counts.CommentLike = await prisma.commentLike.count()
    counts.ReviewLike = await prisma.reviewLike.count()
    counts.ReviewDraft = await prisma.reviewDraft.count()
    counts.Book = await prisma.book.count()
    counts.User = await prisma.user.count()
    counts.BookApiCache = await prisma.bookApiCache.count()
    counts.ApiUsageLog = await prisma.apiUsageLog.count()
    counts.ManualBookEntry = await prisma.manualBookEntry.count()
    counts.Account = await prisma.account.count()
    counts.Session = await prisma.session.count()
    counts.VerificationToken = await prisma.verificationToken.count()
  } catch (error) {
    console.error('테이블 수 조회 실패:', error)
  }
  
  return counts
}

/**
 * 삭제 계획 표시
 */
function showDeletionPlan(options: ResetOptions, counts: Record<string, number>): void {
  console.log('\n🗂  삭제 대상 테이블:')
  
  // 항상 삭제되는 콘텐츠 데이터
  const alwaysDelete = [
    'BookReview', 'BookOpinion', 'Comment', 'CommentLike', 
    'ReviewLike', 'ReviewDraft', 'ManualBookEntry'
  ]
  
  alwaysDelete.forEach(table => {
    const count = counts[table] || 0
    console.log(`  📄 ${table}: ${count.toLocaleString()}개`)
  })
  
  // 옵션에 따른 추가 삭제
  if (options.includeUsers) {
    console.log(`  👤 User: ${(counts.User || 0).toLocaleString()}개`)
  }
  
  if (options.includeBooks) {
    console.log(`  📚 Book: ${(counts.Book || 0).toLocaleString()}개`)
  }
  
  if (options.includeCaches) {
    console.log(`  🗄  BookApiCache: ${(counts.BookApiCache || 0).toLocaleString()}개`)
    console.log(`  📊 ApiUsageLog: ${(counts.ApiUsageLog || 0).toLocaleString()}개`)
  }
  
  if (options.includeAuth) {
    console.log(`  🔐 Account: ${(counts.Account || 0).toLocaleString()}개`)
    console.log(`  🎫 Session: ${(counts.Session || 0).toLocaleString()}개`)
    console.log(`  🔑 VerificationToken: ${(counts.VerificationToken || 0).toLocaleString()}개`)
  }
  
  console.log('\n🔒 보존되는 테이블:')
  if (!options.includeUsers) console.log('  👤 User (사용자 계정)')
  if (!options.includeBooks) console.log('  📚 Book (도서 정보)')
  if (!options.includeCaches) console.log('  🗄  캐시 및 로그 데이터')
  if (!options.includeAuth) console.log('  🔐 인증 관련 데이터')
}

/**
 * 데이터 삭제 실행
 */
async function executeReset(options: ResetOptions): Promise<void> {
  console.log('\n🚀 데이터베이스 초기화 시작...')
  
  try {
    // 트랜잭션으로 모든 삭제 작업 수행
    await prisma.$transaction(async (tx) => {
      let totalDeleted = 0
      
      // 1. 콘텐츠 관련 데이터 삭제 (의존성 순서 고려)
      console.log('📄 콘텐츠 데이터 삭제 중...')
      
      // 댓글 좋아요 먼저 삭제
      const commentLikes = await tx.commentLike.deleteMany()
      totalDeleted += commentLikes.count
      if (options.verbose) console.log(`  - CommentLike: ${commentLikes.count}개`)
      
      // 댓글 삭제
      const comments = await tx.comment.deleteMany()
      totalDeleted += comments.count
      if (options.verbose) console.log(`  - Comment: ${comments.count}개`)
      
      // 리뷰 좋아요 삭제
      const reviewLikes = await tx.reviewLike.deleteMany()
      totalDeleted += reviewLikes.count
      if (options.verbose) console.log(`  - ReviewLike: ${reviewLikes.count}개`)
      
      // 독후감 초안 삭제
      const drafts = await tx.reviewDraft.deleteMany()
      totalDeleted += drafts.count
      if (options.verbose) console.log(`  - ReviewDraft: ${drafts.count}개`)
      
      // 독후감 삭제
      const reviews = await tx.bookReview.deleteMany()
      totalDeleted += reviews.count
      if (options.verbose) console.log(`  - BookReview: ${reviews.count}개`)
      
      // 도서 의견 삭제
      const opinions = await tx.bookOpinion.deleteMany()
      totalDeleted += opinions.count
      if (options.verbose) console.log(`  - BookOpinion: ${opinions.count}개`)
      
      // 수동 도서 등록 삭제
      const manualEntries = await tx.manualBookEntry.deleteMany()
      totalDeleted += manualEntries.count
      if (options.verbose) console.log(`  - ManualBookEntry: ${manualEntries.count}개`)
      
      // 2. 선택적 삭제 - 도서 데이터
      if (options.includeBooks) {
        console.log('📚 도서 데이터 삭제 중...')
        const books = await tx.book.deleteMany()
        totalDeleted += books.count
        if (options.verbose) console.log(`  - Book: ${books.count}개`)
      }
      
      // 3. 선택적 삭제 - 사용자 데이터
      if (options.includeUsers) {
        console.log('👤 사용자 데이터 삭제 중...')
        const users = await tx.user.deleteMany()
        totalDeleted += users.count
        if (options.verbose) console.log(`  - User: ${users.count}개`)
      }
      
      // 4. 선택적 삭제 - 캐시 데이터
      if (options.includeCaches) {
        console.log('🗄  캐시 데이터 삭제 중...')
        const apiCache = await tx.bookApiCache.deleteMany()
        totalDeleted += apiCache.count
        if (options.verbose) console.log(`  - BookApiCache: ${apiCache.count}개`)
        
        const usageLogs = await tx.apiUsageLog.deleteMany()
        totalDeleted += usageLogs.count
        if (options.verbose) console.log(`  - ApiUsageLog: ${usageLogs.count}개`)
      }
      
      // 5. 선택적 삭제 - 인증 데이터
      if (options.includeAuth) {
        console.log('🔐 인증 데이터 삭제 중...')
        const sessions = await tx.session.deleteMany()
        totalDeleted += sessions.count
        if (options.verbose) console.log(`  - Session: ${sessions.count}개`)
        
        const accounts = await tx.account.deleteMany()
        totalDeleted += accounts.count
        if (options.verbose) console.log(`  - Account: ${accounts.count}개`)
        
        const tokens = await tx.verificationToken.deleteMany()
        totalDeleted += tokens.count
        if (options.verbose) console.log(`  - VerificationToken: ${tokens.count}개`)
      }
      
      console.log(`\n✅ 총 ${totalDeleted.toLocaleString()}개 레코드 삭제 완료`)
    })
    
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error)
    throw error
  }
}

/**
 * SQLite 데이터베이스 최적화
 */
async function optimizeDatabase(): Promise<void> {
  try {
    console.log('🔧 데이터베이스 최적화 중...')
    
    // VACUUM으로 빈 공간 정리
    await prisma.$executeRawUnsafe('VACUUM;')
    
    // 통계 정보 업데이트
    await prisma.$executeRawUnsafe('ANALYZE;')
    
    console.log('✅ 데이터베이스 최적화 완료')
  } catch (error) {
    console.warn('⚠️  데이터베이스 최적화 실패:', error)
  }
}

/**
 * 메인 실행 함수
 */
async function main(): Promise<void> {
  console.log('🧹 ReadZone 데이터베이스 초기화 스크립트')
  console.log('=====================================\n')
  
  // 환경 안전성 검사
  checkEnvironmentSafety()
  
  // 명령행 옵션 파싱
  const options = parseArguments()
  
  if (options.verbose) {
    console.log('🔧 실행 옵션:')
    console.log(`  - 사용자 포함: ${options.includeUsers}`)
    console.log(`  - 도서 포함: ${options.includeBooks}`)
    console.log(`  - 캐시 포함: ${options.includeCaches}`)
    console.log(`  - 인증 포함: ${options.includeAuth}`)
    console.log(`  - 백업 생성: ${options.backup}`)
    console.log(`  - 시험 실행: ${options.dryRun}`)
    console.log('')
  }
  
  try {
    // 현재 상태 확인
    console.log('📊 현재 데이터베이스 상태 확인 중...')
    const counts = await getTableCounts()
    
    // 삭제 계획 표시
    showDeletionPlan(options, counts)
    
    if (options.dryRun) {
      console.log('\n🧪 시험 실행 모드: 실제 삭제는 수행되지 않습니다.')
      return
    }
    
    // 사용자 확인
    if (process.stdin.isTTY) {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      })
      
      const answer = await new Promise<string>((resolve) => {
        readline.question('\n⚠️  정말로 계속하시겠습니까? (yes/no): ', resolve)
      })
      
      readline.close()
      
      if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
        console.log('❌ 작업이 취소되었습니다.')
        return
      }
    }
    
    // 백업 생성
    if (options.backup) {
      console.log('\n💾 데이터베이스 백업 생성 중...')
      await createBackup()
    }
    
    // 데이터 삭제 실행
    await executeReset(options)
    
    // 데이터베이스 최적화
    await optimizeDatabase()
    
    // 최종 상태 확인
    console.log('\n📊 초기화 후 상태:')
    const finalCounts = await getTableCounts()
    Object.entries(finalCounts).forEach(([table, count]) => {
      if (count > 0) {
        console.log(`  ${table}: ${count.toLocaleString()}개`)
      }
    })
    
    console.log('\n🎉 데이터베이스 초기화가 완료되었습니다!')
    
  } catch (error) {
    console.error('\n❌ 초기화 중 오류 발생:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 실행
if (require.main === module) {
  main().catch((error) => {
    console.error('스크립트 실행 실패:', error)
    process.exit(1)
  })
}

export { main as resetDatabase }