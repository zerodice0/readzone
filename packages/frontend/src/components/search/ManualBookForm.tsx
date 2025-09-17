import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import useSearchStore from '@/store/searchStore';
import type { ManualBookRequest } from '@/types/index';
import { cn } from '@/lib/utils';
import { BookOpen, Plus, X } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

interface ManualBookFormProps {
  className?: string;
  onBookCreated?: (bookId: string) => void;
  mode?: 'select' | 'view'; // select mode for book selection, view mode for general browsing
  redirectTo?: string;
}

// Common genre options for manual book input
const bookGenres = [
  '소설', '에세이', '시/문학', '인문학', '역사', '철학', '종교',
  '사회과학', '정치', '경제', '법학', '교육', '심리학',
  '과학', '기술/공학', '의학', '예술', '음악', '건축', '사진',
  '자기계발', '건강', '취미', '여행', '요리', '육아',
  '비즈니스', '컴퓨터/IT', '외국어', '교재/참고서',
];

export const ManualBookForm: React.FC<ManualBookFormProps> = ({
  className,
  onBookCreated,
  mode = 'view',
  redirectTo = '/write'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addManualBook } = useSearchStore();
  const navigate = useNavigate();

  const [form, setForm] = useState<ManualBookRequest>({
    title: '',
    author: '',
    publisher: '',
    publishedDate: '',
    isbn: '',
    coverImage: '',
    description: '',
    genre: [],
  });

  const canSubmit = Boolean(form.title.trim() && form.author.trim());

  const handleInputChange = (field: keyof ManualBookRequest, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (error) {
      setError(null);
    }
  };

  const handleGenreToggle = (genre: string) => {
    setForm(prev => ({
      ...prev,
      genre: prev.genre?.includes(genre)
        ? prev.genre.filter(g => g !== genre)
        : [...(prev.genre ?? []), genre]
    }));
  };

  const handleGenreRemove = (genre: string) => {
    setForm(prev => ({
      ...prev,
      genre: prev.genre?.filter(g => g !== genre) ?? []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Clean up form data
      const cleanForm: ManualBookRequest = {
        title: form.title.trim(),
        author: form.author.trim(),
      };

      if (form.publisher?.trim()) {
        cleanForm.publisher = form.publisher.trim();
      }
      if (form.publishedDate?.trim()) {
        cleanForm.publishedDate = form.publishedDate.trim();
      }
      if (form.isbn?.trim()) {
        cleanForm.isbn = form.isbn.trim();
      }
      if (form.coverImage?.trim()) {
        cleanForm.coverImage = form.coverImage.trim();
      }
      if (form.description?.trim()) {
        cleanForm.description = form.description.trim();
      }
      if (form.genre && form.genre.length > 0) {
        cleanForm.genre = form.genre;
      }

      const createdBook = await addManualBook(cleanForm);

      if (createdBook.id) {
        // Reset form
        setForm({
          title: '',
          author: '',
          publisher: '',
          publishedDate: '',
          isbn: '',
          coverImage: '',
          description: '',
          genre: [],
        });

        setIsOpen(false);

        // Handle success based on mode
        if (onBookCreated) {
          onBookCreated(createdBook.id);
        } else if (mode === 'select') {
          navigate({ to: `${redirectTo}?bookId=${createdBook.id}` });
        } else {
          navigate({ to: `/books/${createdBook.id}` });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '도서 생성에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setForm({
      title: '',
      author: '',
      publisher: '',
      publishedDate: '',
      isbn: '',
      coverImage: '',
      description: '',
      genre: [],
    });
    setError(null);
    setIsOpen(false);
  };

  const TriggerButton = () => (
    <Button variant="outline" className="w-full">
      <Plus className="w-4 h-4 mr-2" />
      수동으로 도서 추가
    </Button>
  );

  const FormContent = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      {/* Required Fields */}
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">
            제목 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="도서 제목을 입력하세요"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="author">
            저자 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="author"
            value={form.author}
            onChange={(e) => handleInputChange('author', e.target.value)}
            placeholder="저자명을 입력하세요"
            required
          />
        </div>
      </div>

      {/* Optional Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="publisher">출판사</Label>
          <Input
            id="publisher"
            value={form.publisher}
            onChange={(e) => handleInputChange('publisher', e.target.value)}
            placeholder="출판사명"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="publishedDate">출간일</Label>
          <Input
            id="publishedDate"
            type="date"
            value={form.publishedDate}
            onChange={(e) => handleInputChange('publishedDate', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="isbn">ISBN</Label>
        <Input
          id="isbn"
          value={form.isbn}
          onChange={(e) => handleInputChange('isbn', e.target.value)}
          placeholder="ISBN 번호 (선택사항)"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="coverImage">표지 이미지 URL</Label>
        <Input
          id="coverImage"
          type="url"
          value={form.coverImage}
          onChange={(e) => handleInputChange('coverImage', e.target.value)}
          placeholder="https://example.com/book-cover.jpg"
        />
        {form.coverImage && (
          <div className="mt-2">
            <img
              src={form.coverImage}
              alt="도서 표지 미리보기"
              className="w-16 h-20 object-cover rounded border"
              onError={() => setError('유효하지 않은 이미지 URL입니다')}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">설명</Label>
        <textarea
          id="description"
          value={form.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="도서에 대한 간단한 설명 (선택사항)"
          className="w-full px-3 py-2 border border-gray-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>

      {/* Genre Selection */}
      <div className="space-y-2">
        <Label>장르</Label>
        {form.genre && form.genre.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {form.genre.map((genre) => (
              <Badge
                key={genre}
                variant="secondary"
                className="text-xs cursor-pointer hover:bg-gray-200"
                onClick={() => handleGenreRemove(genre)}
              >
                {genre}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
        )}
        <div className="grid grid-cols-3 gap-1 max-h-32 overflow-y-auto border rounded-md p-2">
          {bookGenres.map((genre) => (
            <Button
              key={genre}
              type="button"
              variant={(form.genre ?? []).includes(genre) ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleGenreToggle(genre)}
              className="text-xs h-8 justify-start"
            >
              {genre}
            </Button>
          ))}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={handleCancel}>
          취소
        </Button>
        <Button type="submit" disabled={!canSubmit || isLoading}>
          {isLoading ? '생성 중...' : mode === 'select' ? '생성하여 선택' : '도서 생성'}
        </Button>
      </div>
    </form>
  );

  // For inline usage (simple card version)
  if (className?.includes('inline')) {
    return (
      <Card className={cn('border-dashed border-slate-300 bg-white/60', className)}>
        {!isOpen ? (
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  찾는 도서가 없나요?
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  수동으로 도서 정보를 입력하여 추가할 수 있습니다.
                </div>
              </div>
              <Button variant="outline" onClick={() => setIsOpen(true)}>
                수동 입력
              </Button>
            </div>
          </CardContent>
        ) : (
          <CardContent className="p-4">
            <FormContent />
          </CardContent>
        )}
      </Card>
    );
  }

  // For modal usage
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <TriggerButton />
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            수동으로 도서 추가
          </DialogTitle>
        </DialogHeader>
        <FormContent />
      </DialogContent>
    </Dialog>
  );
};
