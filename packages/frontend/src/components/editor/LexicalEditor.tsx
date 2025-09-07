import { type ChangeEvent, useEffect, useMemo, useRef } from 'react';

import { $generateHtmlFromNodes } from '@lexical/html';
import { CodeNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import {
  $createParagraphNode,
  $getRoot,
  $insertNodes,
  COMMAND_PRIORITY_LOW,
  DROP_COMMAND,
  type EditorState,
  PASTE_COMMAND,
} from 'lexical';

import { $createImageNode, ImageNode } from './nodes/ImageNode';
import MarkdownShortcutGuide from './MarkdownShortcutGuide';
import FloatingToolbar from './FloatingToolbar';
import SmartInputHelper from './SmartInputHelper';
import { useEditorPreferences } from '../../hooks/useEditorPreferences';

interface Props {
  initialJson?: string;
  placeholder?: string;
  onChange: (html: string, json: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
}

const theme = {
  paragraph: 'mb-2',
  heading: {
    h1: 'text-2xl font-bold my-2',
    h2: 'text-xl font-bold my-2',
    h3: 'text-lg font-semibold my-2',
  },
  quote: 'border-l-4 pl-3 text-muted-foreground my-2',
  list: {
    ul: 'list-disc ml-5',
    ol: 'list-decimal ml-5',
    listitem: 'my-1',
  },
  link: 'text-blue-600 underline',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    code: 'bg-muted px-1 py-0.5 rounded text-sm',
  },
};

function ImageUploadPlugin({
  onUpload,
}: {
  onUpload?: (file: File) => Promise<string>;
}) {
  const [editor] = useLexicalComposerContext();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const onClick = () => inputRef.current?.click();

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];

    if (!f || !onUpload) {
      return;
    }

    try {
      const url = await onUpload(f);

      editor.update(() => {
        const node = $createImageNode({ src: url, alt: f.name });

        $insertNodes([node]);
      });
    } catch (err) {
      console.error(err instanceof Error ? err.message : '이미지 업로드 실패');
    } finally {
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <div className="p-2 border-b">
      <button
        type="button"
        className="px-2 py-1 text-sm border rounded"
        onClick={onClick}
      >
        이미지 업로드
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
      />
    </div>
  );
}
function PasteDropImagePlugin({
  onUpload,
}: {
  onUpload?: (file: File) => Promise<string>;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!onUpload) {
      return;
    }

    const removePaste = editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const items = event.clipboardData?.items;

        if (!items) {
          return false;
        }

        const images: File[] = [];

        for (const it of items) {
          if (it.type.startsWith('image/')) {
            const f = it.getAsFile();

            if (f) {
              images.push(f);
            }
          }
        }

        if (images.length === 0) {
          return false;
        }

        event.preventDefault();
        (async () => {
          for (const f of images) {
            try {
              const url = await onUpload(f);

              editor.update(() => {
                const node = $createImageNode({ src: url, alt: f.name });

                $insertNodes([node]);
              });
            } catch (e) {
              console.error(
                e instanceof Error ? e.message : '이미지 업로드 실패'
              );
            }
          }
        })();

        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    const removeDrop = editor.registerCommand(
      DROP_COMMAND,
      (event: DragEvent) => {
        const files = event.dataTransfer?.files;

        if (!files || files.length === 0) {
          return false;
        }

        const images = Array.from(files).filter((f) =>
          f.type.startsWith('image/')
        );

        if (images.length === 0) {
          return false;
        }

        event.preventDefault();
        (async () => {
          for (const f of images) {
            try {
              const url = await onUpload(f);

              editor.update(() => {
                const node = $createImageNode({ src: url, alt: f.name });

                $insertNodes([node]);
              });
            } catch (e) {
              console.error(
                e instanceof Error ? e.message : '이미지 업로드 실패'
              );
            }
          }
        })();

        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    return () => {
      removePaste();
      removeDrop();
    };
  }, [editor, onUpload]);

  return null;
}

export default function LexicalEditor({
  initialJson,
  placeholder,
  onChange,
  onImageUpload,
}: Props) {
  const { preferences } = useEditorPreferences();
  const editorStateFromJson = useMemo(() => initialJson ?? '', [initialJson]);

  const initialConfig = useMemo(
    () => ({
      namespace: 'readzone-editor',
      theme,
      onError: (e: unknown) => {
        console.error('Lexical error', e);
      },
      nodes: [
        HeadingNode,
        QuoteNode,
        ListNode,
        ListItemNode,
        CodeNode,
        LinkNode,
        ImageNode,
        HorizontalRuleNode,
      ],
      editable: true,
      editorState: (editor: unknown) => {
        const ed = editor as {
          setEditorState: (state: unknown) => void;
          parseEditorState: (json: unknown) => unknown;
          update: (callback: () => void) => void;
        };

        if (editorStateFromJson) {
          try {
            const parsed = JSON.parse(editorStateFromJson);

            ed.setEditorState(ed.parseEditorState(parsed));

            return;
          } catch {
            // fall through to empty
          }
        }

        ed.update(() => {
          const root = $getRoot();

          if (root.getFirstChild() === null) {
            root.append($createParagraphNode());
          }
        });
      },
    }),
    [editorStateFromJson]
  );

  const handleChange = (editorState: EditorState, editor: unknown) => {
    let json = '{}';
    let html = '';

    try {
      json = JSON.stringify(editorState.toJSON());
    } catch {
      // Ignore JSON stringify errors
    }

    editorState.read(() => {
      try {
        html = $generateHtmlFromNodes(
          editor as unknown as Parameters<typeof $generateHtmlFromNodes>[0]
        );
      } catch {
        html = '';
      }
    });

    onChange(html, json);
  };

  useEffect(() => {
    // no-op; placeholder for future plugins side-effects
  }, []);

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="border rounded-md relative">
        <div className="px-3 py-2 border-b text-sm text-muted-foreground">
          글을 자유롭게 작성하세요. **굵게**, *기울임*, # 제목 등 마크다운
          문법을 지원합니다.
        </div>

        <MarkdownShortcutGuide />

        {onImageUpload && <ImageUploadPlugin onUpload={onImageUpload} />}
        {onImageUpload && <PasteDropImagePlugin onUpload={onImageUpload} />}

        <div className="min-h-[240px] max-h-[60vh] overflow-y-auto">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="px-4 py-3 outline-none min-h-[240px]" />
            }
            placeholder={
              <div className="px-4 py-3 text-muted-foreground">
                {placeholder ?? '내용을 입력해 주세요...'}
              </div>
            }
            ErrorBoundary={
              LexicalErrorBoundary as unknown as Parameters<
                typeof RichTextPlugin
              >[0]['ErrorBoundary']
            }
          />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <AutoFocusPlugin />
          <MarkdownShortcutPlugin />
          <OnChangePlugin onChange={handleChange} />
        </div>

        {preferences.showSmartHelper && <SmartInputHelper />}
        {preferences.showFloatingToolbar && <FloatingToolbar />}
      </div>
    </LexicalComposer>
  );
}
