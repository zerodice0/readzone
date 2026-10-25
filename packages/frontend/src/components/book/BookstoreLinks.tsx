import { ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';
import { getBookstoreLinks } from '../../utils/bookstore';

interface BookstoreLinksProps {
  isbn?: string | null;
  title: string;
  author?: string | null;
  aladinUrl?: string | null;
  ebookUrl?: string | null;
}

/**
 * 서점 링크 버튼 묶음 (ISBN 검색, 이전 알라딘 상품 링크가 있으면 그 링크)
 */
export function BookstoreLinks(props: BookstoreLinksProps) {
  const links = getBookstoreLinks(props);

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
