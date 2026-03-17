import client from './client'
import type {Notification, NotificationPage, UnreadCount} from '@/types/notification'

export const notificationsApi = {
  list: (params?: { unreadOnly?: boolean; page?: number; size?: number }) =>
    client
      .get<NotificationPage>('/api/notifications', { params: { page: 0, size: 40, ...params } })
      .then((r) => r.data),

  unreadCount: () =>
    client.get<UnreadCount>('/api/notifications/unread-count').then((r) => r.data),

  markRead: (id: string) =>
    client.patch<Notification>(`/api/notifications/${id}/read`).then((r) => r.data),

  markAllRead: () =>
    client.patch('/api/notifications/read-all').then((r) => r.data),
}
