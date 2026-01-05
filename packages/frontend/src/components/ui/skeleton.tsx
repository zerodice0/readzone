import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-linear-to-r from-stone-200 via-stone-100 to-stone-200 bg-size-[200%_100%]',
        'animate-shimmer',
        className
      )}
      style={{
        animation: 'shimmer 2s infinite linear',
      }}
      {...props}
    />
  );
}

export { Skeleton };
