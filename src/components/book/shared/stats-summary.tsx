import { TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface StatsSummaryProps {
  total: number
  recommendCount: number
  notRecommendCount: number
  recommendationRate: number
  totalLabel?: string
  recommendLabel?: string
  notRecommendLabel?: string
  className?: string
}

export function StatsSummary({
  total,
  recommendCount,
  notRecommendCount,
  recommendationRate,
  totalLabel = "총 항목",
  recommendLabel = "추천",
  notRecommendLabel = "비추천",
  className = ""
}: StatsSummaryProps) {
  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600" aria-label={`${totalLabel} ${total}개`}>
              {total}
            </div>
            <div className="text-sm text-gray-500">{totalLabel}</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600" aria-label={`${recommendLabel} ${recommendCount}개`}>
              {recommendCount}
            </div>
            <div className="text-sm text-gray-500">{recommendLabel}</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600" aria-label={`${notRecommendLabel} ${notRecommendCount}개`}>
              {notRecommendCount}
            </div>
            <div className="text-sm text-gray-500">{notRecommendLabel}</div>
          </div>
        </div>
        
        {total > 0 && (
          <div 
            className="flex items-center gap-2 px-3 py-1 bg-yellow-50 rounded-full"
            role="status"
            aria-label={`추천률 ${Math.round(recommendationRate)}퍼센트`}
          >
            <TrendingUp className="h-4 w-4 text-yellow-600" aria-hidden="true" />
            <span className="text-sm font-medium text-yellow-700">
              추천률 {Math.round(recommendationRate)}%
            </span>
          </div>
        )}
      </div>
    </Card>
  )
}