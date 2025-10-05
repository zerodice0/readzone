// Notification Types

export type NotificationType = 'like' | 'comment' | 'reply' | 'follow';

export interface Actor {
  id: string;
  username: string;
  profileImage?: string;
}

export interface TargetReview {
  id: string;
  book: {
    title: string;
    author: string;
  };
}

export interface TargetComment {
  id: string;
  reviewId: string;
  parentId?: string;
}

export interface NotificationTarget {
  type: 'review' | 'comment';
  id: string;
  content: string;
  review?: TargetReview;
  comment?: TargetComment;
}

export interface Notification {
  id: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  actor: Actor;
  additionalActors?: Actor[];
  actorCount?: number;
  target?: NotificationTarget;
  message: string;
  actionUrl: string;
}

export interface NotificationPagination {
  nextCursor?: string;
  hasMore: boolean;
  total: number;
}

export interface NotificationSummary {
  unreadCount: number;
  todayCount: number;
  thisWeekCount: number;
}

export interface NotificationsResponse {
  notifications: Notification[];
  pagination: NotificationPagination;
  summary: NotificationSummary;
}

export interface UpdateNotificationResponse {
  success: boolean;
  notification?: Notification;
  unreadCount: number;
}

export interface BulkUpdateNotificationsResponse {
  success: boolean;
  affectedCount: number;
  unreadCount: number;
}

export interface UnreadCountResponse {
  count: number;
  breakdown: {
    likes: number;
    comments: number;
    follows: number;
  };
  hasNew: boolean;
}

// Request Types

export type NotificationTab = 'all' | 'unread' | 'read';
export type NotificationAction = 'read' | 'unread' | 'delete';

export interface GetNotificationsRequest {
  tab?: NotificationTab;
  type?: NotificationType;
  dateFrom?: string;
  dateTo?: string;
  cursor?: string;
  limit?: number;
}

export interface UpdateNotificationRequest {
  action: NotificationAction;
}

export interface BulkUpdateNotificationsRequest {
  action: NotificationAction;
  notificationIds?: string[];
  type?: NotificationType;
  dateFrom?: string;
  dateTo?: string;
}
