import { type FC } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import useSearchStore from '@/store/searchStore';
import type { SearchType } from '@/types/index';
import { cn } from '@/lib/utils';

interface SearchTypeSelectorProps {
  className?: string;
}

const searchTypes: { key: SearchType; label: string; description: string }[] = [
  { key: 'all', label: '전체', description: '도서, 독후감, 사용자' },
  { key: 'books', label: '도서', description: '제목, 저자, ISBN' },
  { key: 'reviews', label: '독후감', description: '내용, 태그, 작성자' },
  { key: 'users', label: '사용자', description: '닉네임, 자기소개' },
];

export const SearchTypeSelector: FC<SearchTypeSelectorProps> = ({ className }) => {
  const { query, type, setType } = useSearchStore();

  const handleTypeChange = (newType: SearchType) => {
    setType(newType);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Type Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {searchTypes.map((searchType) => (
          <Button
            key={searchType.key}
            variant={type === searchType.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTypeChange(searchType.key)}
            className="shrink-0"
          >
            {searchType.label}
          </Button>
        ))}
      </div>

      {/* Current Search Type Description */}
      {type !== 'all' && (
        <div className="text-xs text-gray-500">
          {searchTypes.find(t => t.key === type)?.description}에서 검색합니다
        </div>
      )}

      {/* Search Status */}
      {query && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>'{query}'에 대한 검색 결과</span>
          {type !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              {searchTypes.find(t => t.key === type)?.label}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};