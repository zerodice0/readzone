'use client'

interface LikeRequest {
  id: string
  type: 'review' | 'comment'
  action: 'like' | 'unlike'
  timestamp: number
  resolve: (result: { isLiked: boolean; likeCount: number }) => void
  reject: (error: Error) => void
}

interface BatchedLikeRequest {
  reviewIds?: string[]
  commentIds?: string[]
  actions: { [key: string]: 'like' | 'unlike' }
}

interface BatchResponse {
  success: boolean
  results: {
    [key: string]: {
      isLiked: boolean
      likeCount: number
      error?: string
    }
  }
}

/**
 * 좋아요 요청을 배치로 처리하여 성능을 최적화하는 매니저
 * 
 * Features:
 * - 동시 요청을 배치로 묶어 네트워크 호출 최소화
 * - 자동 중복 제거 및 최신 액션 우선 처리
 * - 실패한 요청에 대한 자동 재시도
 * - 오프라인 상태 감지 및 큐잉
 * - 성능 메트릭 수집
 */
class LikeBatchManager {
  private queue: Map<string, LikeRequest> = new Map()
  private batchTimeout: NodeJS.Timeout | null = null
  private isProcessing = false
  private retryQueue: LikeRequest[] = []
  private isOnline = true
  
  // 설정값
  private readonly batchDelay = 100 // 100ms 대기 후 배치 처리
  private readonly maxBatchSize = 50 // 최대 배치 크기
  private readonly maxRetries = 3 // 최대 재시도 횟수
  private readonly retryDelay = 1000 // 재시도 간격 (1초)

