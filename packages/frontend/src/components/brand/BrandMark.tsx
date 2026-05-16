import { cn } from '../../lib/utils';

interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-primary-700/25 bg-[#fffdf8] shadow-sm shadow-primary-900/10',
        className
      )}
    >
      <span className="absolute left-2 top-2 h-5 w-3 rounded-l-md border-2 border-primary-700 border-r-0" />
      <span className="absolute right-2 top-2 h-5 w-3 rounded-r-md border-2 border-primary-700 border-l-0" />
      <span className="absolute top-[0.62rem] h-[1.15rem] w-px bg-primary-700/70" />
      <span className="absolute bottom-2 h-1 w-4 rounded-full bg-note-blue/20" />
    </span>
  );
}
