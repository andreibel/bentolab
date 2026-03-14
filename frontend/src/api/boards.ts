import {useQuery} from '@tanstack/react-query'
import client from './client'
import {queryKeys} from './queryKeys'
import type {Board, BoardColumn, BoardMember, BoardRole} from '@/types/board'

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

  createColumn: (
    boardId: string,
    data: { name: string; color?: string; wipLimit?: number; isInitial?: boolean; isFinal?: boolean },
  ) =>
    client.post<BoardColumn>(`/api/boards/${boardId}/columns`, data).then((r) => r.data),

  reorderColumns: (boardId: string, columnIds: string[]) =>
    client
      .patch<BoardColumn[]>(`/api/boards/${boardId}/columns/reorder`, { columnIds })
      .then((r) => r.data),

  deleteColumn: (boardId: string, columnId: string) =>
    client.delete(`/api/boards/${boardId}/columns/${columnId}`),

  // ── Members ───────────────────────────────────────────────────────────────

  listMembers: (boardId: string) =>
    client.get<BoardMember[]>(`/api/boards/${boardId}/members`).then((r) => r.data),

  addMember: (boardId: string, userId: string, boardRole: BoardRole) =>
    client.post<BoardMember>(`/api/boards/${boardId}/members`, { userId, boardRole }).then((r) => r.data),

  updateMemberRole: (boardId: string, targetUserId: string, boardRole: BoardRole) =>
    client.patch<BoardMember>(`/api/boards/${boardId}/members/${targetUserId}`, { boardRole }).then((r) => r.data),

  removeMember: (boardId: string, targetUserId: string) =>
    client.delete(`/api/boards/${boardId}/members/${targetUserId}`),
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
