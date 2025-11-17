import { Clock, TrendingUp, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { m } from 'framer-motion';
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
    <m.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white border border-stone-200 rounded-xl p-4 mb-6"
    >
      {/* Sorting options */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-stone-700 mb-2">정렬</h3>
        <div className="flex flex-wrap gap-2">
          <m.div whileTap={{ scale: 0.95 }}>
            <Button
              variant={sortBy === 'recent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSortChange('recent')}
              className="gap-2"
            >
              <m.div
                animate={{ rotate: sortBy === 'recent' ? 360 : 0 }}
                transition={{ duration: 0.5 }}
              >
                <Clock className="w-4 h-4" />
              </m.div>
              최신순
            </Button>
          </m.div>
          <m.div whileTap={{ scale: 0.95 }}>
            <Button
              variant={sortBy === 'popular' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSortChange('popular')}
              className="gap-2"
            >
              <m.div
                animate={{ rotate: sortBy === 'popular' ? 360 : 0 }}
                transition={{ duration: 0.5 }}
              >
                <TrendingUp className="w-4 h-4" />
              </m.div>
              인기순
            </Button>
          </m.div>
          <m.div whileTap={{ scale: 0.95 }}>
            <Button
              variant={sortBy === 'rating' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSortChange('rating')}
              className="gap-2"
            >
              <m.div
                animate={{
                  rotate: sortBy === 'rating' ? [0, -10, 10, -10, 0] : 0,
                  scale: sortBy === 'rating' ? [1, 1.2, 1] : 1,
                }}
                transition={{ duration: 0.6 }}
              >
                <Star className="w-4 h-4" />
              </m.div>
              평점순
            </Button>
          </m.div>
        </div>
      </div>

      {/* Recommendation filter */}
      <div>
        <h3 className="text-sm font-semibold text-stone-700 mb-2">추천 여부</h3>
        <div className="flex flex-wrap gap-2">
          <m.div whileTap={{ scale: 0.95 }}>
            <Button
              variant={recommendFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onRecommendFilterChange('all')}
            >
              전체
            </Button>
          </m.div>
          <m.div whileTap={{ scale: 0.95 }}>
            <Button
              variant={
                recommendFilter === 'recommended' ? 'default' : 'outline'
              }
              size="sm"
              onClick={() => onRecommendFilterChange('recommended')}
              className="gap-2"
            >
              <m.div
                animate={{
                  rotate: recommendFilter === 'recommended' ? 360 : 0,
                  scale: recommendFilter === 'recommended' ? [1, 1.2, 1] : 1,
                }}
                transition={{ duration: 0.5 }}
              >
                <ThumbsUp className="w-4 h-4" />
              </m.div>
              추천
            </Button>
          </m.div>
          <m.div whileTap={{ scale: 0.95 }}>
            <Button
              variant={
                recommendFilter === 'not-recommended' ? 'default' : 'outline'
              }
              size="sm"
              onClick={() => onRecommendFilterChange('not-recommended')}
              className="gap-2"
            >
              <m.div
                animate={{
                  rotate: recommendFilter === 'not-recommended' ? -360 : 0,
                  scale:
                    recommendFilter === 'not-recommended' ? [1, 1.2, 1] : 1,
                }}
                transition={{ duration: 0.5 }}
              >
                <ThumbsDown className="w-4 h-4" />
              </m.div>
              비추천
            </Button>
          </m.div>
        </div>
      </div>
    </m.div>
  );
}
