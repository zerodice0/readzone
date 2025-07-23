import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import crypto from 'crypto'
import sharp from 'sharp'

// 지원되는 이미지 타입과 매직 바이트
const SUPPORTED_TYPES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
  'image/gif': [0x47, 0x49, 0x46]
} as const

// 설정 상수
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'images')
const MAX_WIDTH = 1200
const MAX_HEIGHT = 800
const QUALITY = 85

/**
 * 매직 바이트 검증
 */
function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const magicBytes = SUPPORTED_TYPES[mimeType as keyof typeof SUPPORTED_TYPES]
  if (!magicBytes) return false

  // 매직 바이트 검증
  for (let i = 0; i < magicBytes.length; i++) {
    if (buffer[i] !== magicBytes[i]) {
      return false
    }
  }
  return true
}

/**
 * 안전한 파일명 생성
 */
function generateSecureFilename(_originalName: string, mimeType: string): string {
  // 확장자 추출
  const extension = getExtensionFromMimeType(mimeType)
  
  // 랜덤 해시 생성
  const hash = crypto.randomBytes(16).toString('hex')
  const timestamp = Date.now()
  
  // 안전한 파일명 생성 (경로 순회 공격 방지)
  return `${timestamp}-${hash}.${extension}`
}

/**
 * MIME 타입에서 확장자 추출
 */
function getExtensionFromMimeType(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/gif':
      return 'gif'
    default:
      throw new Error('지원하지 않는 파일 형식입니다.')
  }
}

/**
 * 이미지 압축 및 최적화
 */
async function optimizeImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
  let processor = sharp(buffer)

  // 메타데이터 확인
  const metadata = await processor.metadata()
  
  // 크기 조정 (필요한 경우)
  if (metadata.width && metadata.width > MAX_WIDTH) {
    processor = processor.resize(MAX_WIDTH, null, {
      withoutEnlargement: true,
      fit: 'inside'
    })
  }
  
  if (metadata.height && metadata.height > MAX_HEIGHT) {
    processor = processor.resize(null, MAX_HEIGHT, {
      withoutEnlargement: true,
      fit: 'inside'
    })
  }

  // 포맷별 최적화
  switch (mimeType) {
    case 'image/jpeg':
      return processor.jpeg({ quality: QUALITY, progressive: true }).toBuffer()
    case 'image/png':
      return processor.png({ compressionLevel: 9, palette: true }).toBuffer()
    case 'image/webp':
      return processor.webp({ quality: QUALITY }).toBuffer()
    case 'image/gif':
      // GIF는 최적화하지 않고 원본 유지 (애니메이션 보존)
      return buffer
    default:
      return processor.jpeg({ quality: QUALITY }).toBuffer()
  }
}

/**
 * 업로드 디렉토리 확인 및 생성
 */
async function ensureUploadDirectory(): Promise<void> {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 인증 확인
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            errorType: 'UNAUTHORIZED',
            message: '로그인이 필요합니다.' 
          } 
        },
        { status: 401 }
      )
    }

    // Content-Type 검증
    const contentType = request.headers.get('content-type')
    if (!contentType?.startsWith('multipart/form-data')) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            errorType: 'INVALID_CONTENT_TYPE',
            message: 'multipart/form-data 형식만 지원됩니다.' 
          } 
        },
        { status: 400 }
      )
    }

    // FormData 파싱
    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            errorType: 'NO_FILE',
            message: '업로드할 파일이 없습니다.' 
          } 
        },
        { status: 400 }
      )
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            errorType: 'FILE_TOO_LARGE',
            message: '파일 크기는 5MB 이하여야 합니다.' 
          } 
        },
        { status: 400 }
      )
    }

    // MIME 타입 검증
    if (!Object.keys(SUPPORTED_TYPES).includes(file.type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            errorType: 'UNSUPPORTED_TYPE',
            message: '지원하지 않는 파일 형식입니다. (JPEG, PNG, WebP, GIF만 지원)' 
          } 
        },
        { status: 400 }
      )
    }

    // 파일을 Buffer로 변환
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 매직 바이트 검증 (실제 파일 형식 확인)
    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            errorType: 'INVALID_FILE_FORMAT',
            message: '파일 형식이 올바르지 않습니다.' 
          } 
        },
        { status: 400 }
      )
    }

    // 업로드 디렉토리 확인
    await ensureUploadDirectory()

    // 안전한 파일명 생성
    const filename = generateSecureFilename(file.name, file.type)
    const filepath = join(UPLOAD_DIR, filename)

    // 이미지 최적화
    const optimizedBuffer = await optimizeImage(buffer, file.type)

    // 파일 저장
    await writeFile(filepath, optimizedBuffer)

    // 공개 URL 생성
    const publicUrl = `/uploads/images/${filename}`

    // 성공 응답
    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        filename,
        originalName: file.name,
        size: optimizedBuffer.length,
        mimeType: file.type,
        uploadedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Image upload error:', error)

    // 에러 타입별 처리
    if (error instanceof Error) {
      if (error.message.includes('ENOSPC')) {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              errorType: 'STORAGE_FULL',
              message: '저장 공간이 부족합니다.' 
            } 
          },
          { status: 507 }
        )
      }

      if (error.message.includes('지원하지 않는')) {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              errorType: 'UNSUPPORTED_TYPE',
              message: error.message 
            } 
          },
          { status: 400 }
        )
      }
    }

    // 일반적인 서버 에러
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          errorType: 'INTERNAL_ERROR',
          message: '이미지 업로드 중 오류가 발생했습니다.' 
        } 
      },
      { status: 500 }
    )
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { 
      success: false, 
      error: { 
        errorType: 'METHOD_NOT_ALLOWED',
        message: 'GET 메서드는 지원되지 않습니다.' 
      } 
    },
    { status: 405 }
  )
}