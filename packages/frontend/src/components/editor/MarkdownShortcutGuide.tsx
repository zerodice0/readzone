import { useState } from 'react';
import { ChevronDown, ChevronUp, Keyboard } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface ShortcutItem {
  syntax: string;
  description: string;
  example: string;
}

const SHORTCUTS: ShortcutItem[] = [
  { syntax: '**텍스트**', description: '굵게', example: '굵은 글씨' },
  { syntax: '*텍스트*', description: '기울임', example: '기울어진 글씨' },
  { syntax: '~~텍스트~~', description: '취소선', example: '취소된 글씨' },
  { syntax: '`코드`', description: '인라인 코드', example: 'console.log()' },
  { syntax: '```', description: '코드 블록', example: '여러 줄 코드' },
  { syntax: '# 제목', description: '제목 1 (가장 큰 제목)', example: '메인 제목' },
  { syntax: '## 제목', description: '제목 2', example: '중간 제목' },
  { syntax: '### 제목', description: '제목 3', example: '작은 제목' },
  { syntax: '> 인용문', description: '인용 블록', example: '인용된 텍스트' },
  { syntax: '- 항목', description: '목록 (불릿)', example: '첫 번째 항목' },
  { syntax: '1. 항목', description: '번호 목록', example: '첫 번째 항목' },
  { syntax: '[링크](URL)', description: '링크', example: '[구글](https://google.com)' },
  { syntax: '---', description: '수평선', example: '구분선' },
];

export default function MarkdownShortcutGuide() {
  const [isVisible, setIsVisible] = useLocalStorage('editor-shortcut-guide-visible', false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible) {
    return (
      <div className="border-b bg-muted/20">
        <button
          type="button"
          onClick={() => setIsVisible(true)}
          className="w-full px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted/50 transition-colors flex items-center gap-2"
        >
          <Keyboard className="h-4 w-4" />
          마크다운 단축키 보기
        </button>
      </div>
    );
  }

  return (
    <div className="border-b bg-muted/20">
      <div className="flex items-center justify-between px-3 py-2">
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-foreground/80 transition-colors"
        >
          <Keyboard className="h-4 w-4" />
          마크다운 단축키
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          숨기기
        </button>
      </div>

      {!isCollapsed && (
        <div className="px-3 pb-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            {SHORTCUTS.map((shortcut, index) => (
              <div
                key={index}
                className="bg-background/50 rounded p-2 border"
              >
                <div className="font-mono font-semibold text-blue-600 dark:text-blue-400 mb-1">
                  {shortcut.syntax}
                </div>
                <div className="text-muted-foreground mb-1">
                  {shortcut.description}
                </div>
                <div className="text-xs text-muted-foreground/70 italic">
                  예: {shortcut.example}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
            💡 팁: 텍스트를 선택한 후 단축키를 입력하면 선택된 텍스트에 서식이 적용됩니다.
          </div>
        </div>
      )}
    </div>
  );
}
