import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Heart, MessageSquare, ThumbsDown, ThumbsUp } from 'lucide-react';
import type { ReviewSearchResult } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ReviewSearchResultCardProps {
  review: ReviewSearchResult;
}

export function ReviewSearchResultCard({ review }: ReviewSearchResultCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          {/* Author Info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={review.author.profileImage} alt={review.author.username} />
              <AvatarFallback>
                {review.author.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <Link
                to="/profile/$userid"
                params={{ userid: review.author.id }}
                className="text-sm font-medium hover:underline"
              >
                {review.author.username}
              </Link>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(review.createdAt), {
                  addSuffix: true,
                  locale: ko,
                })}
              </p>
            </div>
          </div>

          {/* Rating Badge */}
          <Badge
            variant={review.rating === 'recommend' ? 'default' : 'secondary'}
            className="flex items-center gap-1"
          >
            {review.rating === 'recommend' ? (
              <>
                <ThumbsUp className="w-3 h-3" />
                추천
              </>
            ) : (
              <>
                <ThumbsDown className="w-3 h-3" />
                비추천
              </>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Book Info */}
        <div className="flex items-center gap-3 p-2 bg-muted rounded-md">
          {review.book.coverImage ? (
            <img
              src={review.book.coverImage}
              alt={review.book.title}
              className="w-12 h-16 object-cover rounded"
            />
          ) : (
            <div className="w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-gray-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <Link
              to="/books/$bookId"
              params={{ bookId: review.book.id }}
              className="font-medium text-sm hover:underline line-clamp-1"
            >
              {review.book.title}
            </Link>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {review.book.author}
            </p>
          </div>
        </div>

        {/* Review Content */}
        <div>
          {review.highlights?.content ? (
            <div className="space-y-2">
              {review.highlights.content.map((highlight: string, index: number) => (
                <p
                  key={index}
                  className="text-sm text-muted-foreground line-clamp-3"
                  dangerouslySetInnerHTML={{
                    __html: highlight.replace(
                      new RegExp(`(${review.content})`, 'gi'),
                      '<mark class="bg-yellow-200 dark:bg-yellow-900">$1</mark>'
                    ),
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {review.content}
            </p>
          )}
        </div>

        {/* Tags */}
        {review.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {review.tags.slice(0, 5).map((tag: string, index: number) => (
              <Badge
                key={index}
                variant="outline"
                className={cn(
                  "text-xs",
                  review.highlights?.tags?.includes(tag) &&
                    "bg-yellow-100 dark:bg-yellow-900"
                )}
              >
                #{tag}
              </Badge>
            ))}
            {review.tags.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{review.tags.length - 5}
              </Badge>
            )}
          </div>
        )}

        {/* Stats and Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              {review.stats.likes}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              {review.stats.comments}
            </span>
          </div>

          <Link to="/review/$reviewId" params={{ reviewId: review.id }}>
            <Button variant="outline" size="sm">
              전체 보기
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}