import { cn } from '../../lib/utils';

interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <img
      src="/favicon.svg"
      alt=""
      aria-hidden="true"
      className={cn('h-9 w-9 shrink-0', className)}
    />
  );
}
