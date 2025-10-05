export class ActorDto {
  id: string;
  username: string;
  profileImage?: string;
}

export class TargetReviewDto {
  id: string;
  book: {
    title: string;
    author: string;
  };
}

export class TargetCommentDto {
  id: string;
  reviewId: string;
  parentId?: string;
}

export class NotificationTargetDto {
  type: 'review' | 'comment';
  id: string;
  content: string;
  review?: TargetReviewDto;
  comment?: TargetCommentDto;
}

export class NotificationDto {
  id: string;
  type: 'like' | 'comment' | 'reply' | 'follow';
  isRead: boolean;
  createdAt: string;
  actor: ActorDto;
  additionalActors?: ActorDto[];
  actorCount?: number;
  target?: NotificationTargetDto;
  message: string;
  actionUrl: string;
}

export class PaginationDto {
  nextCursor?: string;
  hasMore: boolean;
  total: number;
}

export class NotificationSummaryDto {
  unreadCount: number;
  todayCount: number;
  thisWeekCount: number;
}

export class NotificationsResponseDto {
  notifications: NotificationDto[];
  pagination: PaginationDto;
  summary: NotificationSummaryDto;
}

export class UpdateNotificationResponseDto {
  success: boolean;
  notification?: NotificationDto;
  unreadCount: number;
}

export class BulkUpdateNotificationsResponseDto {
  success: boolean;
  affectedCount: number;
  unreadCount: number;
}

export class UnreadCountResponseDto {
  count: number;
  breakdown: {
    likes: number;
    comments: number;
    follows: number;
  };
  hasNew: boolean;
}
