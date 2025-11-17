import { Link } from 'react-router-dom';
import { Star, MessageSquare, ThumbsUp, Book } from 'lucide-react';
import { Badge } from '../ui/badge';
import type { Id } from 'convex/_generated/dataModel';

interface BookCardProps {
  book: {
    _id: Id<'books'>;
    title: string;
    author: string;
    coverImageUrl?: string;
    publishedDate?: number;
    reviewCount: number;
    averageRating: number;
    recommendationRate: number;
  };
}

export function BookCard({ book }: BookCardProps) {
  const publishYear = book.publishedDate
    ? new Date(book.publishedDate).getFullYear()
    : null;

  return (
    <Link
      to={`/books/${book._id}`}
      className="group block bg-white border border-stone-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-primary-300 transition-all duration-200"
    >
      {/* Book cover */}
      <div className="aspect-[2/3] bg-stone-100 relative overflow-hidden">
        {book.coverImageUrl ? (
          <img
            src={book.coverImageUrl}
            alt={`${book.title} 표지`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Book className="w-16 h-16 text-stone-300" />
          </div>
        )}

        {/* Recommendation badge */}
        {book.reviewCount > 0 && book.recommendationRate >= 80 && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-green-500 text-white hover:bg-green-600 shadow-lg">
              <ThumbsUp className="w-3 h-3 mr-1" />
              추천 {book.recommendationRate}%
            </Badge>
          </div>
        )}
      </div>

      {/* Book info */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-serif font-bold text-stone-900 mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {book.title}
        </h3>

        {/* Author */}
        <p className="text-sm text-stone-600 mb-3">{book.author}</p>

        {/* Stats */}
        <div className="flex items-center gap-3 text-sm">
          {/* Average rating */}
          {book.averageRating > 0 && (
            <div className="flex items-center gap-1 text-amber-600">
              <Star className="w-4 h-4 fill-current" />
              <span className="font-medium">{book.averageRating}</span>
            </div>
          )}

          {/* Review count */}
          <div className="flex items-center gap-1 text-stone-600">
            <MessageSquare className="w-4 h-4" />
            <span>{book.reviewCount}</span>
          </div>

          {/* Published year */}
          {publishYear && (
            <span className="text-stone-400 text-xs ml-auto">
              {publishYear}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
