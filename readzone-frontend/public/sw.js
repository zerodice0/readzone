const CACHE_NAME = 'readzone-v1';
const STATIC_CACHE_NAME = 'readzone-static-v1';
const DYNAMIC_CACHE_NAME = 'readzone-dynamic-v1';

// 오프라인에서도 접근 가능한 핵심 파일들
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/offline.html',
  // 핵심 CSS와 JS는 빌드 후 자동으로 추가됩니다
];

// 캐시할 API 경로 패턴
const API_CACHE_PATTERNS = [
  '/api/auth/me',
  '/api/posts',
  '/api/library',
  '/api/books',
  '/api/users',
];

// 캐시하지 않을 경로들
const NO_CACHE_PATTERNS = [
  '/api/auth/login',
  '/api/auth/register', 
  '/api/auth/logout',
  '/api/posts/*/like',
  '/api/posts/*/unlike',
];

// 이미지 캐시 설정
const IMAGE_CACHE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30일
const API_CACHE_MAX_AGE = 10 * 60 * 1000; // 10분

// Service Worker 설치
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Service Worker 활성화
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Chrome extension 요청은 무시
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // 캐시하지 않을 패턴 확인
  if (NO_CACHE_PATTERNS.some(pattern => url.pathname.includes(pattern))) {
    return;
  }

  // HTML 요청 처리 (네트워크 우선, 실패시 캐시)
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(handleHTMLRequest(request));
    return;
  }

  // API 요청 처리
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
    return;
  }

  // 이미지 요청 처리
  if (request.headers.get('accept')?.includes('image/')) {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // 정적 자산 처리 (캐시 우선)
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // 기본 네트워크 우선 전략
  event.respondWith(
    fetch(request)
      .catch(() => caches.match(request))
  );
});

// HTML 요청 처리 (네트워크 우선)
async function handleHTMLRequest(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // 오프라인 페이지 반환
    return caches.match('/offline.html');
  }
}

// API 요청 처리 (네트워크 우선, 단기 캐시)
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  const cache = await caches.open(DYNAMIC_CACHE_NAME);

  // GET 요청만 캐시
  if (request.method !== 'GET') {
    try {
      const response = await fetch(request);
      // POST/PUT/DELETE 성공 시 관련 캐시 무효화
      if (response.ok) {
        await invalidateRelatedCache(url.pathname);
      }
      return response;
    } catch (error) {
      throw error;
    }
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // API 응답을 캐시 (단기간)
      const responseClone = networkResponse.clone();
      const responseWithTimestamp = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: {
          ...Object.fromEntries(responseClone.headers.entries()),
          'sw-cached-at': Date.now().toString()
        }
      });
      
      cache.put(request, responseWithTimestamp);
    }
    
    return networkResponse;
  } catch (error) {
    // 네트워크 실패 시 캐시에서 응답
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      const isExpired = cachedAt && (Date.now() - parseInt(cachedAt)) > API_CACHE_MAX_AGE;
      
      if (!isExpired) {
        return cachedResponse;
      }
    }
    
    throw error;
  }
}

// 이미지 요청 처리 (캐시 우선)
async function handleImageRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    const cachedAt = cachedResponse.headers.get('sw-cached-at');
    const isExpired = cachedAt && (Date.now() - parseInt(cachedAt)) > IMAGE_CACHE_MAX_AGE;
    
    if (!isExpired) {
      return cachedResponse;
    }
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      const responseWithTimestamp = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: {
          ...Object.fromEntries(responseClone.headers.entries()),
          'sw-cached-at': Date.now().toString()
        }
      });
      
      cache.put(request, responseWithTimestamp);
    }
    
    return networkResponse;
  } catch (error) {
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// 정적 자산 처리
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(STATIC_CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    throw error;
  }
}

// 정적 자산 판별
function isStaticAsset(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  return pathname.includes('/assets/') ||
         pathname.endsWith('.js') ||
         pathname.endsWith('.css') ||
         pathname.endsWith('.woff2') ||
         pathname.endsWith('.woff') ||
         pathname.endsWith('.ttf');
}

// 관련 캐시 무효화
async function invalidateRelatedCache(pathname) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const keys = await cache.keys();
  
  const keysToDelete = keys.filter(request => {
    const requestUrl = new URL(request.url);
    return requestUrl.pathname.startsWith('/api/') &&
           isRelatedPath(requestUrl.pathname, pathname);
  });

  await Promise.all(
    keysToDelete.map(key => cache.delete(key))
  );
}

// 관련 경로 판별
function isRelatedPath(cachedPath, modifiedPath) {
  // 게시글 관련 캐시 무효화
  if (modifiedPath.includes('/posts/')) {
    return cachedPath.includes('/posts') || 
           cachedPath.includes('/users/') ||
           cachedPath.includes('/library');
  }
  
  // 사용자 관련 캐시 무효화
  if (modifiedPath.includes('/users/')) {
    return cachedPath.includes('/users/') ||
           cachedPath.includes('/posts');
  }
  
  return false;
}

// 백그라운드 동기화
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// 푸시 알림 수신
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  const options = {
    body: '새로운 알림이 있습니다.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '확인하기',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: '닫기',
        icon: '/icons/xmark.png'
      }
    ]
  };

  if (event.data) {
    const payload = event.data.json();
    options.body = payload.body || options.body;
    options.data = { ...options.data, ...payload.data };
  }

  event.waitUntil(
    self.registration.showNotification('ReadZone', options)
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event.action);
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/notifications')
    );
  } else if (event.action === 'close') {
    // 아무것도 하지 않음
  } else {
    // 기본 클릭 (앱 열기)
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// 백그라운드 동기화 실행
async function doBackgroundSync() {
  try {
    // 오프라인 중 저장된 데이터 동기화
    console.log('[SW] Performing background sync...');
    
    // 여기에 오프라인 데이터 동기화 로직 구현
    // 예: IndexedDB에서 대기 중인 요청들을 서버로 전송
    
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}