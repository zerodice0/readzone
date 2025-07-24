#!/usr/bin/env tsx

/**
 * ReadZone 데이터베이스 백업 스크립트
 * 
 * 이 스크립트는 SQLite 데이터베이스를 안전하게 백업합니다.
 * - 자동 백업 파일명 생성 (타임스탬프 포함)
 * - 압축 백업 지원
 * - 백업 보존 정책 적용
 * - 백업 무결성 검증
 * 
 * 사용법:
 * npm run db:backup                # 기본 백업
 * npm run db:backup --compress     # 압축 백업
 * npm run db:backup --name my-backup  # 사용자 지정 이름
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface BackupOptions {
  compress: boolean
  customName?: string
  maxBackups: number
  outputDir: string
  verify: boolean
  verbose: boolean
}

/**
 * 명령행 인수 파싱
 */
function parseArguments(): BackupOptions {
  const args = process.argv.slice(2)
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp()
    process.exit(0)
  }
  
  const nameIndex = args.indexOf('--name')
  const maxBackupsIndex = args.indexOf('--max-backups')
  const outputDirIndex = args.indexOf('--output')
  
  return {
    compress: args.includes('--compress') || args.includes('-c'),
    customName: nameIndex !== -1 ? args[nameIndex + 1] : undefined,
    maxBackups: maxBackupsIndex !== -1 ? parseInt(args[maxBackupsIndex + 1]) || 10 : 10,
    outputDir: outputDirIndex !== -1 ? args[outputDirIndex + 1] : path.join(process.cwd(), 'backups'),
    verify: !args.includes('--no-verify'),
    verbose: args.includes('--verbose') || args.includes('-v')
  }
}

/**
 * 도움말 표시
 */
function showHelp(): void {
  console.log(`
ReadZone 데이터베이스 백업 스크립트

사용법: npm run db:backup [옵션]

옵션:
  --compress, -c           백업 파일 압축 (gzip)
  --name <이름>            사용자 지정 백업 이름
  --max-backups <수>       최대 보존 백업 수 (기본: 10)
  --output <경로>          백업 저장 디렉토리 (기본: ./backups)
  --no-verify             백업 무결성 검증 건너뛰기
  --verbose, -v           상세 로그 출력
  --help, -h              이 도움말 표시

예시:
  npm run db:backup                           # 기본 백업
  npm run db:backup --compress                # 압축 백업
  npm run db:backup --name pre-migration     # 이름 지정 백업
  npm run db:backup --max-backups 5          # 최대 5개 백업 보존
`)
}

/**
 * 백업 파일명 생성
 */
function generateBackupFilename(customName?: string, compress: boolean = false): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const extension = compress ? '.db.gz' : '.db'
  
  if (customName) {
    return `${customName}-${timestamp}${extension}`
  }
  
  return `readzone-backup-${timestamp}${extension}`
}

/**
 * 데이터베이스 상태 정보 수집
 */
async function getDatabaseInfo(): Promise<any> {
  try {
    const info = {
      tables: {},
      totalRecords: 0,
      databaseSize: 0,
      timestamp: new Date().toISOString()
    }
    
    // 테이블별 레코드 수 (Prisma 모델명과 매핑)
    const tableMap = {
      'User': 'user',
      'Book': 'book', 
      'BookReview': 'bookReview',
      'BookOpinion': 'bookOpinion',
      'Comment': 'comment',
      'ReviewLike': 'reviewLike',
      'CommentLike': 'commentLike', 
      'ReviewDraft': 'reviewDraft',
      'BookApiCache': 'bookApiCache',
      'ApiUsageLog': 'apiUsageLog',
      'ManualBookEntry': 'manualBookEntry',
      'Account': 'account',
      'Session': 'session'
    }
    
    for (const [tableName, modelName] of Object.entries(tableMap)) {
      try {
        const count = await (prisma as any)[modelName].count()
        info.tables[tableName] = count
        info.totalRecords += count
      } catch (error) {
        // 테이블이 존재하지 않을 수 있음 (개발 중 마이그레이션 등)
        if (options.verbose) {
          console.warn(`테이블 ${tableName} 조회 실패:`, error.message)
        }
      }
    }
    
    // 데이터베이스 파일 크기
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath)
      info.databaseSize = stats.size
    }
    
    return info
  } catch (error) {
    console.error('데이터베이스 정보 수집 실패:', error)
    return null
  }
}

/**
 * 백업 실행
 */
async function createBackup(options: BackupOptions): Promise<string> {
  const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
  
  if (!fs.existsSync(dbPath)) {
    throw new Error(`데이터베이스 파일을 찾을 수 없습니다: ${dbPath}`)
  }
  
  // 백업 디렉토리 생성
  if (!fs.existsSync(options.outputDir)) {
    fs.mkdirSync(options.outputDir, { recursive: true })
    console.log(`📁 백업 디렉토리 생성: ${options.outputDir}`)
  }
  
  const backupFilename = generateBackupFilename(options.customName, options.compress)
  const backupPath = path.join(options.outputDir, backupFilename)
  
  console.log(`💾 백업 생성 중: ${backupFilename}`)
  
  try {
    if (options.compress) {
      // gzip 압축 백업
      execSync(`gzip -c "${dbPath}" > "${backupPath}"`, { stdio: 'pipe' })
    } else {
      // 단순 복사 백업
      fs.copyFileSync(dbPath, backupPath)
    }
    
    // 백업 파일 크기 확인
    const backupStats = fs.statSync(backupPath)
    const originalStats = fs.statSync(dbPath)
    
    if (options.verbose) {
      console.log(`  원본 크기: ${(originalStats.size / 1024 / 1024).toFixed(2)} MB`)
      console.log(`  백업 크기: ${(backupStats.size / 1024 / 1024).toFixed(2)} MB`)
      if (options.compress) {
        const ratio = ((1 - backupStats.size / originalStats.size) * 100).toFixed(1)
        console.log(`  압축률: ${ratio}%`)
      }
    }
    
    console.log(`✅ 백업 생성 완료: ${backupPath}`)
    return backupPath
    
  } catch (error) {
    console.error('❌ 백업 생성 실패:', error)
    throw error
  }
}

