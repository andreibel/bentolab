import client from './client'
import type {User} from '@/types/auth'
import type {UserProfile} from '@/types/board'

export const usersApi = {
  batchGet: (ids: string[]) =>
    client.post<UserProfile[]>('/api/users/batch', ids).then((r) => r.data),

  updateProfile: (data: { firstName?: string; lastName?: string; avatarUrl?: string }) =>
    client.patch<User>('/api/users/me', data).then((r) => r.data),
}
