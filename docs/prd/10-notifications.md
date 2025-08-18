# 10. 알림 페이지 구현 요구사항

## 페이지 정보
- **경로**: `/notifications`
- **우선순위**: 3순위 (Enhanced Features)
- **설명**: 실시간 알림 목록, 알림 관리, 설정
- **인증**: 로그인 필수

## 📋 참조 문서

### 사용자 플로우
- **[알림 시스템](../user-flows/notifications.md)** - 실시간 알림, 뱃지, 설정 관리
- **[소셜 상호작용](../user-flows/social-interaction.md)** - 알림 발생 트리거 (댓글, 좋아요, 팔로우)
- **[오류 처리](../user-flows/error-handling.md)** - WebSocket 연결 실패, 동기화 오류

### 프로젝트 구조
- **[구현 페이지 목록](../implementation-pages.md)** - 알림의 실시간 상호작용 체인
- **[사용자 흐름도 개요](../user-flows.md)** - 알림 시스템 흐름

### 관련 PRD 문서
- **[설정 페이지](./08-settings.md)** - 알림 설정 및 개인화
- **[독후감 상세 페이지](./05-review-detail.md)** - 댓글, 좋아요 알림 연결
- **[프로필 페이지](./07-profile.md)** - 팔로우 알림 연결
- **[메인 피드 페이지](./01-main-feed.md)** - 헤더 알림 뱃지 연결

## 핵심 기능

### 1. 실시간 알림 시스템
- **WebSocket 연결**: 실시간 알림 수신
- **알림 유형**: 좋아요, 댓글/답글, 팔로우 (3가지 핵심 유형)
- **즉시 반영**: 새 알림 즉시 목록에 추가
- **뱃지 업데이트**: 헤더 알림 뱃지 실시간 동기화

### 2. 알림 목록 관리
- **탭 구분**: 전체, 미읽음, 읽음
- **무한 스크롤**: 페이지당 20개, 가상 스크롤 최적화
- **일괄 처리**: 전체 읽음 처리, 선택 삭제
- **검색 및 필터**: 기간별, 유형별 필터링

### 3. 알림 상호작용
- **클릭 액션**: 관련 콘텐츠로 이동 + 읽음 처리
- **컨텍스트 메뉴**: 개별 읽음/미읽음, 삭제
- **그룹화**: 동일 콘텐츠 여러 반응 그룹화
- **미리보기**: 독후감 일부 내용 미리보기

### 4. 알림 설정
- **알림 유형별 제어**: 좋아요/댓글/팔로우 개별 on/off
- **방해금지 시간**: 특정 시간대 알림 차단
- **이메일 알림**: 중요 알림 이메일 발송
- **푸시 알림**: 브라우저 푸시 알림 (PWA 지원)

## 필요한 API

### GET `/api/notifications`
```typescript
interface NotificationsRequest {
  tab?: 'all' | 'unread' | 'read';
  type?: 'like' | 'comment' | 'follow';
  dateRange?: {
    from?: string;
    to?: string;
  };
  cursor?: string;
  limit?: number;
}

interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    nextCursor?: string;
    hasMore: boolean;
    total: number;
  };
  summary: {
    unreadCount: number;
    todayCount: number;
    thisWeekCount: number;
  };
}

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'reply' | 'follow';
  isRead: boolean;
  createdAt: string;
  
  // 액션 수행자
  actor: {
    id: string;
    username: string;
    profileImage?: string;
  };
  
  // 그룹화된 여러 액션자 (좋아요 여러명)
  additionalActors?: Array<{
    id: string;
    username: string;
    profileImage?: string;
  }>;
  actorCount?: number; // 총 액션자 수
  
  // 대상 콘텐츠
  target?: {
    type: 'review' | 'comment';
    id: string;
    content: string; // 미리보기 텍스트
    
    // 독후감인 경우
    review?: {
      id: string;
      book: {
        title: string;
        author: string;
      };
    };
    
    // 댓글인 경우
    comment?: {
      id: string;
      reviewId: string;
      parentId?: string; // 답글인 경우
    };
  };
  
  // 알림 텍스트 (서버에서 생성)
  message: string;
  actionUrl: string; // 클릭 시 이동할 URL
}
```

