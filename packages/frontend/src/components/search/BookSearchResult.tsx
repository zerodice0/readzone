import { Link } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, MessageSquare, Star } from 'lucide-react';
import type { BookSearchResult } from '@/types';

interface BookSearchResultCardProps {
  book: BookSearchResult;
  onWriteReview?: (book: BookSearchResult) => void;
}

export function BookSearchResultCard({ book, onWriteReview }: BookSearchResultCardProps) {
  const handleWriteReview = () => {
    if (onWriteReview) {
      onWriteReview(book);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Book Cover */}
          <div className="flex-shrink-0">
            {book.coverImage ? (
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-20 h-28 object-cover rounded-md shadow-sm"
              />
            ) : (
              <div className="w-20 h-28 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Book Details */}
          <div className="flex-1 space-y-2">
            <div>
              {book.id ? (
                <Link
                  to="/books/$bookId"
                  params={{ bookId: book.id }}
                  className="text-lg font-semibold hover:underline line-clamp-1"
                >
                  {book.title}
                </Link>
              ) : (
                <span className="text-lg font-semibold line-clamp-1">{book.title}</span>
              )}
              <p className="text-sm text-muted-foreground">{book.author}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">{book.publisher}</span>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">{book.publishedDate}</span>
            </div>

            {book.isbn && (
              <p className="text-xs text-muted-foreground">ISBN: {book.isbn}</p>
            )}

            {book.genre && book.genre.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {book.genre.map((g: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {g}
                  </Badge>
                ))}
              </div>
            )}

            {/* Stats */}
            {book.stats && (
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  {book.stats.reviewCount} 독후감
                </span>
                {book.stats.averageRating !== undefined && (
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    {book.stats.averageRating.toFixed(0)}% 추천
                  </span>
                )}
                {book.stats.recentReviews > 0 && (
                  <Badge variant="outline" className="text-xs">
                    최근 {book.stats.recentReviews}개 작성
                  </Badge>
                )}
              </div>
            )}

            {/* Source Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {book.source === 'api' && !book.isExisting && (
                  <Badge variant="outline" className="text-xs">
                    외부 도서
                  </Badge>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {book.id ? (
                  <Link
                    to="/books/$bookId"
                    params={{ bookId: book.id }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                    >
                      상세보기
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleWriteReview}
                  >
                    도서 추가하기
                  </Button>
                )}
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleWriteReview}
                >
                  독후감 쓰기
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}