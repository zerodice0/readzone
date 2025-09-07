import React, { useEffect, useRef, useState } from 'react';
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Italic,
  Link,
  List,
  Quote,
  Strikethrough,
} from 'lucide-react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import {
  $createHeadingNode,
  $createQuoteNode,
  type HeadingTagType,
} from '@lexical/rich-text';
import { INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';

interface ToolbarButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  onClick: () => void;
  isActive?: boolean;
  className?: string;
}

function ToolbarButton({
  icon: Icon,
  title,
  onClick,
  isActive = false,
  className = '',
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`
        p-1.5 rounded hover:bg-muted/80 transition-colors border-0 bg-transparent
        ${isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}
        ${className}
      `}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

interface Position {
  x: number;
  y: number;
}

export default function FloatingToolbar() {
  const [editor] = useLexicalComposerContext();
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [formatStates, setFormatStates] = useState({
    bold: false,
    italic: false,
    strikethrough: false,
    code: false,
  });
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateToolbar = () => {
      const selection = $getSelection();

      if ($isRangeSelection(selection) && !selection.isCollapsed()) {
        const anchorNode = selection.anchor.getNode();
        const element = editor.getElementByKey(anchorNode.getKey());

        if (element) {
          const domSelection = window.getSelection();

          if (domSelection && domSelection.rangeCount > 0) {
            const range = domSelection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const toolbarHeight = 40;
            const toolbarWidth = 320;

            let x = rect.left + rect.width / 2 - toolbarWidth / 2;
            let y = rect.top - toolbarHeight - 10;

            // 화면 경계 확인 및 조정
            if (x < 10) {
              x = 10;
            }
            if (x + toolbarWidth > window.innerWidth - 10) {
              x = window.innerWidth - toolbarWidth - 10;
            }
            if (y < 10) {
              y = rect.bottom + 10;
            }

            setPosition({ x, y });
            setIsVisible(true);

            // 포맷 상태 업데이트
            setFormatStates({
              bold: selection.hasFormat('bold'),
              italic: selection.hasFormat('italic'),
              strikethrough: selection.hasFormat('strikethrough'),
              code: selection.hasFormat('code'),
            });
          }
        }
      } else {
        setIsVisible(false);
      }
    };

    const removeUpdateListener = editor.registerUpdateListener(() => {
      editor.getEditorState().read(updateToolbar);
    });

    const removeSelectionListener = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        editor.getEditorState().read(updateToolbar);

        return false;
      },
      COMMAND_PRIORITY_LOW
    );

    return () => {
      removeUpdateListener();
      removeSelectionListener();
    };
  }, [editor]);

  // 클릭 외부 영역 처리
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(event.target as Node)
      ) {
        const selection = window.getSelection();

        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);

          if (range.collapsed) {
            setIsVisible(false);
          }
        }
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);

      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }

    return undefined;
  }, [isVisible]);

  const formatText = (format: 'bold' | 'italic' | 'strikethrough' | 'code') => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const setBlockType = (type: 'h1' | 'h2' | 'quote' | 'paragraph') => {
    editor.update(() => {
      const selection = $getSelection();

      if ($isRangeSelection(selection)) {
        if (type === 'h1' || type === 'h2') {
          $setBlocksType(selection, () =>
            $createHeadingNode(type as HeadingTagType)
          );
        } else if (type === 'quote') {
          $setBlocksType(selection, () => $createQuoteNode());
        }
      }
    });
  };

  const insertList = () => {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
  };

  const createLink = () => {
    // 대화형 링크 생성 대신 사용자에게 마크다운 형식 안내
    const selection = window.getSelection();
    const selectedText = selection?.toString() ?? '';
    const linkText = `[${selectedText || '링크 텍스트'}](URL을 여기에 입력)`;

    editor.update(() => {
      const editorSelection = $getSelection();

      if ($isRangeSelection(editorSelection)) {
        editorSelection.insertText(linkText);
      }
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 bg-background border shadow-lg rounded-md p-1 flex items-center gap-0.5"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <ToolbarButton
        icon={Bold}
        title="굵게 (Ctrl+B)"
        onClick={() => formatText('bold')}
        isActive={formatStates.bold}
      />
      <ToolbarButton
        icon={Italic}
        title="기울임 (Ctrl+I)"
        onClick={() => formatText('italic')}
        isActive={formatStates.italic}
      />
      <ToolbarButton
        icon={Strikethrough}
        title="취소선"
        onClick={() => formatText('strikethrough')}
        isActive={formatStates.strikethrough}
      />
      <ToolbarButton
        icon={Code}
        title="인라인 코드"
        onClick={() => formatText('code')}
        isActive={formatStates.code}
      />

      <div className="w-px h-5 bg-border mx-1" />

      <ToolbarButton
        icon={Heading1}
        title="큰 제목"
        onClick={() => setBlockType('h1')}
      />
      <ToolbarButton
        icon={Heading2}
        title="중간 제목"
        onClick={() => setBlockType('h2')}
      />
      <ToolbarButton
        icon={Quote}
        title="인용"
        onClick={() => setBlockType('quote')}
      />
      <ToolbarButton icon={List} title="목록" onClick={insertList} />
      <ToolbarButton icon={Link} title="링크" onClick={createLink} />
    </div>
  );
}
