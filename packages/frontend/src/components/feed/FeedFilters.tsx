import { Clock, TrendingUp, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '../ui/button';

export type SortOption = 'recent' | 'popular' | 'rating';
export type RecommendFilter = 'all' | 'recommended' | 'not-recommended';

interface FeedFiltersProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  recommendFilter: RecommendFilter;
  onRecommendFilterChange: (filter: RecommendFilter) => void;
}

export function FeedFilters({
  sortBy,
  onSortChange,
  recommendFilter,
  onRecommendFilterChange,
}: FeedFiltersProps) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4 mb-6">
      {/* Sorting options */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-stone-700 mb-2">정렬</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={sortBy === 'recent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSortChange('recent')}
            className="gap-2"
          >
            <Clock className="w-4 h-4" />
            최신순
          </Button>
          <Button
            variant={sortBy === 'popular' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSortChange('popular')}
            className="gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            인기순
          </Button>
          <Button
            variant={sortBy === 'rating' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSortChange('rating')}
            className="gap-2"
          >
            <Star className="w-4 h-4" />
            평점순
          </Button>
        </div>
      </div>

      {/* Recommendation filter */}
      <div>
        <h3 className="text-sm font-semibold text-stone-700 mb-2">추천 여부</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={recommendFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onRecommendFilterChange('all')}
          >
            전체
          </Button>
          <Button
            variant={recommendFilter === 'recommended' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onRecommendFilterChange('recommended')}
            className="gap-2"
          >
            <ThumbsUp className="w-4 h-4" />
            추천
          </Button>
          <Button
            variant={
              recommendFilter === 'not-recommended' ? 'default' : 'outline'
            }
            size="sm"
            onClick={() => onRecommendFilterChange('not-recommended')}
            className="gap-2"
          >
            <ThumbsDown className="w-4 h-4" />
            비추천
          </Button>
        </div>
      </div>
    </div>
  );
}