/**
 * 백업 무결성 검증
 */
async function verifyBackup(backupPath: string, compress: boolean): Promise<boolean> {
  try {
    console.log('🔍 백업 무결성 검증 중...')
    
    if (compress) {
      // gzip 파일 무결성 검사
      execSync(`gzip -t "${backupPath}"`, { stdio: 'pipe' })
      console.log('✅ 압축 파일 무결성 확인')
    } else {
      // SQLite 데이터베이스 무결성 검사
      const tempCheck = execSync(`sqlite3 "${backupPath}" "PRAGMA integrity_check;"`, { 
        encoding: 'utf8', 
        stdio: 'pipe' 
      }).trim()
      
      if (tempCheck !== 'ok') {
        throw new Error(`데이터베이스 무결성 검사 실패: ${tempCheck}`)
      }
      console.log('✅ 데이터베이스 무결성 확인')
    }
    
    return true
  } catch (error) {
    console.error('❌ 백업 검증 실패:', error)
    return false
  }
}

/**
 * 백업 메타데이터 생성
 */
async function createBackupMetadata(backupPath: string, dbInfo: any): Promise<void> {
  const metadataPath = backupPath + '.json'
  
  const metadata = {
    ...dbInfo,
    backupPath,
    backupSize: fs.statSync(backupPath).size,
    createdAt: new Date().toISOString(),
    version: process.env.npm_package_version || 'unknown'
  }
  
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))
  
  if (metadata.totalRecords) {
    console.log(`📊 백업 정보: ${metadata.totalRecords.toLocaleString()}개 레코드`)
  }
}

/**
 * 오래된 백업 정리
 */
function cleanupOldBackups(options: BackupOptions): void {
  try {
    const files = fs.readdirSync(options.outputDir)
    const backupFiles = files
      .filter(file => file.startsWith('readzone-backup-') && (file.endsWith('.db') || file.endsWith('.db.gz')))
      .map(file => ({
        name: file,
        path: path.join(options.outputDir, file),
        stats: fs.statSync(path.join(options.outputDir, file))
      }))
      .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime())
    
    if (backupFiles.length > options.maxBackups) {
      const filesToDelete = backupFiles.slice(options.maxBackups)
      
      console.log(`🧹 오래된 백업 ${filesToDelete.length}개 정리 중...`)
      
      filesToDelete.forEach(file => {
        fs.unlinkSync(file.path)
        
        // 메타데이터 파일도 삭제
        const metadataPath = file.path + '.json'
        if (fs.existsSync(metadataPath)) {
          fs.unlinkSync(metadataPath)
        }
        
        if (options.verbose) {
          console.log(`  삭제: ${file.name}`)
        }
      })
      
      console.log(`✅ ${filesToDelete.length}개 백업 파일 정리 완료`)
    }
  } catch (error) {
    console.warn('⚠️  백업 정리 실패:', error)
  }
}

/**
 * 메인 실행 함수
 */
async function main(): Promise<void> {
  console.log('💾 ReadZone 데이터베이스 백업 스크립트')
  console.log('=====================================\n')
  
  const options = parseArguments()
  
  if (options.verbose) {
    console.log('🔧 백업 옵션:')
    console.log(`  - 압축: ${options.compress}`)
    console.log(`  - 사용자 지정 이름: ${options.customName || '없음'}`)
    console.log(`  - 최대 백업 수: ${options.maxBackups}`)
    console.log(`  - 출력 디렉토리: ${options.outputDir}`)
    console.log(`  - 검증: ${options.verify}`)
    console.log('')
  }
  
  try {
    // 데이터베이스 정보 수집
    console.log('📊 데이터베이스 정보 수집 중...')
    const dbInfo = await getDatabaseInfo()
    
    // 백업 생성
    const backupPath = await createBackup(options)
    
    // 백업 무결성 검증
    if (options.verify) {
      const isValid = await verifyBackup(backupPath, options.compress)
      if (!isValid) {
        throw new Error('백업 무결성 검증 실패')
      }
    }
    
    // 메타데이터 생성
    if (dbInfo) {
      await createBackupMetadata(backupPath, dbInfo)
    }
    
    // 오래된 백업 정리
    cleanupOldBackups(options)
    
    console.log('\n🎉 백업이 성공적으로 완료되었습니다!')
    console.log(`📁 백업 위치: ${backupPath}`)
    
  } catch (error) {
    console.error('\n❌ 백업 중 오류 발생:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 실행
if (require.main === module) {
  main().catch((error) => {
    console.error('백업 스크립트 실행 실패:', error)
    process.exit(1)
  })
}

export { main as backupDatabase }