import { cn } from '../../../lib/utils';

export type PeriodOption = '1m' | '3m' | '6m' | '1y' | 'all';

interface PeriodFilterProps {
  selectedPeriod: PeriodOption;
  onPeriodChange: (period: PeriodOption) => void;
}

const periodOptions: { value: PeriodOption; label: string }[] = [
  { value: '1m', label: '1개월' },
  { value: '3m', label: '3개월' },
  { value: '6m', label: '6개월' },
  { value: '1y', label: '1년' },
  { value: 'all', label: '전체' },
];

export function PeriodFilter({
  selectedPeriod,
  onPeriodChange,
}: PeriodFilterProps) {
  return (
    <div className="flex gap-1 p-1 bg-stone-100 rounded-lg">
      {periodOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => onPeriodChange(option.value)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            selectedPeriod === option.value
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
