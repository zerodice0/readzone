import type { ReviewCard as ReviewCardType } from '@/types/feed';
interface ReviewCardProps {
    review: ReviewCardType;
    onLike: (reviewId: string) => void;
    onComment: (reviewId: string) => void;
    onShare: (reviewId: string) => void;
    onProfileClick: (userId: string) => void;
    onBookClick: (bookId: string) => void;
    onReviewClick: (reviewId: string) => void;
    isAuthenticated: boolean;
}
declare const ReviewCard: ({ review, onLike, onComment, onShare, onProfileClick, onBookClick, onReviewClick, isAuthenticated }: ReviewCardProps) => import("react/jsx-runtime").JSX.Element;
export default ReviewCard;
