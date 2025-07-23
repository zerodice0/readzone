/**
 * 이미지 업로드 유틸리티
 */

export interface ImageUploadResult {
  url: string
  filename: string
  originalName: string
  size: number
  mimeType: string
  uploadedAt: string
}

export interface ImageUploadError {
  errorType: string
  message: string
}

export interface ImageUploadOptions {
  /** 진행률 콜백 */
  onProgress?: (progress: number) => void
  /** 업로드 시작 콜백 */
  onStart?: () => void
  /** 업로드 완료 콜백 */
  onComplete?: (result: ImageUploadResult) => void
  /** 에러 콜백 */
  onError?: (error: ImageUploadError) => void
  /** 최대 파일 크기 (바이트, 기본: 5MB) */
  maxSize?: number
  /** 지원되는 파일 타입 */
  allowedTypes?: string[]
}

/**
 * 파일 크기를 읽기 쉬운 형태로 포맷
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 이미지 파일 검증
 */
export function validateImageFile(
  file: File, 
  options: ImageUploadOptions = {}
): { valid: boolean; error?: string } {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  } = options

  // 파일 크기 검증
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `파일 크기가 너무 큽니다. 최대 ${formatFileSize(maxSize)}까지 업로드할 수 있습니다.`
    }
  }

  // 파일 타입 검증
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: '지원하지 않는 파일 형식입니다. JPEG, PNG, WebP, GIF 파일만 업로드할 수 있습니다.'
    }
  }

  return { valid: true }
}

/**
 * 이미지 업로드 함수
 */
export async function uploadImage(
  file: File,
  options: ImageUploadOptions = {}
): Promise<ImageUploadResult> {
  const {
    onProgress,
    onStart,
    onComplete,
    onError
  } = options

  // 파일 검증
  const validation = validateImageFile(file, options)
  if (!validation.valid) {
    const error = { errorType: 'VALIDATION_ERROR', message: validation.error! }
    onError?.(error)
    throw new Error(validation.error)
  }

  onStart?.()

  try {
    // FormData 생성
    const formData = new FormData()
    formData.append('image', file)

    // XMLHttpRequest로 업로드 (진행률 추적을 위해)
    const result = await new Promise<ImageUploadResult>((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      // 진행률 추적
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100)
            onProgress(progress)
          }
        })
      }

      // 완료 처리
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText)
            if (response.success) {
              resolve(response.data)
            } else {
              reject(response.error)
            }
          } catch (err) {
            reject({ errorType: 'PARSE_ERROR', message: '응답을 파싱할 수 없습니다.' })
          }
        } else {
          try {
            const response = JSON.parse(xhr.responseText)
            reject(response.error || { errorType: 'HTTP_ERROR', message: `HTTP ${xhr.status}` })
          } catch (err) {
            reject({ errorType: 'HTTP_ERROR', message: `HTTP ${xhr.status}` })
          }
        }
      })

      // 에러 처리
      xhr.addEventListener('error', () => {
        reject({ errorType: 'NETWORK_ERROR', message: '네트워크 오류가 발생했습니다.' })
      })

      xhr.addEventListener('timeout', () => {
        reject({ errorType: 'TIMEOUT_ERROR', message: '업로드 시간이 초과되었습니다.' })
      })

      // 요청 전송
      xhr.open('POST', '/api/upload/image')
      xhr.timeout = 30000 // 30초 타임아웃
      xhr.send(formData)
    })

    onComplete?.(result)
    return result

  } catch (error) {
    const uploadError = error as ImageUploadError
    onError?.(uploadError)
    throw error
  }
}

/**
 * 다중 이미지 업로드
 */
export async function uploadMultipleImages(
  files: File[],
  options: ImageUploadOptions = {}
): Promise<ImageUploadResult[]> {
  const results: ImageUploadResult[] = []
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    
    try {
      const result = await uploadImage(file, {
        ...options,
        onProgress: options.onProgress ? (progress) => {
          // 전체 진행률 계산
          const totalProgress = ((i / files.length) * 100) + (progress / files.length)
          options.onProgress!(Math.round(totalProgress))
        } : undefined
      })
      
      results.push(result)
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error)
      // 개별 파일 업로드 실패 시 계속 진행
      if (options.onError) {
        options.onError(error as ImageUploadError)
      }
    }
  }
  
  return results
}

/**
 * 이미지 미리보기 생성
 */
export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      resolve(event.target?.result as string)
    }
    
    reader.onerror = () => {
      reject(new Error('파일을 읽을 수 없습니다.'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * 클립보드에서 이미지 가져오기
 */
export async function getImageFromClipboard(): Promise<File | null> {
  try {
    const clipboardItems = await navigator.clipboard.read()
    
    for (const item of clipboardItems) {
      for (const type of item.types) {
        if (type.startsWith('image/')) {
          const blob = await item.getType(type)
          return new File([blob], `clipboard-image-${Date.now()}.png`, { type })
        }
      }
    }
    
    return null
  } catch (error) {
    console.error('클립보드 접근 실패:', error)
    return null
  }
}

/**
 * 드래그 앤 드롭 유틸리티
 */
export function setupImageDropzone(
  element: HTMLElement,
  onDrop: (files: File[]) => void,
  options: { accept?: string[]; multiple?: boolean } = {}
) {
  const { accept = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], multiple = false } = options

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    element.classList.add('drag-over')
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    element.classList.remove('drag-over')
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    element.classList.remove('drag-over')

    const files = Array.from(e.dataTransfer?.files || [])
    const imageFiles = files.filter(file => accept.includes(file.type))

    if (imageFiles.length > 0) {
      onDrop(multiple ? imageFiles : [imageFiles[0]])
    }
  }

  element.addEventListener('dragover', handleDragOver)
  element.addEventListener('dragleave', handleDragLeave)
  element.addEventListener('drop', handleDrop)

  // 정리 함수 반환
  return () => {
    element.removeEventListener('dragover', handleDragOver)
    element.removeEventListener('dragleave', handleDragLeave)
    element.removeEventListener('drop', handleDrop)
  }
}