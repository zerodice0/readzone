import { useAutosave, type UseAutosaveOptions, type UseAutosaveReturn } from './use-autosave'

/**
 * HTML 콘텐츠 특화 자동저장 훅
 * React Quill 등 WYSIWYG 에디터의 HTML 콘텐츠 저장에 최적화
 */

/**
 * HTML 콘텐츠를 위한 자동저장 옵션
 */
export interface UseHtmlAutosaveOptions<T> extends Omit<UseAutosaveOptions<T>, 'isEqual'> {
  /** HTML 내용의 실제 텍스트가 변경되었을 때만 저장할지 여부 (기본: false) */
  compareTextOnly?: boolean
  /** 자동저장을 트리거할 최소 텍스트 길이 (기본: 10) */
  minTextLength?: number
}

/**
 * HTML을 텍스트로 변환하는 유틸리티 함수
 */
function htmlToText(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

/**
 * HTML 콘텐츠 비교 함수
 * 공백과 스타일링 차이를 무시하고 실제 의미있는 변경만 감지
 */
function compareHtmlContent(a: string, b: string): boolean {
  // 기본 문자열 비교
  if (a === b) return true
  
  // HTML을 정규화하여 비교
  const normalize = (html: string) => 
    html
      .replace(/\s+/g, ' ')           // 연속 공백을 하나로
      .replace(/>\s+</g, '><')        // 태그 사이 공백 제거
      .trim()

  return normalize(a) === normalize(b)
}

/**
 * HTML 콘텐츠 특화 자동저장 훅
 * 
 * @example
 * ```tsx
 * // React Quill과 함께 사용
 * const { save, status, lastSaved } = useHtmlAutosave({
 *   key: 'review-draft',
 *   data: { title, content }, // content는 HTML 문자열
 *   compareTextOnly: true,    // 실제 텍스트 변경 시만 저장
 *   minTextLength: 10,        // 10자 이상일 때만 저장
 *   onSave: async (data) => {
 *     await api.saveDraft(data)
 *   }
 * })
 * ```
 */
export function useHtmlAutosave<T extends { content?: string }>({
  compareTextOnly = false,
  minTextLength = 10,
  onSave: originalOnSave,
  ...options
}: UseHtmlAutosaveOptions<T>): UseAutosaveReturn<T> {
  
  // HTML 콘텐츠 비교 로직
  const isEqual = ((a: T, b: T) => {
    if (compareTextOnly && a.content && b.content) {
      // 실제 텍스트만 비교
      const textA = htmlToText(a.content)
      const textB = htmlToText(b.content)
      
      // 텍스트가 같으면 변경 없음으로 간주
      if (textA === textB) return true
      
      // 나머지 필드들도 비교
      const { content: _, ...restA } = a
      const { content: __, ...restB } = b
      return JSON.stringify(restA) === JSON.stringify(restB) && textA === textB
    }
    
    // HTML 정규화 비교
    if (a.content && b.content) {
      const contentEqual = compareHtmlContent(a.content, b.content)
      if (!contentEqual) return false
      
      // 나머지 필드들 비교
      const { content: _, ...restA } = a
      const { content: __, ...restB } = b
      return JSON.stringify(restA) === JSON.stringify(restB)
    }
    
    // 기본 JSON 비교
    return JSON.stringify(a) === JSON.stringify(b)
  })

  // 최소 길이 체크를 포함한 저장 함수
  const onSave = originalOnSave ? async (data: T) => {
    // 최소 길이 체크
    if (data.content) {
      const textLength = htmlToText(data.content).length
      if (textLength < minTextLength) {
        console.log(`HTML content too short (${textLength} < ${minTextLength}), skipping save`)
        return
      }
    }
    
    await originalOnSave(data)
  } : undefined

  return useAutosave({
    ...options,
    isEqual,
    onSave
  })
}

export default useHtmlAutosave