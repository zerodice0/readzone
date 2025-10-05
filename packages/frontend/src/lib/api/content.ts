interface ContentMetadata {
  title: string
  type: 'terms-of-service' | 'privacy-policy'
  version: string
  effectiveDate: string
  lastModified: string
  language: string
  previousVersions: string[]
  changeLog: {
    version: string
    date: string
    changes: string[]
    author: string
  }[]
  nextReviewDate: string
  isActive: boolean
  legalBasis: string
  contentPath: string
}

interface ContentResponse {
  metadata: ContentMetadata
  content: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

const API_BASE_URL = import.meta.env.MODE === 'development'
  ? 'http://localhost:4001'
  : ''

/**
 * 서비스 이용약관 조회
 */
export async function getTermsContent(version?: string): Promise<ContentResponse | undefined> {
  const url = new URL(`${API_BASE_URL}/api/content/terms`)
  
  if (version) {
    url.searchParams.set('version', version)
  }

  const response = await fetch(url.toString())
  
  if (!response.ok) {
    throw new Error(`Failed to fetch terms content: ${response.status} ${response.statusText}`)
  }

  const result: ApiResponse<ContentResponse> = await response.json()
  
  if (!result.success && !result.data) {
    throw new Error(result.error ?? 'Failed to fetch terms content')
  }

  return result.data
}

/**
 * 개인정보 처리방침 조회
 */
export async function getPrivacyContent(version?: string): Promise<ContentResponse | undefined> {
  const url = new URL(`${API_BASE_URL}/api/content/privacy`)

  if (version) {
    url.searchParams.set('version', version)
  }

  const response = await fetch(url.toString())
  
  if (!response.ok) {
    throw new Error(`Failed to fetch privacy content: ${response.status} ${response.statusText}`)
  }

  const result: ApiResponse<ContentResponse> = await response.json()
  
  if (!result.success && !result.data) {
    throw new Error(result.error ?? 'Failed to fetch privacy content')
  }

  return result.data
}

/**
 * 콘텐츠 조회 (통합)
 */
export async function getContent(type: 'terms' | 'privacy', version?: string): Promise<ContentResponse | undefined> {
  return type === 'terms' 
    ? getTermsContent(version)
    : getPrivacyContent(version)
}

/**
 * 특정 타입의 최신 버전 조회
 */
export async function getLatestVersion(type: 'terms' | 'privacy'): Promise<string | undefined> {
  const response = await fetch(`${API_BASE_URL}/api/content/${type}/version`)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${type} version`)
  }

  const result: ApiResponse<{ version: string }> = await response.json()
  
  if (!result.success && !result.data) {
    throw new Error(result.error ?? `Failed to fetch ${type} version`)
  }

  return result.data?.version
}

/**
 * 버전 히스토리 조회
 */
export async function getVersionHistory(type: 'terms' | 'privacy'): Promise<ContentMetadata['changeLog'] | undefined> {
  const response = await fetch(`${API_BASE_URL}/api/content/${type}/history`)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${type} history`)
  }

  const result: ApiResponse<{ history: ContentMetadata['changeLog'] }> = await response.json()
  
  if (!result.success && !result.data) {
    throw new Error(result.error ?? `Failed to fetch ${type} history`)
  }

  return result.data?.history
}

export type { ContentResponse, ContentMetadata }