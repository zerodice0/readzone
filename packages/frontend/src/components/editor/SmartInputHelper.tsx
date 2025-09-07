import { useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { Lightbulb, X } from 'lucide-react';

interface HintType {
  type: 'heading' | 'quote' | 'list' | 'code' | 'link';
  message: string;
  example?: string;
}

const HINTS: Record<string, HintType> = {
  '#': {
    type: 'heading',
    message: '제목을 작성 중입니다',
    example: '# 제목1, ## 제목2, ### 제목3',
  },
  '>': {
    type: 'quote',
    message: '인용문을 작성 중입니다',
    example: 'Enter로 계속 작성하거나 한 번 더 Enter로 종료',
  },
  '-': {
    type: 'list',
    message: '목록을 작성 중입니다',
    example: 'Enter로 새 항목, Tab으로 들여쓰기',
  },
  '*': {
    type: 'list',
    message: '목록을 작성 중입니다',
    example: 'Enter로 새 항목, Tab으로 들여쓰기',
  },
  '```': {
    type: 'code',
    message: '코드 블록을 작성 중입니다',
    example: '언어명을 추가할 수 있습니다 (예: ```javascript)',
  },
  '[': {
    type: 'link',
    message: '링크를 작성 중입니다',
    example: '[텍스트](URL) 형태로 작성하세요',
  },
};

export default function SmartInputHelper() {
  const [editor] = useLexicalComposerContext();
  const [currentHint, setCurrentHint] = useState<HintType | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [, setCurrentLine] = useState('');

  useEffect(() => {
    const updateHint = () => {
      const selection = $getSelection();

      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const textContent = anchorNode.getTextContent();
        const offset = selection.anchor.offset;

        // 현재 줄의 시작부터 커서까지의 텍스트 추출
        const lines = textContent.split('\n');
        let currentLineIndex = 0;
        let charCount = 0;

        for (let i = 0; i < lines.length; i++) {
          if (charCount + (lines[i]?.length ?? 0) >= offset) {
            currentLineIndex = i;

            break;
          }
          charCount += (lines[i]?.length ?? 0) + 1; // +1 for newline
        }

        const line = lines[currentLineIndex] ?? '';

        setCurrentLine(line);

        // 힌트 검사
        let hint: HintType | null = null;

        if (line.match(/^#{1,3}\s/)) {
          hint = HINTS['#'] ?? null;
        } else if (line.startsWith('> ')) {
          hint = HINTS['>'] ?? null;
        } else if (line.match(/^[-*]\s/)) {
          hint = HINTS['-'] ?? null;
        } else if (line.startsWith('```')) {
          hint = HINTS['```'] ?? null;
        } else if (line.includes('[') && !line.includes('](')) {
          hint = HINTS['['] ?? null;
        }

        setCurrentHint(hint);
      }
    };

    const removeUpdateListener = editor.registerUpdateListener(() => {
      editor.getEditorState().read(updateHint);
    });

    const removeSelectionListener = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        editor.getEditorState().read(updateHint);

        return false;
      },
      COMMAND_PRIORITY_LOW
    );

    return () => {
      removeUpdateListener();
      removeSelectionListener();
    };
  }, [editor]);

  if (!currentHint || !isVisible) {
    return null;
  }

  const getHintColor = (type: HintType['type']) => {
    switch (type) {
      case 'heading':
        return 'text-blue-600 dark:text-blue-400';
      case 'quote':
        return 'text-purple-600 dark:text-purple-400';
      case 'list':
        return 'text-green-600 dark:text-green-400';
      case 'code':
        return 'text-orange-600 dark:text-orange-400';
      case 'link':
        return 'text-indigo-600 dark:text-indigo-400';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="mx-3 mb-2">
      <div className="flex items-start gap-2 p-2 bg-muted/30 rounded-md border-l-2 border-current text-sm">
        <Lightbulb
          className={`h-4 w-4 mt-0.5 flex-shrink-0 ${getHintColor(currentHint.type)}`}
        />
        <div className="flex-1 min-w-0">
          <div className={`font-medium ${getHintColor(currentHint.type)}`}>
            {currentHint.message}
          </div>
          {currentHint.example && (
            <div className="text-xs text-muted-foreground mt-1">
              💡 {currentHint.example}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="text-muted-foreground hover:text-foreground p-0.5 rounded"
          title="힌트 숨기기"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
