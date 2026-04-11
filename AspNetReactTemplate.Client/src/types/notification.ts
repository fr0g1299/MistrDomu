export interface NotificationListItem {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
}

export interface NotificationPage {
  items: NotificationListItem[];
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  unreadCount: number;
}

export interface NotificationListQuery {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
}

