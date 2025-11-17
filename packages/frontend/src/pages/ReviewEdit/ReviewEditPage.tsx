import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { useUser } from '@clerk/clerk-react';
import { api } from 'convex/_generated/api';
import { Button } from '../../components/ui/button';
import { ReviewForm } from '../../components/review/ReviewForm';
import { logError } from '../../utils/error';
import { toast } from '../../utils/toast';
import type { Id } from 'convex/_generated/dataModel';

interface ReviewFormData {
  title: string;
  content: string;
  rating: number;
  isRecommended: boolean;
  readStatus: 'READING' | 'COMPLETED' | 'DROPPED';
}

export default function ReviewEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch review data
  const review = useQuery(
    api.reviews.get,
    id ? { id: id as Id<'reviews'> } : 'skip'
  );

  const updateReview = useMutation(api.reviews.update);

  // Check if user is authorized
  const isAuthorized = review && user && review.userId === user.id;
  const isLoading = review === undefined;

  useEffect(() => {
    // Redirect if not authorized
    if (review && user && review.userId !== user.id) {
      toast.error('이 독후감을 수정할 권한이 없습니다');
      navigate(`/reviews/${id}`);
    }
  }, [review, user, id, navigate]);

  const handleSubmitReview = async (
    data: ReviewFormData,
    status: 'DRAFT' | 'PUBLISHED'
  ) => {
    if (!id || !review || !isAuthorized) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updateReview({
        id: id as Id<'reviews'>,
        title: data.title || undefined,
        content: data.content,
        rating: data.rating,
        isRecommended: data.isRecommended,
        readStatus: data.readStatus,
        status,
      });

      // Navigate back to the review detail page
      navigate(`/reviews/${id}`);
    } catch (error) {
      logError(error, 'Failed to update review');
      toast.error('독후감 수정에 실패했습니다', '다시 시도해주세요.');
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-4xl">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin mr-2 text-primary-500" />
          <span className="text-stone-700">독후감을 불러오는 중...</span>
        </div>
      </div>
    );
  }

  // Review not found
  if (!review || !id) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-4xl">
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-stone-200 rounded-xl shadow-sm">
          <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-stone-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-stone-900">
            독후감을 찾을 수 없습니다
          </h2>
          <p className="text-stone-600 mb-8">
            요청하신 독후감이 존재하지 않거나 삭제되었습니다
          </p>
          <Button
            onClick={() => navigate('/feed')}
            className="bg-primary-500 hover:bg-primary-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            피드로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  // Not authorized
  if (!isAuthorized) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/reviews/${id}`)}
          className="mb-4 text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          독후감으로 돌아가기
        </Button>

        <h1 className="text-3xl font-bold text-stone-900 mb-2">독후감 수정</h1>
        <p className="text-stone-600">독후감 내용을 수정할 수 있습니다</p>
      </div>

      {/* Edit form */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 sm:p-8 shadow-sm">
        <ReviewForm
          initialData={{
            title: review.title || '',
            content: review.content,
            rating: review.rating || 5,
            isRecommended: review.isRecommended,
            readStatus: review.readStatus,
          }}
          onSubmit={handleSubmitReview}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
