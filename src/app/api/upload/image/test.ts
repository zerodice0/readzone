/**
 * 이미지 업로드 API 테스트
 * 
 * 이 파일은 개발 중 API 테스트를 위한 예제입니다.
 * 실제 프로덕션에서는 제거해야 합니다.
 */

export interface ImageUploadTestResult {
  success: boolean
  message: string
  url?: string
  errors?: string[]
}

// Test configuration types
interface SuccessTestConfig {
  description: string
  expectedStatus: 200
  expectedResponseKeys: string[]
  requirements: string[]
}

interface ErrorTestConfig {
  description: string
  expectedStatus: number
  expectedError: string
  requirements: string[]
}

type TestConfig = SuccessTestConfig | ErrorTestConfig

/**
 * 이미지 업로드 API 테스트 시나리오
 */
export const imageUploadTests: Record<string, TestConfig> = {
  // 1. 정상적인 JPEG 이미지 업로드
  validJpegUpload: {
    description: '유효한 JPEG 이미지 업로드',
    expectedStatus: 200,
    expectedResponseKeys: ['success', 'data'],
    requirements: [
      '파일 크기: 5MB 이하',
      'MIME 타입: image/jpeg',
      '매직 바이트 검증 통과',
      '인증된 사용자'
    ]
  },

  // 2. 파일 크기 초과
  fileTooLarge: {
    description: '5MB 초과 파일 업로드',
    expectedStatus: 400,
    expectedError: 'FILE_TOO_LARGE',
    requirements: [
      '파일 크기: 5MB 초과',
      '에러 메시지 확인'
    ]
  },

  // 3. 지원하지 않는 파일 형식
  unsupportedFormat: {
    description: '지원하지 않는 파일 형식 (PDF 등)',
    expectedStatus: 400,
    expectedError: 'UNSUPPORTED_TYPE',
    requirements: [
      'MIME 타입: application/pdf',
      '에러 메시지 확인'
    ]
  },

  // 4. 매직 바이트 불일치
  magicByteMismatch: {
    description: '확장자와 실제 파일 형식 불일치',
    expectedStatus: 400,
    expectedError: 'INVALID_FILE_FORMAT',
    requirements: [
      'MIME 타입: image/jpeg',
      '실제 파일: PNG 매직 바이트',
      '매직 바이트 검증 실패'
    ]
  },

  // 5. 인증 실패
  unauthenticated: {
    description: '인증되지 않은 사용자 업로드',
    expectedStatus: 401,
    expectedError: 'UNAUTHORIZED',
    requirements: [
      '세션 없음',
      '인증 에러 확인'
    ]
  },

  // 6. 파일 없음
  noFile: {
    description: '파일 없이 요청',
    expectedStatus: 400,
    expectedError: 'NO_FILE',
    requirements: [
      'FormData에 image 필드 없음',
      '에러 메시지 확인'
    ]
  }
}

/**
 * Type guard functions
 */
function isErrorTestConfig(config: TestConfig): config is ErrorTestConfig {
  return 'expectedError' in config
}

/**
 * 테스트 헬퍼 함수들
 */
export const testHelpers = {
  /**
   * 테스트용 이미지 Blob 생성
   */
  createTestImageBlob: (type: 'jpeg' | 'png' | 'gif' | 'webp', size: 'small' | 'large' = 'small'): Blob => {
    // 실제 구현에서는 Canvas API를 사용하여 테스트 이미지 생성
    const canvas = document.createElement('canvas')
    canvas.width = size === 'small' ? 100 : 2000
    canvas.height = size === 'small' ? 100 : 2000
    
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#ff0000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    
    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!)
      }, `image/${type}`, 0.9)
    }) as any // 실제 구현에서는 적절한 타입 처리 필요
  },

  /**
   * 매직 바이트 불일치 파일 생성
   */
  createMismatchedFile: (): File => {
    // PNG 매직 바이트를 가진 파일을 JPEG로 위장
    const pngMagicBytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
    const blob = new Blob([pngMagicBytes], { type: 'image/jpeg' }) // MIME 타입은 JPEG로 위장
    return new File([blob], 'fake.jpg', { type: 'image/jpeg' })
  },

  /**
   * 큰 파일 생성 (5MB 초과)
   */
  createLargeFile: (): File => {
    const size = 6 * 1024 * 1024 // 6MB
    const buffer = new ArrayBuffer(size)
    const blob = new Blob([buffer], { type: 'image/jpeg' })
    return new File([blob], 'large.jpg', { type: 'image/jpeg' })
  },

  /**
   * API 호출 헬퍼
   */
  uploadImage: async (file: File): Promise<Response> => {
    const formData = new FormData()
    formData.append('image', file)
    
    return fetch('/api/upload/image', {
      method: 'POST',
      body: formData
    })
  },

  /**
   * 테스트 결과 검증
   */
  validateResponse: async (response: Response, expectedStatus: number, expectedError?: string): Promise<ImageUploadTestResult> => {
    const isStatusValid = response.status === expectedStatus
    const responseData = await response.json()
    
    if (expectedStatus === 200) {
      // 성공 케이스 검증
      const hasRequiredKeys = responseData.success && responseData.data
      const hasUrl = responseData.data?.url
      
      return {
        success: isStatusValid && hasRequiredKeys && hasUrl,
        message: isStatusValid ? '업로드 성공' : `상태 코드 불일치: ${response.status}`,
        url: responseData.data?.url
      }
    } else {
      // 에러 케이스 검증
      const hasError = !responseData.success && responseData.error
      const correctErrorType = expectedError ? responseData.error?.errorType === expectedError : true
      
      return {
        success: isStatusValid && hasError && correctErrorType,
        message: isStatusValid 
          ? (correctErrorType ? '예상된 에러 발생' : `에러 타입 불일치: ${responseData.error?.errorType}`)
          : `상태 코드 불일치: ${response.status}`,
        errors: hasError ? [responseData.error.message] : []
      }
    }
  }
}

/**
 * 전체 테스트 실행 함수
 */
export async function runImageUploadTests(): Promise<{ [key: string]: ImageUploadTestResult }> {
  const results: { [key: string]: ImageUploadTestResult } = {}
  
  // 각 테스트 시나리오 실행
  for (const [testName, testConfig] of Object.entries(imageUploadTests)) {
    try {
      let testFile: File
      
      // 테스트별 파일 생성
      switch (testName) {
        case 'fileTooLarge':
          testFile = testHelpers.createLargeFile()
          break
        case 'magicByteMismatch':
          testFile = testHelpers.createMismatchedFile()
          break
        case 'unsupportedFormat':
          testFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })
          break
        case 'noFile':
          // 파일 없이 요청하는 특수 케이스
          const response = await fetch('/api/upload/image', {
            method: 'POST',
            body: new FormData() // 빈 FormData
          })
          results[testName] = await testHelpers.validateResponse(
            response, 
            testConfig.expectedStatus, 
            isErrorTestConfig(testConfig) ? testConfig.expectedError : undefined
          )
          continue
        default:
          // 기본적으로 작은 JPEG 파일 생성
          const blob = await testHelpers.createTestImageBlob('jpeg', 'small')
          testFile = new File([blob], 'test.jpg', { type: 'image/jpeg' })
      }
      
      // API 호출 및 결과 검증
      const response = await testHelpers.uploadImage(testFile)
      results[testName] = await testHelpers.validateResponse(
        response,
        testConfig.expectedStatus,
        isErrorTestConfig(testConfig) ? testConfig.expectedError : undefined
      )
      
    } catch (error) {
      results[testName] = {
        success: false,
        message: `테스트 실행 중 오류: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }
  
  return results
}