import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useQueryParam } from '@/hooks/useQueryParam';
import useWriteStore from '@/store/writeStore';
import { BookSearchStep } from '@/components/write/BookSearchStep';
import { WritingStep } from '@/components/write/WritingStep';

function WritePage() {
  const setStep = useWriteStore((s) => s.setStep);
  const setSelectedBook = useWriteStore((s) => s.setSelectedBook);
  const loadDraft = useWriteStore((s) => s.loadDraft);
  const selectedBook = useWriteStore((s) => s.selectedBook);
  const getBookById = useWriteStore((s) => s.getBookById);
  const currentStep = useWriteStore((s) => s.currentStep);
  const setTitle = useWriteStore((s) => s.setTitle);
  const setContent = useWriteStore((s) => s.setContent);
  const setRecommended = useWriteStore((s) => s.setRecommended);
  const setTags = useWriteStore((s) => s.setTags);
  const setVisibility = useWriteStore((s) => s.setVisibility);

  const bookId = useQueryParam('bookId');

  // Clear state and load draft only for current book
  useEffect(() => {
    if (selectedBook?.id) {
      // Clear previous draft state
      setTitle('');
      setContent('');
      setRecommended(true);
      setTags([]);
      setVisibility('public');

      // Load draft for the selected book
      void loadDraft(selectedBook.id);
    }
  }, [selectedBook?.id, loadDraft, setTitle, setContent, setRecommended, setTags, setVisibility]);

  useEffect(() => {
    const load = async () => {
      if (bookId && !selectedBook) {
        const b = await getBookById(bookId);

        if (b) {
          setSelectedBook(b);
          setStep('writing');
        }
      }
    };

    void load();
  }, [bookId, selectedBook, getBookById, setSelectedBook, setStep]);

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <h1 className="text-2xl font-bold mb-4">독후감 작성</h1>
        <div className="mb-4 flex gap-2 text-sm">
          <button
            className={`px-3 py-1 border rounded ${currentStep === 'book-search' ? 'bg-primary text-primary-foreground' : ''}`}
            onClick={() => setStep('book-search')}
          >
            1. 도서 선택
          </button>
          <button
            className={`px-3 py-1 border rounded ${currentStep === 'writing' ? 'bg-primary text-primary-foreground' : ''}`}
            onClick={() => setStep('writing')}
          >
            2. 작성
          </button>
        </div>

        {currentStep === 'book-search' ? <BookSearchStep /> : <WritingStep />}
      </div>
    </AuthGuard>
  );
}

export const Route = createFileRoute('/write')({
  component: WritePage,
});