### PUT `/api/notifications/[id]`
```typescript
interface UpdateNotificationRequest {
  action: 'read' | 'unread' | 'delete';
}

interface UpdateNotificationResponse {
  success: boolean;
  notification?: Notification;
  unreadCount: number; // 업데이트된 미읽음 수
}
```

### PUT `/api/notifications/bulk`
```typescript
interface BulkUpdateNotificationsRequest {
  action: 'read' | 'delete';
  notificationIds?: string[]; // 미제공 시 전체 대상
  filters?: {
    type?: string;
    dateRange?: {
      from?: string;
      to?: string;
    };
  };
}

interface BulkUpdateNotificationsResponse {
  success: boolean;
  affectedCount: number;
  unreadCount: number; // 업데이트된 미읽음 수
}
```

### GET `/api/notifications/settings`
```typescript
interface NotificationSettingsResponse {
  preferences: {
    likes: {
      enabled: boolean;
      email: boolean;
      push: boolean;
      grouping: boolean; // 같은 콘텐츠 여러 좋아요 그룹화
    };
    comments: {
      enabled: boolean;
      email: boolean;
      push: boolean;
      onlyFromFollowers: boolean;
    };
    follows: {
      enabled: boolean;
      email: boolean;
      push: boolean;
    };
  };
  
  schedule: {
    quietHours: {
      enabled: boolean;
      startTime: string; // "22:00"
      endTime: string;   // "08:00"
      timezone: string;
    };
    weekends: {
      enabled: boolean; // 주말 알림 제한
    };
  };
  
  delivery: {
    emailDigest: {
      enabled: boolean;
      frequency: 'daily' | 'weekly' | 'never';
      time: string; // "09:00"
    };
    pushNotifications: {
      enabled: boolean;
      permission: 'granted' | 'denied' | 'default';
    };
  };
}
```

### PUT `/api/notifications/settings`
```typescript
interface UpdateNotificationSettingsRequest {
  preferences?: Partial<NotificationPreferences>;
  schedule?: Partial<NotificationSchedule>;
  delivery?: Partial<NotificationDelivery>;
}

interface UpdateNotificationSettingsResponse {
  success: boolean;
  settings: NotificationSettingsResponse;
}
```

### GET `/api/notifications/unread-count`
```typescript
interface UnreadCountResponse {
  count: number;
  breakdown: {
    likes: number;
    comments: number;
    follows: number;
  };
  hasNew: boolean; // 마지막 체크 이후 새 알림 여부
}
```

### WebSocket `/ws/notifications`
```typescript
// WebSocket 메시지 타입
interface NotificationWebSocketMessage {
  type: 'new_notification' | 'read_notification' | 'delete_notification';
  payload: {
    notification?: Notification;
    notificationId?: string;
    unreadCount: number;
  };
}
```

## 컴포넌트 구조

### 1. NotificationsPage (메인 컴포넌트)
```typescript
interface NotificationsPageProps {
  initialData?: NotificationsResponse;
}

// 상태 관리
- notifications: Notification[]
- activeTab: 'all' | 'unread' | 'read'
- filter: NotificationFilter
- isLoading: boolean
- hasMore: boolean
- unreadCount: number
- selectedIds: Set<string>
- isSelectionMode: boolean
```

### 2. NotificationTabs (탭 네비게이션)
```typescript
interface NotificationTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  counts: {
    all: number;
    unread: number;
    read: number;
  };
}

// 탭 구성
- 전체 (전체 알림 수)
- 미읽음 (미읽음 뱃지)
- 읽음 (읽은 알림 수)
```

### 3. NotificationFilters (필터링 옵션)
```typescript
interface NotificationFiltersProps {
  filter: NotificationFilter;
  onFilterChange: (filter: NotificationFilter) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

// 필터 옵션
- 알림 유형 (좋아요, 댓글, 팔로우)
- 기간 (오늘, 이번 주, 이번 달, 사용자 지정)
- 읽음 상태 (전체, 읽음, 미읽음)
```

### 4. NotificationList (알림 목록)
```typescript
interface NotificationListProps {
  notifications: Notification[];
  selectedIds: Set<string>;
  isSelectionMode: boolean;
  onNotificationClick: (notification: Notification) => void;
  onNotificationSelect: (id: string) => void;
  onContextMenu: (notification: Notification, action: string) => void;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

// 기능
- 가상 스크롤링 (성능 최적화)
- 무한 스크롤
- 체크박스 선택 (일괄 처리)
- 컨텍스트 메뉴
```

