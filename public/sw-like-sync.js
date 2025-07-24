/**
 * Service Worker for offline like synchronization
 * 오프라인 상태에서 좋아요 액션을 저장하고 온라인 복귀 시 동기화
 */

const CACHE_NAME = 'readzone-likes-v1'
const SYNC_TAG = 'background-like-sync'
const OFFLINE_LIKES_STORE = 'offline-likes'

// IndexedDB 설정
const DB_NAME = 'ReadZoneLikes'
const DB_VERSION = 1

/**
 * IndexedDB 초기화
 */
async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      
      // 오프라인 좋아요 저장소
      if (!db.objectStoreNames.contains(OFFLINE_LIKES_STORE)) {
        const store = db.createObjectStore(OFFLINE_LIKES_STORE, { 
          keyPath: 'id',
          autoIncrement: true 
        })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('type', 'type', { unique: false })
      }
    }
  })
}

/**
 * 오프라인 좋아요 액션 저장
 */
async function saveOfflineLike(likeData) {
  try {
    const db = await initDB()
    const transaction = db.transaction([OFFLINE_LIKES_STORE], 'readwrite')
    const store = transaction.objectStore(OFFLINE_LIKES_STORE)
    
    const likeRecord = {
      ...likeData,
      timestamp: Date.now(),
      synced: false
    }
    
    await store.add(likeRecord)
    console.log('Offline like saved:', likeRecord)
    
    // 백그라운드 동기화 등록
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready
      await registration.sync.register(SYNC_TAG)
    }
    
  } catch (error) {
    console.error('Failed to save offline like:', error)
  }
}

/**
 * 저장된 오프라인 좋아요 가져오기
 */
async function getOfflineLikes() {
  try {
    const db = await initDB()
    const transaction = db.transaction([OFFLINE_LIKES_STORE], 'readonly')
    const store = transaction.objectStore(OFFLINE_LIKES_STORE)
    
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result.filter(like => !like.synced))
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Failed to get offline likes:', error)
    return []
  }
}

/**
 * 동기화된 좋아요 표시
 */
async function markLikeSynced(id) {
  try {
    const db = await initDB()
    const transaction = db.transaction([OFFLINE_LIKES_STORE], 'readwrite')
    const store = transaction.objectStore(OFFLINE_LIKES_STORE)
    
    const request = store.get(id)
    request.onsuccess = () => {
      const like = request.result
      if (like) {
        like.synced = true
        store.put(like)
      }
    }
  } catch (error) {
    console.error('Failed to mark like as synced:', error)
  }
}

/**
 * 오프라인 좋아요들을 서버와 동기화
 */
async function syncOfflineLikes() {
  try {
    const offlineLikes = await getOfflineLikes()
    
    if (offlineLikes.length === 0) {
      console.log('No offline likes to sync')
      return
    }
    
    console.log(`Syncing ${offlineLikes.length} offline likes`)
    
    // 배치 요청 구성
    const reviewIds = []
    const commentIds = []
    const actions = {}
    
    offlineLikes.forEach(like => {
      if (like.type === 'review') {
        reviewIds.push(like.targetId)
      } else if (like.type === 'comment') {
        commentIds.push(like.targetId)
      }
      
      const key = `${like.type}-${like.targetId}`
      actions[key] = like.action
    })
    
    const batchRequest = {
      reviewIds,
      commentIds,
      actions
    }
    
    // 서버에 배치 요청 전송
    const response = await fetch('/api/likes/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchRequest)
    })
    
    if (response.ok) {
      const result = await response.json()
      
      if (result.success) {
        // 성공적으로 동기화된 항목들 표시
        for (const like of offlineLikes) {
          await markLikeSynced(like.id)
        }
        
        console.log('Offline likes synced successfully:', result.data.summary)
        
        // 클라이언트에 동기화 완료 알림
        if (self.clients) {
          const clients = await self.clients.matchAll()
          clients.forEach(client => {
            client.postMessage({
              type: 'LIKES_SYNCED',
              data: result.data
            })
          })
        }
      } else {
        console.error('Batch sync failed:', result.error)
      }
    } else {
      console.error('Sync request failed:', response.status, response.statusText)
    }
    
  } catch (error) {
    console.error('Failed to sync offline likes:', error)
  }
}

// Service Worker 이벤트 리스너들

/**
 * 설치 이벤트
 */
self.addEventListener('install', (event) => {
  console.log('Like sync service worker installed')
  
  event.waitUntil(
    initDB().then(() => {
      console.log('IndexedDB initialized')
    })
  )
  
  // 즉시 활성화
  self.skipWaiting()
})

/**
 * 활성화 이벤트
 */
self.addEventListener('activate', (event) => {
  console.log('Like sync service worker activated')
  
  // 모든 클라이언트 제어
  event.waitUntil(self.clients.claim())
})

/**
 * 백그라운드 동기화 이벤트
 */
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    console.log('Background sync triggered for likes')
    event.waitUntil(syncOfflineLikes())
  }
})

/**
 * 메시지 이벤트 (클라이언트로부터)
 */
self.addEventListener('message', (event) => {
  const { type, data } = event.data
  
  switch (type) {
    case 'SAVE_OFFLINE_LIKE':
      event.waitUntil(saveOfflineLike(data))
      break
      
    case 'SYNC_LIKES_NOW':
      event.waitUntil(syncOfflineLikes())
      break
      
    case 'GET_OFFLINE_LIKES_COUNT':
      getOfflineLikes().then(likes => {
        event.ports[0].postMessage({
          type: 'OFFLINE_LIKES_COUNT',
          count: likes.length
        })
      })
      break
      
    default:
      console.log('Unknown message type:', type)
  }
})

/**
 * 네트워크 요청 가로채기 (좋아요 요청만)
 */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // 좋아요 API 요청 감지
  if (url.pathname.includes('/api/reviews/') && url.pathname.endsWith('/like') && event.request.method === 'POST') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        // 네트워크 실패 시 오프라인 저장
        const reviewId = url.pathname.split('/')[3] // /api/reviews/{id}/like
        const likeData = {
          type: 'review',
          targetId: reviewId,
          action: 'toggle', // 실제로는 현재 상태를 확인해야 함
          url: event.request.url
        }
        
        await saveOfflineLike(likeData)
        
        // 낙관적 응답 반환
        return new Response(JSON.stringify({
          success: true,
          offline: true,
          message: '오프라인 상태입니다. 온라인 복귀 시 동기화됩니다.'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      })
    )
  }
})

/**
 * 푸시 메시지 이벤트 (향후 확장용)
 */
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    
    if (data.type === 'LIKE_NOTIFICATION') {
      const options = {
        body: data.message,
        icon: '/icons/heart-icon-192.png',
        badge: '/icons/badge-icon-72.png',
        tag: 'like-notification',
        requireInteraction: false,
        actions: [
          {
            action: 'view',
            title: '보기'
          }
        ]
      }
      
      event.waitUntil(
        self.registration.showNotification(data.title, options)
      )
    }
  }
})

/**
 * 알림 클릭 이벤트
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'view') {
    event.waitUntil(
      self.clients.openWindow(event.notification.data?.url || '/')
    )
  }
})