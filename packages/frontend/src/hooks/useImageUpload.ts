import { useCallback, useState } from 'react'
import type { UseImageUploadReturn } from '@/types'
import { useAuthStore } from '@/store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4001'

interface UploadOptions {
  endpoint?: string
  fieldName?: string
  filename?: string
  extraFields?: Record<string, string>
}

function buildUploadUrl(endpoint: string) {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint
  }

  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
}

/**
 * 이미지 업로드 커스텀 훅
 * 백엔드 업로드 API 연동 및 상태 관리
 */
export function useImageUpload(): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<number>()

  const uploadFile = useCallback(
    async (file: Blob | File, options: UploadOptions = {}): Promise<string> => {
      if (!file) {
        throw new Error('업로드할 이미지가 없습니다.')
      }

      const maxSizeBytes = 10 * 1024 * 1024

      if (file.size > maxSizeBytes) {
        throw new Error('이미지 크기는 10MB 이하로 업로드해주세요.')
      }

      if (file.type && !file.type.startsWith('image/')) {
        throw new Error('이미지 파일만 업로드 가능합니다.')
      }

      if (file instanceof File) {
        const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

        if (file.type && !supportedTypes.includes(file.type)) {
          throw new Error('지원되지 않는 이미지 형식입니다. (JPEG, PNG, GIF, WebP만 지원)')
        }
      }

      setIsUploading(true)
      setError(null)
      setProgress(0)

      try {
        const endpoint = options.endpoint ?? '/api/upload/image'
        const fieldName = options.fieldName ?? 'file'
        const uploadUrl = buildUploadUrl(endpoint)
        const formData = new FormData()

        if (file instanceof File) {
          formData.append(fieldName, file)
        } else {
          const defaultExtension = determineExtension(file.type)
          const defaultName = options.filename ?? `image-${Date.now()}.${defaultExtension}`

          formData.append(fieldName, file, defaultName)
        }

        if (options.extraFields) {
          for (const [key, value] of Object.entries(options.extraFields)) {
            formData.append(key, value)
          }
        }

        const store = useAuthStore.getState()
        let accessToken = store.accessToken

        if (!accessToken && store.refreshTokens) {
          const refreshed = await store.refreshTokens()

          if (refreshed) {
            accessToken = useAuthStore.getState().accessToken
          }
        }

        if (!accessToken) {
          throw new Error('이미지 업로드를 위해서는 로그인이 필요합니다.')
        }

        const response = await new Promise<Response>((resolve, reject) => {
          const xhr = new XMLHttpRequest()

          xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentage = Math.round((event.loaded * 100) / event.total)

            setProgress(percentage)
          }
        })

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(
                new Response(xhr.responseText, {
                  status: xhr.status,
                  statusText: xhr.statusText,
                })
              )
            } else {
              try {
                const parsed = JSON.parse(xhr.responseText)
                const message =
                  parsed?.message ?? parsed?.error?.message ?? xhr.statusText

                reject(new Error(message))
              } catch {
                reject(new Error(xhr.statusText || '업로드 실패'))
              }
            }
          })

          xhr.addEventListener('error', () => {
            reject(new Error('네트워크 오류가 발생했습니다.'))
          })

          xhr.addEventListener('timeout', () => {
            reject(new Error('업로드 시간이 초과되었습니다.'))
          })

          xhr.open('POST', uploadUrl)
          xhr.timeout = 60000
          xhr.withCredentials = true
          xhr.setRequestHeader('Accept', 'application/json')

          if (accessToken) {
            xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`)
          }

          xhr.send(formData)
        })

        const data = await response.json()

        if (!data?.success) {
          throw new Error(data?.message ?? '이미지 업로드에 실패했습니다.')
        }

        const url: string | undefined = data?.data?.url ?? data?.profileImage

        if (!url || typeof url !== 'string' || url.trim() === '') {
          throw new Error('업로드된 이미지 URL을 받을 수 없습니다.')
        }

        // URL 형식 검증
        try {
          new URL(url)
        } catch {
          throw new Error('업로드된 이미지 URL 형식이 올바르지 않습니다.')
        }

        setProgress(100)

        return url
      } catch (err: unknown) {
        const message = (err instanceof Error ? err.message : null) ?? '이미지 업로드에 실패했습니다.'

        setError(message)
        console.error('Image upload error:', err)
        throw new Error(message)
      } finally {
        setIsUploading(false)
        setTimeout(() => setProgress(undefined), 1000)
      }
    },
    [],
  )

  const uploadImage = useCallback(
    async (file: Blob | File, options?: UploadOptions): Promise<string> =>
      uploadFile(file, options),
    [uploadFile]
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

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

function determineExtension(mimeType: string | undefined): string {
  if (!mimeType) {
    return 'webp'
  }

  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
    return 'jpg'
  }

  if (mimeType.includes('png')) {
    return 'png'
  }

  if (mimeType.includes('gif')) {
    return 'gif'
  }

  if (mimeType.includes('webp')) {
    return 'webp'
  }

  return 'webp'
}

/**
 * 프로필 이미지 업로드 전용 훅
 * 크기 제한 및 아바타 전용 API 연동
 */
export function useProfileImageUpload() {
  const baseUpload = useImageUpload()
  const { uploadImage, ...rest } = baseUpload

  const uploadProfileImage = useCallback(
    async (file: Blob | File): Promise<string> => {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('프로필 이미지는 5MB 이하로 업로드해주세요.')
      }

      const { user } = useAuthStore.getState()

      if (!user?.userid) {
        throw new Error('프로필 이미지를 업로드하려면 로그인이 필요합니다.')
      }

      const profileUrl = await uploadImage(file, {
        endpoint: `/api/users/${user.userid}/avatar`,
        fieldName: 'image',
        filename: 'avatar.webp',
        extraFields: {
          x: '0',
          y: '0',
          width: '400',
          height: '400',
        },
      })

      return profileUrl
    },
    [uploadImage]
  )

  return {
    uploadImage,
    ...rest,
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
  const validateImage = useCallback((file: File): string[] => {
    const errors: string[] = []

    if (file.size > 10 * 1024 * 1024) {
      errors.push('이미지 크기는 10MB 이하로 선택해주세요.')
    }

    if (!file.type.startsWith('image/')) {
      errors.push('이미지 파일만 선택 가능합니다.')
    }

    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

    if (!supportedTypes.includes(file.type)) {
      errors.push('JPEG, PNG, GIF, WebP 형식만 지원됩니다.')
    }

    return errors
  }, [])

  const validateProfileImage = useCallback((file: File): string[] => {
    const errors: string[] = []

    if (file.size > 5 * 1024 * 1024) {
      errors.push('프로필 이미지는 5MB 이하로 선택해주세요.')
    }

    if (!file.type.startsWith('image/')) {
      errors.push('이미지 파일만 선택 가능합니다.')
    }

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
