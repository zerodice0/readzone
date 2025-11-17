import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LoadingStateProps {
  /**
   * Loading message to display
   */
  message?: string;
  /**
   * Size of the loader
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional className for container
   */
  className?: string;
  /**
   * Full page loading (centered vertically)
   */
  fullPage?: boolean;
}

const sizeMap = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export function LoadingState({
  message = '로딩 중...',
  size = 'md',
  className,
  fullPage = false,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        fullPage ? 'min-h-[60vh]' : 'py-12',
        className
      )}
    >
      {/* Animated loader with warm glow */}
      <div className="relative">
        <div className="absolute inset-0 bg-primary-400 blur-xl opacity-20 animate-pulse" />
        <Loader2
          className={cn(
            'animate-spin text-primary-500 relative',
            sizeMap[size]
          )}
          strokeWidth={2.5}
        />
      </div>

      {/* Loading message */}
      {message && (
        <p className="text-stone-600 text-sm sm:text-base font-medium animate-pulse">
          {message}
        </p>
      )}

      {/* Decorative dots */}
      <div className="flex gap-1.5 mt-2">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-primary-400"
            style={{
              animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
