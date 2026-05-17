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
    <div className="paper-surface flex max-w-full gap-1 overflow-x-auto rounded-xl p-1 shadow-sm">
      {periodOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onPeriodChange(option.value)}
          className={cn(
            'shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
            selectedPeriod === option.value
              ? 'bg-[#fffdf8] text-primary-700 shadow-sm ring-1 ring-paper-200'
              : 'text-stone-600 hover:bg-paper-50 hover:text-stone-900'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
