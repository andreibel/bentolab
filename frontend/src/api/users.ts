import client from './client'
import type { UserProfile } from '@/types/board'

export const usersApi = {
  batchGet: (ids: string[]) =>
    client.post<UserProfile[]>('/api/users/batch', ids).then((r) => r.data),
}
