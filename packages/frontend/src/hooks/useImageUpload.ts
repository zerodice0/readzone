import { useCallback, useState } from 'react'
import type { UseImageUploadReturn } from '@/types'

/**
 * 이미지 업로드 커스텀 훅
 * Cloudinary를 사용한 이미지 업로드 및 상태 관리
 */
export function useImageUpload(): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<number>()

  /**
   * 이미지 업로드 함수
   * @param file - 업로드할 이미지 Blob 또는 File
   * @returns 업로드된 이미지의 URL
   */
  const uploadImage = useCallback(async (file: Blob | File): Promise<string> => {
    if (!file) {
      throw new Error('업로드할 이미지가 없습니다.')
    }

    // 파일 유효성 검사
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('이미지 크기는 10MB 이하로 업로드해주세요.')
    }

    // 이미지 타입 검사 (File 객체인 경우만)
    if (file instanceof File) {
      if (!file.type.startsWith('image/')) {
        throw new Error('이미지 파일만 업로드 가능합니다.')
      }

      // 지원되는 이미지 형식 검사
      const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

      if (!supportedTypes.includes(file.type)) {
        throw new Error('지원되지 않는 이미지 형식입니다. (JPEG, PNG, GIF, WebP만 지원)')
      }
    }

    setIsUploading(true)
    setError(null)
    setProgress(0)

    try {
      // Cloudinary 설정 확인
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME

      if (!cloudName) {
        throw new Error('Cloudinary 설정이 없습니다.')
      }

      // FormData 생성
      const formData = new FormData()

      formData.append('file', file)
      formData.append('upload_preset', 'readzone_profile_images')
      formData.append('folder', 'profile_images')

      // 업로드 URL
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`

      // XMLHttpRequest를 사용하여 진행률 추적
      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        // 진행률 이벤트 리스너
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentage = Math.round((event.loaded * 100) / event.total)

            setProgress(percentage)
          }
        })

        // 완료 이벤트 리스너
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(new Response(xhr.responseText, {
              status: xhr.status,
              statusText: xhr.statusText,
            }))
          } else {
            reject(new Error(`업로드 실패: ${xhr.statusText}`))
          }
        })

        // 에러 이벤트 리스너
        xhr.addEventListener('error', () => {
          reject(new Error('네트워크 오류가 발생했습니다.'))
        })

        // 타임아웃 이벤트 리스너
        xhr.addEventListener('timeout', () => {
          reject(new Error('업로드 시간이 초과되었습니다.'))
        })

        // 요청 설정
        xhr.open('POST', uploadUrl)
        xhr.timeout = 60000 // 60초 타임아웃
        xhr.send(formData)
      })

      // 응답 처리
      const data = await response.json()

      if (!data.secure_url) {
        throw new Error('업로드된 이미지 URL을 받을 수 없습니다.')
      }

      setProgress(100)

      return data.secure_url

    } catch (err: unknown) {
      const errorMessage = (err instanceof Error ? err.message : null) ?? '이미지 업로드에 실패했습니다.'

      setError(errorMessage)
      console.error('Image upload error:', err)
      throw new Error(errorMessage)

    } finally {
      setIsUploading(false)
      // 진행률 초기화 (1초 후)
      setTimeout(() => setProgress(undefined), 1000)
    }
  }, [])

  /**
   * 에러 초기화
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * 업로드 상태 초기화
   */
  const reset = useCallback(() => {
    setIsUploading(false)
    setError(null)
    setProgress(undefined)
  }, [])

  return {
    uploadImage,
    isUploading,
    error,
    progress,
    clearError,
    reset,
  }
}

/**
 * 프로필 이미지 업로드 전용 훅
 * 크기 제한 및 크롭 기능 포함
 */
export function useProfileImageUpload() {
  const imageUpload = useImageUpload()

  /**
   * 프로필 이미지 업로드
   * 자동으로 크기 조정 및 최적화
   */
  const uploadProfileImage = useCallback(async (file: Blob | File): Promise<string> => {
    // 프로필 이미지는 5MB로 제한
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('프로필 이미지는 5MB 이하로 업로드해주세요.')
    }

    const url = await imageUpload.uploadImage(file)

    // Cloudinary transformation을 통한 자동 최적화
    // 정사각형 크롭, 품질 최적화, WebP 변환
    const optimizedUrl = url.replace(
      '/upload/',
      '/upload/c_fill,w_400,h_400,q_auto,f_auto/'
    )

    return optimizedUrl
  }, [imageUpload])

  return {
    ...imageUpload,
    uploadProfileImage,
  }
}

/**
 * 다중 이미지 업로드 훅
 * 여러 이미지를 순차적으로 업로드
 */
export function useMultipleImageUpload() {
  const imageUpload = useImageUpload()
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [totalFiles, setTotalFiles] = useState(0)

  /**
   * 여러 이미지 업로드
   */
  const uploadMultipleImages = useCallback(async (files: File[]): Promise<string[]> => {
    if (!files || files.length === 0) {
      throw new Error('업로드할 이미지가 없습니다.')
    }

    setTotalFiles(files.length)
    setCurrentIndex(0)
    setUploadedUrls([])

    const results: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        setCurrentIndex(i + 1)
        const file = files[i]

        if (!file) {continue}
        const url = await imageUpload.uploadImage(file)

        results.push(url)
        setUploadedUrls(prev => [...prev, url])
      }

      return results
    } finally {
      // 상태 초기화
      setTimeout(() => {
        setCurrentIndex(0)
        setTotalFiles(0)
      }, 1000)
    }
  }, [imageUpload])

  return {
    ...imageUpload,
    uploadMultipleImages,
    uploadedUrls,
    currentIndex,
    totalFiles,
    isMultipleUpload: totalFiles > 1,
  }
}

/**
 * 이미지 사전 검증 훅
 * 업로드 전 이미지 유효성 검사
 */
export function useImageValidation() {
  /**
   * 이미지 파일 검증
   */
  const validateImage = useCallback((file: File): string[] => {
    const errors: string[] = []

    // 파일 크기 검증 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      errors.push('이미지 크기는 10MB 이하로 선택해주세요.')
    }

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      errors.push('이미지 파일만 선택 가능합니다.')
    }

    // 지원되는 형식 검증
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

    if (!supportedTypes.includes(file.type)) {
      errors.push('JPEG, PNG, GIF, WebP 형식만 지원됩니다.')
    }

    return errors
  }, [])

  /**
   * 프로필 이미지 검증 (더 엄격한 규칙)
   */
  const validateProfileImage = useCallback((file: File): string[] => {
    const errors: string[] = []

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      errors.push('프로필 이미지는 5MB 이하로 선택해주세요.')
    }

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      errors.push('이미지 파일만 선택 가능합니다.')
    }

    // 지원되는 형식 검증 (GIF 제외)
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

    if (!supportedTypes.includes(file.type)) {
      errors.push('JPEG, PNG, WebP 형식만 지원됩니다.')
    }

    return errors
  }, [])

  return {
    validateImage,
    validateProfileImage,
  }
}