import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  disabled?: boolean
  maxVisiblePages?: number
  className?: string
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
  maxVisiblePages = 5,
  className = ""
}: PaginationControlsProps) {
  if (totalPages <= 1) return null

  const getVisiblePages = () => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const half = Math.floor(maxVisiblePages / 2)
    let start = Math.max(1, currentPage - half)
    let end = Math.min(totalPages, start + maxVisiblePages - 1)

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1)
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  const visiblePages = getVisiblePages()

  return (
    <nav 
      className={`flex justify-center gap-2 ${className}`}
      aria-label="페이지네이션"
    >
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={disabled || currentPage === 1}
        aria-label="이전 페이지"
        className="flex items-center gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        이전
      </Button>
      
      {visiblePages[0] > 1 && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={disabled}
            aria-label="첫 번째 페이지"
          >
            1
          </Button>
          {visiblePages[0] > 2 && (
            <span className="flex items-center px-2 text-gray-500" aria-hidden="true">
              ...
            </span>
          )}
        </>
      )}
      
      {visiblePages.map((pageNumber) => (
        <Button
          key={pageNumber}
          variant={currentPage === pageNumber ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(pageNumber)}
          disabled={disabled}
          aria-label={`페이지 ${pageNumber}`}
          aria-current={currentPage === pageNumber ? "page" : undefined}
        >
          {pageNumber}
        </Button>
      ))}
      
      {visiblePages[visiblePages.length - 1] < totalPages && (
        <>
          {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
            <span className="flex items-center px-2 text-gray-500" aria-hidden="true">
              ...
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={disabled}
            aria-label="마지막 페이지"
          >
            {totalPages}
          </Button>
        </>
      )}
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={disabled || currentPage === totalPages}
        aria-label="다음 페이지"
        className="flex items-center gap-1"
      >
        다음
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  )
}