### 5. NotificationItem (개별 알림)
```typescript
interface NotificationItemProps {
  notification: Notification;
  isSelected: boolean;
  isSelectionMode: boolean;
  onSelect: () => void;
  onClick: () => void;
  onContextMenu: (action: string) => void;
}

// 표시 요소
- 액터 프로필 이미지
- 알림 메시지
- 대상 콘텐츠 미리보기
- 상대적 시간 ("5분 전")
- 읽음/미읽음 상태
- 그룹화된 액터들 (+3명 등)
```

### 6. BulkActions (일괄 처리 도구)
```typescript
interface BulkActionsProps {
  selectedCount: number;
  onReadAll: () => Promise<void>;
  onDeleteSelected: () => Promise<void>;
  onSelectAll: () => void;
  onClearSelection: () => void;
  isLoading: boolean;
}

// 일괄 액션
- 전체 선택/해제
- 선택 항목 읽음 처리
- 선택 항목 삭제
- 전체 읽음 처리
```

### 7. NotificationSettings (알림 설정)
```typescript
interface NotificationSettingsProps {
  settings: NotificationSettings;
  onUpdate: (settings: Partial<NotificationSettings>) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
}

// 설정 섹션
- 알림 유형별 제어
- 방해금지 시간
- 이메일 알림 설정
- 푸시 알림 권한
```

## 상태 관리 (Zustand)

### NotificationsStore
```typescript
interface NotificationsState {
  // 상태
  notifications: Notification[];
  unreadCount: number;
  activeTab: string;
  filter: NotificationFilter;
  selectedIds: Set<string>;
  isSelectionMode: boolean;
  
  // UI 상태
  isLoading: boolean;
  hasMore: boolean;
  isConnected: boolean; // WebSocket 연결 상태
  lastUpdate: Date | null;
  
  // 설정
  settings: NotificationSettings | null;
  
  // 액션
  loadNotifications: (tab?: string, filter?: NotificationFilter) => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAsUnread: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  
  // 일괄 처리
  bulkMarkAsRead: (notificationIds?: string[]) => Promise<void>;
  bulkDelete: (notificationIds?: string[]) => Promise<void>;
  
  // 필터링 및 탭
  setActiveTab: (tab: string) => void;
  setFilter: (filter: NotificationFilter) => void;
  
  // 선택 모드
  toggleSelectionMode: () => void;
  selectNotification: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  
  // 실시간 업데이트
  addNotification: (notification: Notification) => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
  removeNotification: (id: string) => void;
  
  // WebSocket
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  
  // 설정
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  
  // 유틸리티
  reset: () => void;
  updateUnreadCount: (count: number) => void;
}
```

## 실시간 알림 시스템

