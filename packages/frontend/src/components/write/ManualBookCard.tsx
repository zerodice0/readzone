import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { BookSummary } from '@/store/writeStore';

interface Props {
  onSelect: (book: BookSummary) => void;
}

export function ManualBookCard({ onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    author: '',
    publisher: '',
    publishedAt: '',
    isbn: '',
    thumbnail: '',
  });
  const canSubmit = form.title.trim() && form.author.trim();

  const handleSubmit = () => {
    const payload: BookSummary = {
      title: form.title.trim(),
      author: form.author.trim(),
      isExisting: false,
      source: 'manual',
    };

    if (form.publisher.trim()) {
      payload.publisher = form.publisher.trim();
    }
    if (form.publishedAt.trim()) {
      payload.publishedAt = form.publishedAt.trim();
    }
    if (form.isbn.trim()) {
      payload.isbn = form.isbn.trim();
    }
    if (form.thumbnail.trim()) {
      payload.thumbnail = form.thumbnail.trim();
    }
    onSelect(payload);
  };

  return (
    <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-white/60">
      {!open ? (
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">찾는 도서가 없나요?</div>
            <div className="text-sm text-slate-600">
              수동으로 정보를 입력해 선택할 수 있어요.
            </div>
          </div>
          <Button variant="outline" onClick={() => setOpen(true)}>
            수동 입력
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="제목*"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Input
              placeholder="저자*"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
            />
            <Input
              placeholder="출판사"
              value={form.publisher}
              onChange={(e) => setForm({ ...form, publisher: e.target.value })}
            />
            <Input
              placeholder="출간연도 (YYYY-MM-DD)"
              value={form.publishedAt}
              onChange={(e) =>
                setForm({ ...form, publishedAt: e.target.value })
              }
            />
            <Input
              placeholder="ISBN"
              value={form.isbn}
              onChange={(e) => setForm({ ...form, isbn: e.target.value })}
            />
            <Input
              placeholder="표지 이미지 URL"
              value={form.thumbnail}
              onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              생성하여 선택
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
