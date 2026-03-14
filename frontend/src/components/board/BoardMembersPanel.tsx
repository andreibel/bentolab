import {useEffect, useMemo, useRef, useState} from 'react'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {toast} from 'sonner'
import Fuse from 'fuse.js'
import {ChevronDown, Code2, Crown, Eye, Loader2, Search, Shield, Trash2, UserPlus, X} from 'lucide-react'
import {boardsApi} from '@/api/boards'
import {orgsApi} from '@/api/orgs'
import {usersApi} from '@/api/users'
import {useAuthStore} from '@/stores/authStore'
import type {BoardRole, UserProfile} from '@/types/board'

interface Props {
  boardId: string
  onClose: () => void
}

const ROLE_OPTIONS: { value: BoardRole; label: string; icon: React.ReactNode }[] = [
  { value: 'PRODUCT_OWNER', label: 'Product Owner', icon: <Crown className="h-3.5 w-3.5" /> },
  { value: 'SCRUM_MASTER',  label: 'Scrum Master',  icon: <Shield className="h-3.5 w-3.5" /> },
  { value: 'DEVELOPER',     label: 'Developer',     icon: <Code2 className="h-3.5 w-3.5" /> },
  { value: 'VIEWER',        label: 'Viewer',        icon: <Eye className="h-3.5 w-3.5" /> },
]

function roleLabel(role: BoardRole) {
  return ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role
}

