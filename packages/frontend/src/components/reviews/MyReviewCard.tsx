import { Link } from 'react-router-dom';
import {
  Heart,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  Edit,
  Eye,
  BookOpen,
} from 'lucide-react';
import type { Id } from 'convex/_generated/dataModel';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

type ReviewBook = {
  _id: Id<'books'>;
  title: string;
  author: string;
  coverImageUrl?: string;
};

type ReviewStatus = 'DRAFT' | 'PUBLISHED' | 'DELETED';

type ReviewWithBook = {
  _id: Id<'reviews'>;
  title?: string;
  content: string;
  isRecommended: boolean;
  likeCount: number;
  bookmarkCount: number;
  viewCount: number;
  status: ReviewStatus;
  publishedAt?: number;
  book?: ReviewBook | null;
};

type MyReviewCardProps = {
  review: ReviewWithBook;
  dateFormatter: Intl.DateTimeFormat;
};

export function MyReviewCard({ review, dateFormatter }: MyReviewCardProps) {
  const book = review.book;
  const hasReviewTitle = Boolean(review.title?.trim());
  const reviewTitle = review.title?.trim() || '제목 없는 독후감';
  const bookTitle = book?.title || '도서 정보 없음';
  const isDraft = review.status === 'DRAFT';
  const statusBadge =
    review.status === 'DRAFT' ? (
      <Badge variant="secondary" className="text-xs">
        초안
      </Badge>
    ) : review.status === 'DELETED' ? (
      <Badge variant="secondary" className="text-xs">
        삭제됨
      </Badge>
    ) : (
      <Badge
        variant="default"
        className="border-green-200 bg-green-100 text-xs text-green-800"
      >
        발행됨
      </Badge>
    );

  return (
    <article className="paper-surface rounded-xl p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      <div className="grid grid-cols-[4.25rem_minmax(0,1fr)] gap-x-3.5 gap-y-3 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-x-4">
        <div className="book-paper-frame relative h-[104px] w-[4.25rem] shrink-0 overflow-hidden rounded-lg shadow-sm sm:h-28 sm:w-20">
          <div className="absolute inset-0 flex items-center justify-center text-stone-300">
            <BookOpen className="h-7 w-7" aria-hidden="true" />
          </div>
          {book?.coverImageUrl && (
            <img
              src={book.coverImageUrl}
              alt={`${bookTitle} 표지`}
              width={80}
              height={112}
              className="relative h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {statusBadge}
            {review.publishedAt && (
              <span className="text-xs text-stone-500 tabular-nums">
                {dateFormatter.format(new Date(review.publishedAt))}
              </span>
            )}
          </div>

          <h3 className="mt-1.5 line-clamp-2 text-[15px] font-semibold leading-6 text-stone-950 sm:text-base">
            {bookTitle}
          </h3>
          {book?.author && (
            <p className="mt-0.5 line-clamp-1 text-sm leading-5 text-stone-500">
              {book.author}
            </p>
          )}

          <div className="mt-2.5 border-t border-paper-200/70 pt-2.5">
            {hasReviewTitle && (
              <p className="line-clamp-1 text-sm font-semibold leading-6 text-stone-800">
                {reviewTitle}
              </p>
            )}
            <p
              className={
                hasReviewTitle
                  ? 'mt-1 line-clamp-2 text-sm leading-6 text-stone-600'
                  : 'line-clamp-2 text-sm leading-6 text-stone-700'
              }
            >
              {review.content}
            </p>
          </div>
        </div>

        <div className="col-span-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-paper-200/60 pt-3">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 text-sm text-stone-500 tabular-nums">
            {review.isRecommended ? (
              <Badge className="border-green-200 bg-green-100 text-xs text-green-800">
                <ThumbsUp className="mr-1 h-3 w-3" aria-hidden="true" />
                추천
              </Badge>
            ) : (
              <Badge className="border-red-200 bg-red-100 text-xs text-red-800">
                <ThumbsDown className="mr-1 h-3 w-3" aria-hidden="true" />
                비추천
              </Badge>
            )}
            <div className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{review.likeCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{review.bookmarkCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{review.viewCount}</span>
            </div>
          </div>

          <div className="flex shrink-0 gap-1">
            {isDraft ? (
              <>
                <Button
                  asChild
                  variant="default"
                  size="sm"
                  className="h-8 px-3 text-xs"
                >
                  <Link to={`/reviews/${review._id}/edit`}>
                    <Edit className="h-4 w-4" aria-hidden="true" />
                    이어쓰기
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs text-stone-700 hover:bg-paper-100/70 hover:text-stone-950"
                >
                  <Link to={`/reviews/${review._id}`}>
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    미리보기
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs text-stone-700 hover:bg-paper-100/70 hover:text-stone-950"
                >
                  <Link to={`/reviews/${review._id}`}>
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    보기
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs text-stone-700 hover:bg-paper-100/70 hover:text-stone-950"
                >
                  <Link to={`/reviews/${review._id}/edit`}>
                    <Edit className="h-4 w-4" aria-hidden="true" />
                    수정
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