### WebSocket 연결 관리
```typescript
class NotificationWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  
  constructor(
    private onMessage: (message: NotificationWebSocketMessage) => void,
    private onConnectionChange: (connected: boolean) => void
  ) {}
  
  connect() {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      
      this.ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/notifications?token=${token}`);
      
      this.ws.onopen = () => {
        console.log('Notifications WebSocket connected');
        this.reconnectAttempts = 0;
        this.onConnectionChange(true);
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message: NotificationWebSocketMessage = JSON.parse(event.data);
          this.onMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      this.ws.onclose = (event) => {
        console.log('Notifications WebSocket closed:', event.code);
        this.onConnectionChange(false);
        this.handleReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('Notifications WebSocket error:', error);
      };
      
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
  
  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      setTimeout(() => {
        console.log(`Attempting to reconnect WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, delay);
    }
  }
}

// React Hook for WebSocket
const useNotificationWebSocket = () => {
  const { addNotification, updateNotification, removeNotification, updateUnreadCount } = useNotificationsStore();
  const [isConnected, setIsConnected] = useState(false);
  
  const wsRef = useRef<NotificationWebSocket | null>(null);
  
  useEffect(() => {
    const handleMessage = (message: NotificationWebSocketMessage) => {
      switch (message.type) {
        case 'new_notification':
          if (message.payload.notification) {
            addNotification(message.payload.notification);
            // 브라우저 알림 표시
            showBrowserNotification(message.payload.notification);
          }
          updateUnreadCount(message.payload.unreadCount);
          break;
          
        case 'read_notification':
          if (message.payload.notificationId) {
            updateNotification(message.payload.notificationId, { isRead: true });
          }
          updateUnreadCount(message.payload.unreadCount);
          break;
          
        case 'delete_notification':
          if (message.payload.notificationId) {
            removeNotification(message.payload.notificationId);
          }
          updateUnreadCount(message.payload.unreadCount);
          break;
      }
    };
    
    wsRef.current = new NotificationWebSocket(handleMessage, setIsConnected);
    wsRef.current.connect();
    
    return () => {
      wsRef.current?.disconnect();
    };
  }, []);
  
  return { isConnected };
};

// 브라우저 알림 표시
const showBrowserNotification = (notification: Notification) => {
  if (Notification.permission !== 'granted') return;
  
  const title = getNotificationTitle(notification);
  const options: NotificationOptions = {
    body: notification.message,
    icon: notification.actor.profileImage || '/default-avatar.png',
    badge: '/notification-badge.png',
    tag: `notification-${notification.id}`,
    requireInteraction: false,
    silent: false,
  };
  
  const browserNotification = new Notification(title, options);
  
  browserNotification.onclick = () => {
    window.focus();
    window.location.href = notification.actionUrl;
    browserNotification.close();
  };
  
  // 5초 후 자동 닫기
  setTimeout(() => {
    browserNotification.close();
  }, 5000);
};

const getNotificationTitle = (notification: Notification): string => {
  switch (notification.type) {
    case 'like':
      return '새로운 좋아요';
    case 'comment':
      return '새로운 댓글';
    case 'reply':
      return '새로운 답글';
    case 'follow':
      return '새로운 팔로워';
    default:
      return 'ReadZone 알림';
  }
};
```

### 알림 그룹화 로직
```typescript
interface GroupedNotification extends Notification {
  groupKey: string;
  groupedActors: Array<{
    id: string;
    username: string;
    profileImage?: string;
  }>;
  totalActorCount: number;
  isGrouped: boolean;
}

const groupNotifications = (notifications: Notification[]): GroupedNotification[] => {
  const groups = new Map<string, Notification[]>();
  
  // 그룹화 기준: 알림 유형 + 대상 콘텐츠
  notifications.forEach(notification => {
    const groupKey = `${notification.type}-${notification.target?.id || 'no-target'}`;
    
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(notification);
  });
  
  const grouped: GroupedNotification[] = [];
  
  groups.forEach((groupNotifications, groupKey) => {
    if (groupNotifications.length === 1) {
      // 그룹화 불필요
      const notification = groupNotifications[0];
      grouped.push({
        ...notification,
        groupKey,
        groupedActors: [notification.actor],
        totalActorCount: 1,
        isGrouped: false
      });
    } else {
      // 그룹화 처리
      const primaryNotification = groupNotifications[0]; // 최신 알림을 대표로
      const allActors = groupNotifications.map(n => n.actor);
      
      // 중복 제거
      const uniqueActors = allActors.filter((actor, index, self) => 
        self.findIndex(a => a.id === actor.id) === index
      );
      
      const groupedMessage = generateGroupedMessage(
        primaryNotification.type,
        uniqueActors,
        primaryNotification.target
      );
      
      grouped.push({
        ...primaryNotification,
        groupKey,
        groupedActors: uniqueActors,
        totalActorCount: uniqueActors.length,
        isGrouped: true,
        message: groupedMessage,
        // 가장 최근 시간으로 업데이트
        createdAt: Math.max(...groupNotifications.map(n => new Date(n.createdAt).getTime())).toString()
      });
    }
  });
  
  // 시간순 정렬
  return grouped.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

const generateGroupedMessage = (
  type: string,
  actors: Array<{ username: string }>,
  target: any
): string => {
  if (actors.length === 1) {
    return generateSingleMessage(type, actors[0], target);
  }
  
  const actorNames = actors.slice(0, 2).map(a => a.username);
  const remainingCount = actors.length - 2;
  
  switch (type) {
    case 'like':
      return remainingCount > 0
        ? `${actorNames.join(', ')} 외 ${remainingCount}명이 회원님의 독후감을 좋아합니다`
        : `${actorNames.join(', ')}님이 회원님의 독후감을 좋아합니다`;
        
    case 'comment':
      return remainingCount > 0
        ? `${actorNames.join(', ')} 외 ${remainingCount}명이 댓글을 남겼습니다`
        : `${actorNames.join(', ')}님이 댓글을 남겼습니다`;
        
    default:
      return `${actors.length}명의 새로운 알림`;
  }
};
```

## 가상 스크롤링

### 성능 최적화된 리스트
```typescript
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';

const VirtualizedNotificationList: React.FC<{
  notifications: GroupedNotification[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => Promise<void>;
  onNotificationClick: (notification: GroupedNotification) => void;
}> = ({ notifications, hasMore, isLoading, onLoadMore, onNotificationClick }) => {
  const itemCount = hasMore ? notifications.length + 1 : notifications.length;
  
  const isItemLoaded = (index: number) => index < notifications.length;
  
  const loadMoreItems = isLoading ? () => {} : onLoadMore;
  
  const Item = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    if (index >= notifications.length) {
      return (
        <div style={style} className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      );
    }
    
    const notification = notifications[index];
    
    return (
      <div style={style}>
        <NotificationItem
          notification={notification}
          onClick={() => onNotificationClick(notification)}
        />
      </div>
    );
  };
  
  return (
    <div className="h-full">
      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={itemCount}
        loadMoreItems={loadMoreItems}
        threshold={5} // 5개 남았을 때 미리 로드
      >
        {({ onItemsRendered, ref }) => (
          <List
            ref={ref}
            height={600} // 고정 높이
            itemCount={itemCount}
            itemSize={120} // 각 알림 아이템 높이
            onItemsRendered={onItemsRendered}
            overscanCount={5} // 화면 밖 렌더링할 아이템 수
          >
            {Item}
          </List>
        )}
      </InfiniteLoader>
    </div>
  );
};
```

## 알림 설정 UI

### 통합 알림 설정 패널
```typescript
const NotificationSettingsPanel: React.FC<{
  settings: NotificationSettings;
  onUpdate: (settings: Partial<NotificationSettings>) => Promise<void>;
}> = ({ settings, onUpdate }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const handleSettingChange = (path: string, value: any) => {
    const newSettings = { ...localSettings };
    
    // 중첩 객체 업데이트
    const pathParts = path.split('.');
    let current = newSettings;
    for (let i = 0; i < pathParts.length - 1; i++) {
      current = current[pathParts[i]];
    }
    current[pathParts[pathParts.length - 1]] = value;
    
    setLocalSettings(newSettings);
    setHasChanges(true);
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(localSettings);
      setHasChanges(false);
      toast.success('알림 설정이 저장되었습니다');
    } catch (error) {
      toast.error('설정 저장에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };
  
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      handleSettingChange('delivery.pushNotifications.permission', permission);
      
      if (permission === 'granted') {
        handleSettingChange('delivery.pushNotifications.enabled', true);
      }
    }
  };
  
  return (
    <div className="space-y-8">
      {/* 알림 유형별 설정 */}
      <section>
        <h3 className="text-lg font-semibold mb-4">알림 유형</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">좋아요 알림</h4>
              <p className="text-sm text-gray-600">독후감이나 댓글에 좋아요를 받았을 때</p>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localSettings.preferences.likes.enabled}
                  onChange={(e) => handleSettingChange('preferences.likes.enabled', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="ml-2 text-sm">앱 알림</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localSettings.preferences.likes.email}
                  onChange={(e) => handleSettingChange('preferences.likes.email', e.target.checked)}
                  disabled={!localSettings.preferences.likes.enabled}
                  className="rounded border-gray-300"
                />
                <span className="ml-2 text-sm">이메일</span>
              </label>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">댓글 알림</h4>
              <p className="text-sm text-gray-600">독후감에 새 댓글이 달렸을 때</p>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localSettings.preferences.comments.enabled}
                  onChange={(e) => handleSettingChange('preferences.comments.enabled', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="ml-2 text-sm">앱 알림</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localSettings.preferences.comments.email}
                  onChange={(e) => handleSettingChange('preferences.comments.email', e.target.checked)}
                  disabled={!localSettings.preferences.comments.enabled}
                  className="rounded border-gray-300"
                />
                <span className="ml-2 text-sm">이메일</span>
              </label>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">팔로우 알림</h4>
              <p className="text-sm text-gray-600">새로운 팔로워가 생겼을 때</p>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localSettings.preferences.follows.enabled}
                  onChange={(e) => handleSettingChange('preferences.follows.enabled', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="ml-2 text-sm">앱 알림</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localSettings.preferences.follows.email}
                  onChange={(e) => handleSettingChange('preferences.follows.email', e.target.checked)}
                  disabled={!localSettings.preferences.follows.enabled}
                  className="rounded border-gray-300"
                />
                <span className="ml-2 text-sm">이메일</span>
              </label>
            </div>
          </div>
        </div>
      </section>
      
      {/* 방해금지 시간 */}
      <section>
        <h3 className="text-lg font-semibold mb-4">방해금지 시간</h3>
        
        <div className="p-4 border rounded-lg space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localSettings.schedule.quietHours.enabled}
              onChange={(e) => handleSettingChange('schedule.quietHours.enabled', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="ml-2 font-medium">방해금지 시간 설정</span>
          </label>
          
          {localSettings.schedule.quietHours.enabled && (
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">시작 시간</label>
                <input
                  type="time"
                  value={localSettings.schedule.quietHours.startTime}
                  onChange={(e) => handleSettingChange('schedule.quietHours.startTime', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">종료 시간</label>
                <input
                  type="time"
                  value={localSettings.schedule.quietHours.endTime}
                  onChange={(e) => handleSettingChange('schedule.quietHours.endTime', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded"
                />
              </div>
            </div>
          )}
        </div>
      </section>
      
      {/* 푸시 알림 */}
      <section>
        <h3 className="text-lg font-semibold mb-4">푸시 알림</h3>
        
        <div className="p-4 border rounded-lg">
          {localSettings.delivery.pushNotifications.permission === 'granted' ? (
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localSettings.delivery.pushNotifications.enabled}
                onChange={(e) => handleSettingChange('delivery.pushNotifications.enabled', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="ml-2">브라우저 푸시 알림 받기</span>
            </label>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-600">
                브라우저 푸시 알림을 받으려면 권한을 허용해주세요.
              </p>
              <button
                onClick={requestNotificationPermission}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                알림 권한 요청
              </button>
            </div>
          )}
        </div>
      </section>
      
      {/* 저장 버튼 */}
      {hasChanges && (
        <div className="sticky bottom-0 bg-white border-t p-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSaving ? '저장 중...' : '설정 저장'}
          </button>
        </div>
      )}
    </div>
  );
};
```

## 접근성

### 스크린 리더 지원
```typescript
// 알림 목록 ARIA 라벨링
<main role="main" aria-labelledby="notifications-title">
  <h1 id="notifications-title" className="sr-only">알림</h1>
  
  <nav role="tablist" aria-label="알림 필터">
    <button
      role="tab"
      aria-selected={activeTab === 'all'}
      aria-controls="all-notifications"
      id="all-tab"
    >
      전체 <span className="sr-only">{notifications.length}개</span>
    </button>
  </nav>
  
  <div
    role="tabpanel"
    id="all-notifications"
    aria-labelledby="all-tab"
  >
    <ul role="list" aria-label="알림 목록">
      {notifications.map(notification => (
        <li key={notification.id} role="listitem">
          <article
            tabIndex={0}
            onClick={() => handleNotificationClick(notification)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleNotificationClick(notification);
              }
            }}
            aria-describedby={`notification-${notification.id}-desc`}
            className={`focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              !notification.isRead ? 'font-semibold' : ''
            }`}
          >
            <div id={`notification-${notification.id}-desc`} className="sr-only">
              {notification.message}, {formatRelativeTime(notification.createdAt)}, 
              {notification.isRead ? '읽음' : '읽지 않음'}
            </div>
            
            {/* 알림 내용 */}
            <div aria-hidden="true">
              {notification.message}
            </div>
          </article>
        </li>
      ))}
    </ul>
  </div>
</main>
```

## 성능 목표

### Core Web Vitals
- **LCP**: < 2.5초 (알림 목록 렌더링)
- **FID**: < 100ms (알림 클릭 응답성)
- **CLS**: < 0.1 (실시간 알림 추가 시 레이아웃 안정성)

### 사용자 경험 지표
- 초기 로딩: < 1.5초
- 실시간 알림 표시: < 200ms
- 일괄 처리 응답: < 1초
- 설정 저장 응답: < 800ms
- WebSocket 재연결: < 3초