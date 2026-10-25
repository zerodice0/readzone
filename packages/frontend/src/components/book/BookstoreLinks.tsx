import { ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';
import { getBookstoreLinks } from '../../utils/bookstore';

interface BookstoreLinksProps {
  isbn?: string | null;
  title: string;
  author?: string | null;
}

/**
 * ISBN으로 서점 검색 결과를 여는 버튼 묶음
 */
export function BookstoreLinks({ isbn, title, author }: BookstoreLinksProps) {
  const links = getBookstoreLinks({ isbn, title, author });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-stone-600">서점에서 찾기</span>
      {links.map((link) => (
        <Button
          key={link.name}
          asChild
          variant="outline"
          size="sm"
          className="border-stone-200 text-stone-700"
        >
          <a href={link.url} target="_blank" rel="noopener noreferrer">
            {link.name}
            <ExternalLink
              className="ml-1 h-3 w-3 opacity-60"
              aria-hidden="true"
            />
            <span className="sr-only">(새 창)</span>
          </a>
        </Button>
      ))}
    </div>
  );
}
