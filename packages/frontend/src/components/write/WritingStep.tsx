import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LexicalEditor from '@/components/editor/LexicalEditor';
import { useDebounced } from '@/hooks/useDebounced';
import useWriteStore from '@/store/writeStore';
import { TagInput } from './TagInput';

export function WritingStep() {
  const navigate = useNavigate();
  const {
    selectedBook,
    title,
    isRecommended,
    tags,
    visibility,
    contentJson,
    isSaving,
    lastSavedAt,
    hasUnsavedChanges,
  } = useWriteStore();

  const setTitle = useWriteStore((s) => s.setTitle);
  const setRecommended = useWriteStore((s) => s.setRecommended);
  const setTags = useWriteStore((s) => s.setTags);
  const setVisibility = useWriteStore((s) => s.setVisibility);
  const setContent = useWriteStore((s) => s.setContent);
  const saveDraft = useWriteStore((s) => s.saveDraft);
  const publish = useWriteStore((s) => s.publish);

  // Debounced save when content/title/tags/visibility change
  useDebounced(
    () => {
      if (hasUnsavedChanges) {
        void saveDraft();
      }
    },
    2000,
    [title, isRecommended, tags.join(','), visibility, contentJson]
  );

  // 30s periodic save
  useEffect(() => {
    const id = setInterval(() => {
      if (hasUnsavedChanges) {
        void saveDraft();
      }
    }, 30000);

    return () => clearInterval(id);
  }, [hasUnsavedChanges, saveDraft]);

  // beforeunload protection
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handler);

    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  const onPublish = async () => {
    try {
      const id = await publish();

      navigate({ to: `/review/${id}` });
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(e instanceof Error ? e.message : '게시 중 오류가 발생했습니다');
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-3 border rounded bg-muted/30">
        <div className="font-medium">선택된 도서</div>
        {selectedBook ? (
          <div className="text-sm text-muted-foreground">
            {selectedBook.title} · {selectedBook.author}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            도서가 선택되지 않았습니다
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">제목</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="독후감 제목"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">내용</label>
        <LexicalEditor
          initialJson={contentJson}
          onChange={(html, json) => setContent(html, json)}
          onImageUpload={async (file) => {
            const url = await useWriteStore.getState().uploadImage(file);

            return url;
          }}
          placeholder="내용을 입력해 주세요..."
        />
        <div className="text-xs text-muted-foreground">
          {isSaving
            ? '저장 중…'
            : lastSavedAt
              ? `저장됨 • ${new Date(lastSavedAt).toLocaleTimeString()}`
              : '초안 저장 전'}
        </div>
      </div>

      <TagInput tags={tags} onTagsChange={setTags} />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">추천 여부</label>
          <div className="flex items-center gap-2">
            <Button
              variant={isRecommended ? 'default' : 'outline'}
              onClick={() => setRecommended(true)}
            >
              추천
            </Button>
            <Button
              variant={!isRecommended ? 'default' : 'outline'}
              onClick={() => setRecommended(false)}
            >
              비추천
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">공개 범위</label>
          <div className="flex items-center gap-2">
            <Button
              variant={visibility === 'public' ? 'default' : 'outline'}
              onClick={() => setVisibility('public')}
            >
              전체 공개
            </Button>
            <Button
              variant={visibility === 'private' ? 'default' : 'outline'}
              onClick={() => setVisibility('private')}
            >
              비공개
            </Button>
            <Button
              variant="outline"
              disabled
              title="팔로워 공개는 추후 지원 예정"
            >
              팔로워만
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => void saveDraft()}>
          임시저장
        </Button>
        <Button onClick={onPublish} disabled={!selectedBook}>
          게시하기
        </Button>
      </div>
    </div>
  );
}
