import { useMemo } from 'react';
import DOMPurify from 'dompurify';

interface SafeHtmlRendererProps {
  content: string;
  className?: string;
  maxLength?: number;
  showTruncated?: boolean;
}

/**
 * 안전한 HTML 렌더링 컴포넌트
 * DOMPurify를 사용하여 XSS 공격을 방지하면서 HTML을 렌더링합니다.
 */
export const SafeHtmlRenderer = ({
  content,
  className,
  maxLength,
  showTruncated = true,
}: SafeHtmlRendererProps) => {
  const sanitizedHtml = useMemo(() => {
    if (!content) return '';

    // DOMPurify 설정: 안전한 HTML 태그만 허용
    const config = {
      ALLOWED_TAGS: [
        'p',
        'br',
        'strong',
        'em',
        'u',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'ul',
        'ol',
        'li',
        'blockquote',
        'code',
        'pre',
      ],
      ALLOWED_ATTR: [],
      FORBID_ATTR: ['style', 'class', 'id', 'onclick', 'onload', 'onerror'],
      FORBID_TAGS: ['script', 'object', 'embed', 'link', 'style', 'iframe'],
      KEEP_CONTENT: true,
    };

    let cleanContent = DOMPurify.sanitize(content, config);

    // 길이 제한이 있고 텍스트가 더 긴 경우 truncate
    if (maxLength && showTruncated) {
      // HTML 태그를 제거하고 순수 텍스트 길이 계산
      const textContent = cleanContent.replace(/<[^>]*>/g, '');
      if (textContent.length > maxLength) {
        // HTML을 유지하면서 텍스트 길이 기준으로 자르기
        cleanContent = truncateHtml(cleanContent, maxLength) + '...';
      }
    }

    return cleanContent;
  }, [content, maxLength, showTruncated]);

  if (!sanitizedHtml) {
    return null;
  }

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};

/**
 * HTML을 유지하면서 텍스트 길이 기준으로 자르는 함수
 */
function truncateHtml(html: string, maxLength: number): string {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  let currentLength = 0;
  const result: string[] = [];

  function processNode(node: Node): boolean {
    if (currentLength >= maxLength) return false;

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      const remainingLength = maxLength - currentLength;

      if (text.length <= remainingLength) {
        result.push(text);
        currentLength += text.length;
      } else {
        result.push(text.substring(0, remainingLength));
        currentLength = maxLength;
        return false;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();

      result.push(`<${tagName}>`);

      for (const child of Array.from(element.childNodes)) {
        if (!processNode(child)) break;
      }

      result.push(`</${tagName}>`);
    }

    return true;
  }

  for (const child of Array.from(tempDiv.childNodes)) {
    if (!processNode(child)) break;
  }

  return result.join('');
}

export default SafeHtmlRenderer;
