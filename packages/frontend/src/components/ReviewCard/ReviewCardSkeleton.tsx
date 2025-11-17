import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

/**
 * Skeleton loader for ReviewCard
 * Matches the layout of ReviewCard for smooth loading experience
 */
export function ReviewCardSkeleton() {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="space-y-3">
        {/* User info skeleton */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Book info skeleton */}
        <div className="flex gap-4">
          <Skeleton className="h-24 w-16 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-4" />
              ))}
            </div>
          </div>
        </div>

        {/* Review content skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Badges skeleton */}
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex gap-4">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      </CardFooter>
    </Card>
  );
}

/**
 * Multiple skeleton cards for list loading
 */
export function ReviewCardSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <ReviewCardSkeleton key={i} />
      ))}
    </div>
  );
}