  constructor() {
    // 온라인/오프라인 상태 감지
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine
      window.addEventListener('online', () => {
        this.isOnline = true
        this.processRetryQueue()
      })
      window.addEventListener('offline', () => {
        this.isOnline = false
      })
    }
  }

  /**
   * 좋아요 요청을 큐에 추가
   */
  async addLikeRequest(
    id: string, 
    type: 'review' | 'comment', 
    currentIsLiked: boolean
  ): Promise<{ isLiked: boolean; likeCount: number }> {
    return new Promise((resolve, reject) => {
      const action = currentIsLiked ? 'unlike' : 'like'
      const key = `${type}-${id}`
      
      // 기존 요청이 있으면 업데이트 (최신 액션으로)
      if (this.queue.has(key)) {
        const existing = this.queue.get(key)!
        existing.action = action
        existing.timestamp = Date.now()
        existing.resolve = resolve
        existing.reject = reject
      } else {
        this.queue.set(key, {
          id,
          type,
          action,
          timestamp: Date.now(),
          resolve,
          reject
        })
      }

      // 배치 처리 스케줄링
      this.scheduleBatch()
    })
  }

  /**
   * 배치 처리 스케줄링
   */
  private scheduleBatch() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
    }

    this.batchTimeout = setTimeout(() => {
      this.processBatch()
    }, this.batchDelay)
  }

  /**
   * 배치 처리 실행
   */
  private async processBatch() {
    if (this.isProcessing || this.queue.size === 0) return
    if (!this.isOnline) {
      // 오프라인 상태에서는 큐를 유지
      return
    }

    this.isProcessing = true
    const startTime = performance.now()

    try {
      // 큐에서 배치 크기만큼 가져오기
      const batchItems = Array.from(this.queue.entries())
        .slice(0, this.maxBatchSize)
      
      if (batchItems.length === 0) {
        this.isProcessing = false
        return
      }

      // 요청 데이터 구성
      const batchRequest = this.buildBatchRequest(batchItems)
      
      // API 호출
      const response = await this.executeBatchRequest(batchRequest)
      
      // 결과 처리
      this.handleBatchResponse(batchItems, response)
      
      // 처리된 항목을 큐에서 제거
      batchItems.forEach(([key]) => this.queue.delete(key))
      
      // 성능 메트릭 기록
      const duration = performance.now() - startTime
      this.recordMetrics(batchItems.length, duration)
      
      // 남은 큐가 있으면 다음 배치 처리
      if (this.queue.size > 0) {
        setTimeout(() => this.processBatch(), 10)
      }
      
    } catch (error) {
      console.error('Batch processing failed:', error)
      
      // 실패한 요청들을 재시도 큐에 추가
      const batchItems = Array.from(this.queue.entries())
        .slice(0, this.maxBatchSize)
      
      batchItems.forEach(([key, request]) => {
        this.retryQueue.push(request)
        this.queue.delete(key)
      })
      
      this.scheduleRetry()
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * 배치 요청 데이터 구성
   */
  private buildBatchRequest(batchItems: [string, LikeRequest][]): BatchedLikeRequest {
    const reviewIds: string[] = []
    const commentIds: string[] = []
    const actions: { [key: string]: 'like' | 'unlike' } = {}

    batchItems.forEach(([key, request]) => {
      if (request.type === 'review') {
        reviewIds.push(request.id)
      } else {
        commentIds.push(request.id)
      }
      actions[key] = request.action
    })

    return {
      ...(reviewIds.length > 0 && { reviewIds }),
      ...(commentIds.length > 0 && { commentIds }),
      actions
    }
  }

  /**
   * 배치 API 요청 실행
   */
  private async executeBatchRequest(batchRequest: BatchedLikeRequest): Promise<BatchResponse> {
    const response = await fetch('/api/likes/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchRequest)
    })

    if (!response.ok) {
      throw new Error(`Batch request failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * 배치 응답 처리
   */
  private handleBatchResponse(batchItems: [string, LikeRequest][], response: BatchResponse) {
    if (!response.success) {
      throw new Error('Batch request was not successful')
    }

    batchItems.forEach(([key, request]) => {
      const result = response.results[key]
      
      if (result) {
        if (result.error) {
          request.reject(new Error(result.error))
        } else {
          request.resolve({
            isLiked: result.isLiked,
            likeCount: result.likeCount
          })
        }
      } else {
        request.reject(new Error('No result found for request'))
      }
    })
  }

  /**
   * 재시도 큐 처리
   */
  private async processRetryQueue() {
    if (this.retryQueue.length === 0 || !this.isOnline) return

    const retryItems = this.retryQueue.splice(0, this.maxBatchSize)
    
    try {
      // 재시도를 위해 큐에 다시 추가
      retryItems.forEach(request => {
        const key = `${request.type}-${request.id}`
        this.queue.set(key, request)
      })
      
      await this.processBatch()
    } catch (error) {
      console.error('Retry processing failed:', error)
      
      // 재시도 횟수 체크 후 재큐잉 또는 실패 처리
      retryItems.forEach(request => {
        const retryCount = (request as any).retryCount || 0
        if (retryCount < this.maxRetries) {
          (request as any).retryCount = retryCount + 1
          this.retryQueue.push(request)
        } else {
          request.reject(new Error('Maximum retry attempts exceeded'))
        }
      })
      
      this.scheduleRetry()
    }
  }

  /**
   * 재시도 스케줄링
   */
  private scheduleRetry() {
    setTimeout(() => {
      this.processRetryQueue()
    }, this.retryDelay)
  }

  /**
   * 성능 메트릭 기록
   */
  private recordMetrics(batchSize: number, duration: number) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`Like batch processed: ${batchSize} items in ${duration.toFixed(2)}ms`)
      
      // Performance API 사용
      if (typeof window !== 'undefined' && window.performance) {
        performance.mark(`like-batch-${Date.now()}`)
      }
    }
  }

  /**
   * 큐 상태 확인
   */
  getQueueStatus() {
    return {
      queueSize: this.queue.size,
      retryQueueSize: this.retryQueue.length,
      isProcessing: this.isProcessing,
      isOnline: this.isOnline
    }
  }

  /**
   * 큐 초기화 (테스트용)
   */
  clearQueue() {
    this.queue.clear()
    this.retryQueue.length = 0
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }
  }
}

// 싱글톤 인스턴스
export const likeBatchManager = new LikeBatchManager()

/**
 * 배치 처리를 사용하는 좋아요 훅
 */
export function useBatchedLike() {
  const toggleLike = async (
    id: string, 
    type: 'review' | 'comment', 
    currentIsLiked: boolean
  ) => {
    try {
      const result = await likeBatchManager.addLikeRequest(id, type, currentIsLiked)
      return result
    } catch (error) {
      console.error('Batched like toggle failed:', error)
      throw error
    }
  }

  const getQueueStatus = () => likeBatchManager.getQueueStatus()

  return {
    toggleLike,
    getQueueStatus
  }
}

export default LikeBatchManager