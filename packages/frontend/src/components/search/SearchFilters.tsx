import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import useSearchStore from '@/store/searchStore';
import type { SearchFilters as SearchFiltersType } from '@/types/index';
import { cn } from '@/lib/utils';
import { ChevronDown, Filter, X } from 'lucide-react';

interface SearchFiltersProps {
  className?: string;
}

// Common genre options for books
const bookGenres = [
  '소설', '에세이', '시/문학', '인문학', '역사', '철학', '종교',
  '사회과학', '정치', '경제', '법학', '교육', '심리학',
  '과학', '기술/공학', '의학', '예술', '음악', '건축', '사진',
  '자기계발', '건강', '취미', '여행', '요리', '육아',
  '비즈니스', '컴퓨터/IT', '외국어', '교재/참고서',
];

type SearchFiltersUpdate = {
  [K in keyof SearchFiltersType]?: SearchFiltersType[K] | undefined;
};

export const SearchFilters: React.FC<SearchFiltersProps> = ({ className }) => {
  const { type, filters, setFilters } = useSearchStore();
  const [isOpen, setIsOpen] = useState(false);

  const updateFilters = (partial: SearchFiltersUpdate) => {
    const merged = { ...filters } as SearchFiltersType;
    const draft = merged as Record<string, unknown>;

    (Object.keys(partial) as (keyof SearchFiltersType)[]).forEach((key) => {
      const value = partial[key];
      const keyName = key as string;

      if (value === undefined) {
        Reflect.deleteProperty(draft, keyName);
      } else {
        draft[keyName] = value as unknown;
      }
    });
    setFilters(merged);
  };

  const buildPublishYear = (from?: number, to?: number) => {
    if (from === undefined && to === undefined) {
      return undefined;
    }
    const range: NonNullable<SearchFiltersType['publishYear']> = {};

    if (from !== undefined) {
      range.from = from;
    }
    if (to !== undefined) {
      range.to = to;
    }

    return range;
  };

  const buildDateRange = (from?: string, to?: string) => {
    if (!from && !to) {
      return undefined;
    }
    const range: NonNullable<SearchFiltersType['dateRange']> = {};

    if (from) {
      range.from = from;
    }
    if (to) {
      range.to = to;
    }

    return range;
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  const handleGenreToggle = (genre: string) => {
    const currentGenres = filters.genre ?? [];
    const updatedGenres = currentGenres.includes(genre)
      ? currentGenres.filter(g => g !== genre)
      : [...currentGenres, genre];

    updateFilters({ genre: updatedGenres.length > 0 ? updatedGenres : undefined });
  };

  const removeGenre = (genre: string) => {
    const updatedGenres = (filters.genre ?? []).filter(g => g !== genre);

    updateFilters({ genre: updatedGenres.length > 0 ? updatedGenres : undefined });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className ?? ''}>
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
          type="button"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>고급 필터</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs">
                {Object.keys(filters).length}
              </Badge>
            )}
          </div>
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform",
            isOpen && "rotate-180"
          )} />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">검색 필터</CardTitle>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs"
                >
                  초기화
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Book Filters */}
            {(type === 'all' || type === 'books') && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">도서 필터</h4>

                {/* Publication Year Range */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">출간년도</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      placeholder="시작년도"
                      value={filters.publishYear?.from ?? ''}
                      onChange={(e) => {
                        const rawValue = e.target.value;
                        const parsed = rawValue === '' ? undefined : Number.parseInt(rawValue, 10);
                        const from = Number.isNaN(parsed) ? undefined : parsed;

                        updateFilters({
                          publishYear: buildPublishYear(from, filters.publishYear?.to),
                        });
                      }}
                      className="w-20"
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                    <span className="text-xs text-gray-500">~</span>
                    <Input
                      type="number"
                      placeholder="종료년도"
                      value={filters.publishYear?.to ?? ''}
                      onChange={(e) => {
                        const rawValue = e.target.value;
                        const parsed = rawValue === '' ? undefined : Number.parseInt(rawValue, 10);
                        const to = Number.isNaN(parsed) ? undefined : parsed;

                        updateFilters({
                          publishYear: buildPublishYear(filters.publishYear?.from, to),
                        });
                      }}
                      className="w-20"
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                  </div>
                </div>

                {/* Genre Selection */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">장르</Label>
                  {filters.genre && filters.genre.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {filters.genre.map((genre) => (
                        <Badge
                          key={genre}
                          variant="secondary"
                          className="text-xs cursor-pointer hover:bg-gray-200"
                          onClick={() => removeGenre(genre)}
                        >
                          {genre}
                          <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-1 max-h-32 overflow-y-auto">
                    {bookGenres.map((genre) => (
                      <Button
                        key={genre}
                        variant={(filters.genre ?? []).includes(genre) ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handleGenreToggle(genre)}
                        className="text-xs h-8 justify-start"
                        type="button"
                      >
                        {genre}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Review Filters */}
            {(type === 'all' || type === 'reviews') && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">독후감 필터</h4>

                {/* Rating Filter */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">평가</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={filters.rating === 'recommend' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        updateFilters({
                          rating: filters.rating === 'recommend' ? undefined : 'recommend',
                        });
                      }}
                      type="button"
                    >
                      👍 추천만
                    </Button>
                    <Button
                      variant={filters.rating === 'not_recommend' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        updateFilters({
                          rating: filters.rating === 'not_recommend' ? undefined : 'not_recommend',
                        });
                      }}
                      type="button"
                    >
                      👎 비추천만
                    </Button>
                  </div>
                </div>

                {/* Date Range */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">작성일</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="date"
                      value={filters.dateRange?.from ?? ''}
                      onChange={(e) => {
                        const rawValue = e.target.value;
                        const from = rawValue === '' ? undefined : rawValue;

                        updateFilters({
                          dateRange: buildDateRange(from, filters.dateRange?.to),
                        });
                      }}
                      className="text-xs"
                    />
                    <span className="text-xs text-gray-500">~</span>
                    <Input
                      type="date"
                      value={filters.dateRange?.to ?? ''}
                      onChange={(e) => {
                        const rawValue = e.target.value;
                        const to = rawValue === '' ? undefined : rawValue;

                        updateFilters({
                          dateRange: buildDateRange(filters.dateRange?.from, to),
                        });
                      }}
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* Minimum Likes */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">최소 좋아요 수</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.minLikes ?? ''}
                    onChange={(e) => {
                      const rawValue = e.target.value;
                      const parsed = rawValue === '' ? undefined : Number.parseInt(rawValue, 10);
                      const minLikes = Number.isNaN(parsed) ? undefined : parsed;

                      updateFilters({ minLikes });
                    }}
                    className="w-20"
                    min="0"
                  />
                </div>
              </div>
            )}

            {/* User Filters */}
            {(type === 'all' || type === 'users') && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">사용자 필터</h4>

                {/* Has Avatar Filter */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasAvatar"
                    checked={Boolean(filters.hasAvatar)}
                    onCheckedChange={(checked) => {
                      updateFilters({ hasAvatar: checked === true ? true : undefined });
                    }}
                  />
                  <Label htmlFor="hasAvatar" className="text-xs text-gray-600">
                    프로필 사진이 있는 사용자만
                  </Label>
                </div>

                {/* Minimum Followers */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">최소 팔로워 수</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.minFollowers ?? ''}
                    onChange={(e) => {
                      const rawValue = e.target.value;
                      const parsed = rawValue === '' ? undefined : Number.parseInt(rawValue, 10);
                      const minFollowers = Number.isNaN(parsed) ? undefined : parsed;

                      updateFilters({ minFollowers });
                    }}
                    className="w-20"
                    min="0"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
};
