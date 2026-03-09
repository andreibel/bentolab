import { useQuery } from '@tanstack/react-query'
import client from './client'
import { queryKeys } from './queryKeys'
import type { Board, BoardColumn } from '@/types/board'

export const boardsApi = {
  list: () =>
    client.get<Board[]>('/api/boards').then((r) => r.data),

  get: (boardId: string) =>
    client.get<Board & { columns: BoardColumn[] }>(`/api/boards/${boardId}`).then((r) => r.data),

  create: (data: {
    name: string
    boardKey: string
    boardType: Board['boardType']
    description?: string
    background?: string
  }) => client.post<Board & { columns: BoardColumn[] }>('/api/boards', data).then((r) => r.data),

  update: (boardId: string, data: Partial<Pick<Board, 'name' | 'description' | 'background'>>) =>
    client.patch<Board>(`/api/boards/${boardId}`, data).then((r) => r.data),

  delete: (boardId: string) =>
    client.delete(`/api/boards/${boardId}`),

  columns: (boardId: string) =>
    client.get<BoardColumn[]>(`/api/boards/${boardId}/columns`).then((r) => r.data),
}

export function useBoards() {
  return useQuery({
    queryKey: queryKeys.boards.all(''),
    queryFn: () => boardsApi.list(),
  })
}

export function useBoard(boardId: string) {
  return useQuery({
    queryKey: queryKeys.boards.detail(boardId),
    queryFn: () => boardsApi.get(boardId),
    enabled: !!boardId,
  })
}