function UserAvatar({ profile, size = 8 }: { profile: UserProfile | null; size?: number }) {
  const initials = profile
    ? `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase() || profile.email[0].toUpperCase()
    : '?'
  const cls = `h-${size} w-${size} shrink-0 rounded-full flex items-center justify-center text-xs font-semibold`

  if (profile?.avatarUrl) {
    return <img src={profile.avatarUrl} alt="" className={`${cls} object-cover`} />
  }
  return (
    <div className={`${cls} bg-primary-subtle text-primary`}>
      {initials}
    </div>
  )
}

function fullName(profile: UserProfile | null) {
  if (!profile) return 'Unknown user'
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ')
  return name || profile.email
}

export function BoardMembersPanel({ boardId, onClose }: Props) {
  const { currentOrgId, user } = useAuthStore()
  const currentUserId = user?.id
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [addRole, setAddRole] = useState<BoardRole>('DEVELOPER')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  // ── Data fetching ─────────────────────────────────────────────────────────

  const membersKey = ['board-members', boardId]
  const { data: boardMembers = [], isLoading: loadingMembers } = useQuery({
    queryKey: membersKey,
    queryFn: () => boardsApi.listMembers(boardId),
  })

  const { data: orgMembers = [], isLoading: loadingOrgMembers } = useQuery({
    queryKey: ['org-members', currentOrgId],
    queryFn: () => orgsApi.listMembers(currentOrgId!),
    enabled: !!currentOrgId,
  })

  // Collect all user IDs we need profiles for
  const allUserIds = useMemo(() => {
    const boardIds = boardMembers.map((m) => m.userId)
    const orgIds = orgMembers.map((m) => m.userId)
    return [...new Set([...boardIds, ...orgIds])]
  }, [boardMembers, orgMembers])

  const { data: profiles = [] } = useQuery({
    queryKey: ['user-profiles', allUserIds],
    queryFn: () => usersApi.batchGet(allUserIds),
    enabled: allUserIds.length > 0,
  })

  const profileMap = useMemo(() => {
    const map = new Map<string, UserProfile>()
    profiles.forEach((p) => map.set(p.id, p))
    return map
  }, [profiles])

  // ── Derive non-member org users ───────────────────────────────────────────

  const boardMemberIds = useMemo(() => new Set(boardMembers.map((m) => m.userId)), [boardMembers])

  const nonMembers = useMemo(
    () => orgMembers.filter((m) => !boardMemberIds.has(m.userId)),
    [orgMembers, boardMemberIds],
  )

  // Fuse.js for fuzzy search with typo tolerance
  const searchableUsers = useMemo(() =>
    nonMembers.map((m) => {
      const p = profileMap.get(m.userId)
      return {
        userId: m.userId,
        email: p?.email ?? '',
        firstName: p?.firstName ?? '',
        lastName: p?.lastName ?? '',
        fullName: fullName(p),
        profile: p ?? null,
      }
    }),
    [nonMembers, profileMap],
  )

  const fuse = useMemo(() =>
    new Fuse(searchableUsers, {
      keys: ['firstName', 'lastName', 'fullName', 'email'],
      threshold: 0.4,
      includeScore: true,
    }),
    [searchableUsers],
  )

  const filteredNonMembers = useMemo(() => {
    if (!search.trim()) return searchableUsers
    return fuse.search(search).map((r) => r.item)
  }, [search, searchableUsers, fuse])

  // ── Mutations ─────────────────────────────────────────────────────────────

  const addMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      boardsApi.addMember(boardId, userId, addRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersKey })
      toast.success('Member added')
    },
    onError: () => toast.error('Could not add member'),
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: BoardRole }) =>
      boardsApi.updateMemberRole(boardId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersKey })
      toast.success('Role updated')
    },
    onError: () => toast.error('Could not update role'),
  })

  const removeMutation = useMutation({
    mutationFn: (userId: string) => boardsApi.removeMember(boardId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersKey })
      toast.success('Member removed')
    },
    onError: () => toast.error('Could not remove member'),
  })

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full w-80 flex-col border-s border-surface-border bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
        <h2 className="text-sm font-semibold text-text-primary">Members</h2>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-0 overflow-y-auto">
        {/* Current members */}
        <section className="px-4 pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Current members ({boardMembers.length})
          </p>
          {loadingMembers ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
            </div>
          ) : boardMembers.length === 0 ? (
            <p className="py-3 text-xs text-text-muted">No members yet.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {boardMembers.map((m) => {
                const profile = profileMap.get(m.userId) ?? null
                const isSelf = m.userId === currentUserId
                return (
                  <li key={m.id} className="flex items-center gap-2.5 rounded-lg px-1 py-1.5">
                    <UserAvatar profile={profile} size={7} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {fullName(profile)}
                        {isSelf && <span className="ms-1 text-xs text-text-muted">(you)</span>}
                      </p>
                      <p className="truncate text-xs text-text-muted">{profile?.email ?? '…'}</p>
                    </div>
                    <RoleDropdown
                      value={m.boardRole}
                      disabled={isSelf || updateRoleMutation.isPending}
                      onChange={(role) => updateRoleMutation.mutate({ userId: m.userId, role })}
                    />
                    {!isSelf && (
                      <button
                        onClick={() => removeMutation.mutate(m.userId)}
                        disabled={removeMutation.isPending && removeMutation.variables === m.userId}
                        title="Remove from board"
                        className="shrink-0 rounded-lg p-1 text-text-muted transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 disabled:opacity-40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <div className="mx-4 my-3 border-t border-surface-border" />

        {/* Add member */}
        <section className="px-4 pb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Add from org
          </p>

          {/* Search + role selector */}
          <div className="mb-2 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search members…"
                className="w-full rounded-lg border border-surface-border bg-surface py-1.5 ps-8 pe-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <RoleDropdown value={addRole} onChange={setAddRole} compact />
          </div>

          {/* Results */}
          {(loadingMembers || loadingOrgMembers) ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
            </div>
          ) : nonMembers.length === 0 ? (
            <p className="py-3 text-xs text-text-muted">
              All org members are already on this board.{' '}
              <a href="/settings/members" className="text-primary underline hover:no-underline">Invite people to your org</a> first.
            </p>
          ) : filteredNonMembers.length === 0 ? (
            <p className="py-3 text-xs text-text-muted">No matches found.</p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {filteredNonMembers.map(({ userId, profile }) => (
                <li
                  key={userId}
                  className="flex items-center gap-2.5 rounded-lg px-1 py-1.5 transition-colors hover:bg-surface-raised"
                >
                  <UserAvatar profile={profile} size={7} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {fullName(profile)}
                    </p>
                    <p className="truncate text-xs text-text-muted">{profile?.email ?? '…'}</p>
                  </div>
                  <button
                    onClick={() => addMutation.mutate({ userId })}
                    disabled={addMutation.isPending}
                    title="Add to board"
                    className="shrink-0 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-primary-subtle hover:text-primary disabled:opacity-40"
                  >
                    {addMutation.isPending && addMutation.variables?.userId === userId
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <UserPlus className="h-3.5 w-3.5" />
                    }
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

// ── RoleDropdown ─────────────────────────────────────────────────────────────

function RoleDropdown({
  value,
  onChange,
  disabled = false,
  compact = false,
}: {
  value: BoardRole
  onChange: (v: BoardRole) => void
  disabled?: boolean
  compact?: boolean
}) {
  const opt = ROLE_OPTIONS.find((o) => o.value === value)!
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as BoardRole)}
        disabled={disabled}
        className={`appearance-none rounded-md border border-surface-border bg-surface-raised text-xs text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-50 ${
          compact ? 'py-1 ps-2 pe-5' : 'py-0.5 ps-2 pe-6'
        }`}
      >
        {ROLE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute end-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-text-muted" />
    </div>
  )
}
