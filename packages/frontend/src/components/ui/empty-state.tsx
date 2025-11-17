import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';

interface EmptyStateProps {
  /**
   * Icon to display (Lucide icon component)
   */
  icon: LucideIcon;
  /**
   * Title text
   */
  title: string;
  /**
   * Description text
   */
  description: string;
  /**
   * Optional action button
   */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline';
  };
  /**
   * Additional className for container
   */
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-4',
        className
      )}
    >
      {/* Icon container with warm glow */}
      <div className="relative mb-6">
        {/* Warm glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 blur-2xl opacity-10 scale-150" />

        {/* Icon background */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center ring-4 ring-primary-50 ring-opacity-50">
          <Icon
            className="w-10 h-10 sm:w-12 sm:h-12 text-primary-600"
            strokeWidth={1.5}
          />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xl sm:text-2xl font-bold text-stone-900 mb-3">
        {title}
      </h3>

      {/* Description */}
      <p className="text-stone-600 text-sm sm:text-base max-w-md mb-8 leading-relaxed">
        {description}
      </p>

      {/* Action button */}
      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || 'default'}
          size="lg"
          className={cn(
            action.variant !== 'outline' &&
              'bg-primary-500 hover:bg-primary-600 shadow-lg hover:shadow-xl transition-all'
          )}
        >
          {action.label}
        </Button>
      )}

      {/* Decorative element */}
      <div className="mt-12 flex justify-center gap-1.5 opacity-30">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary-400" />
        ))}
      </div>
    </div>
  );
}
