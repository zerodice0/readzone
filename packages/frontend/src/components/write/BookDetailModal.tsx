import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { BookSummary } from '@/store/writeStore';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: BookSummary | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BookDetailModal({
  open,
  onOpenChange,
  book,
  onConfirm,
  onCancel,
}: Props) {
  if (!book) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>도서 정보</DialogTitle>
          <DialogDescription>
            선택한 도서에 대한 독후감을 작성하시겠습니까?
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 py-4">
          <div className="w-20 h-28 rounded-md bg-slate-100 overflow-hidden shadow-sm shrink-0">
            {book.thumbnail ? (
              <img
                src={book.thumbnail}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                표지 없음
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <h3 className="font-semibold text-lg leading-tight">
                {book.title}
              </h3>
              <p className="text-slate-600 text-sm">{book.author}</p>
            </div>

            {(Boolean(book.publisher) || Boolean(book.publishedAt)) && (
              <div className="text-sm text-slate-500">
                {book.publisher && <span>{book.publisher}</span>}
                {book.publisher && book.publishedAt && <span> · </span>}
                {book.publishedAt && (
                  <span>{book.publishedAt.slice(0, 10)}</span>
                )}
              </div>
            )}

            {book.isbn && (
              <div className="text-xs text-slate-500 font-mono">
                ISBN: {book.isbn}
              </div>
            )}

            {book.description && (
              <div className="text-sm text-slate-600 line-clamp-3">
                {book.description}
              </div>
            )}

            {book.isExisting && book.stats && (
              <div className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                독후감 {book.stats.reviewCount}개
                {typeof book.stats.averageRating === 'number' &&
                  ` · 추천율 ${Math.round(book.stats.averageRating * 100)}%`}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            다시 선택하기
          </Button>
          <Button onClick={onConfirm}>독후감 작성하기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
