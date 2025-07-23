// Custom hooks exports
export { useApiCall } from './use-api-call'
export type { ApiError, ApiResponse, UseApiCallOptions, UseApiCallReturn } from './use-api-call'

export { usePaginatedList } from './use-paginated-list'
export type { 
  PaginationInfo, 
  PaginatedResponse, 
  UsePaginatedListOptions, 
  UsePaginatedListReturn 
} from './use-paginated-list'

export { useBookData } from './use-book-data'
export type { UseBookDataReturn } from './use-book-data'

export { useDebounce } from './use-debounce'

export { useAutosave, formatAutosaveStatus } from './use-autosave'
export type { 
  AutosaveStatus,
  SaveStrategy,
  UseAutosaveOptions,
  UseAutosaveReturn
} from './use-autosave'