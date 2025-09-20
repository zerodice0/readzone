/**
 * HTML 태그 처리 유틸리티
 * 마크다운과 HTML을 포함한 텍스트에서 태그를 제거하고 순수 텍스트를 반환합니다.
 */

/**
 * HTML 태그와 마크다운 문법을 제거하고 순수 텍스트를 반환합니다.
 * @param text HTML/마크다운 태그가 포함된 텍스트
 * @returns 순수 텍스트
 */
export function stripHtmlTags(text: string): string {
  if (!text) {
    return '';
  }

  // 1. HTML 태그 제거 (<tag>, </tag>, <tag/>, <tag attr="value">)
  let cleanText = text.replace(/<[^>]*>/g, '');

  // 2. 마크다운 문법 제거
  // 헤딩 (#, ##, ###, ####, #####, ######)
  cleanText = cleanText.replace(/^#{1,6}\s+/gm, '');

  // 볼드 (**text** 또는 __text__)
  cleanText = cleanText.replace(/\*\*(.*?)\*\*/g, '$1');
  cleanText = cleanText.replace(/__(.*?)__/g, '$1');

  // 이탤릭 (*text* 또는 _text_)
  cleanText = cleanText.replace(/\*(.*?)\*/g, '$1');
  cleanText = cleanText.replace(/_(.*?)_/g, '$1');

  // 인라인 코드 (`code`)
  cleanText = cleanText.replace(/`([^`]+)`/g, '$1');

  // 코드 블록 (```code```)
  cleanText = cleanText.replace(/```[\s\S]*?```/g, '');

  // 링크 ([text](url) 또는 [text][ref])
  cleanText = cleanText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  cleanText = cleanText.replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1');

  // 이미지 (![alt](url))
  cleanText = cleanText.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

  // 인용문 (> text)
  cleanText = cleanText.replace(/^>\s+/gm, '');

  // 리스트 (- item, * item, + item, 1. item)
  cleanText = cleanText.replace(/^[\s]*[-*+]\s+/gm, '');
  cleanText = cleanText.replace(/^[\s]*\d+\.\s+/gm, '');

  // 수평선 (---, ***, ___)
  cleanText = cleanText.replace(/^[-*_]{3,}$/gm, '');

  // 3. HTML 엔티티 디코딩
  const htmlEntities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
  };

  Object.entries(htmlEntities).forEach(([entity, char]) => {
    cleanText = cleanText.replace(new RegExp(entity, 'g'), char);
  });

  // 4. 연속된 공백과 줄바꿈을 정리
  cleanText = cleanText.replace(/\s+/g, ' ');
  cleanText = cleanText.replace(/\n\s*\n/g, '\n');

  // 5. 앞뒤 공백 제거
  cleanText = cleanText.trim();

  return cleanText;
}

/**
 * 텍스트를 지정된 길이로 자르고 필요시 suffix를 추가합니다.
 * @param text 자를 텍스트
 * @param maxLength 최대 길이
 * @param suffix 초과시 추가할 문자열 (기본값: '...')
 * @returns 잘린 텍스트
 */
export function truncateText(
  text: string,
  maxLength: number,
  suffix = '...',
): string {
  if (!text || text.length <= maxLength) {
    return text;
  }

  // 잘린 텍스트의 마지막이 공백인 경우를 처리
  const truncated = text.substring(0, maxLength).trim();

  return truncated + suffix;
}

/**
 * HTML/마크다운 텍스트를 순수 텍스트로 변환하고 지정된 길이로 자릅니다.
 * @param htmlText HTML/마크다운이 포함된 텍스트
 * @param maxLength 최대 길이
 * @param suffix 초과시 추가할 문자열 (기본값: '...')
 * @returns 정제되고 잘린 텍스트
 */
export function stripAndTruncate(
  htmlText: string,
  maxLength: number,
  suffix = '...',
): string {
  const cleanText = stripHtmlTags(htmlText);
  return truncateText(cleanText, maxLength, suffix);
}
