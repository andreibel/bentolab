import client from './client'
import type {AcceptInvitationResult, InvitationPreview, Org, OrgInvitation, OrgListItem, OrgMember} from '@/types/org'

export const orgsApi = {
  list: () =>
    client.get<OrgListItem[]>('/api/orgs/me').then((r) => r.data),

  create: (data: { name: string; slug: string; description?: string; logoUrl?: string }) =>
    client.post<Org>('/api/orgs', data).then((r) => r.data),

  get: (orgId: string) =>
    client.get<Org>(`/api/orgs/${orgId}`).then((r) => r.data),

  update: (orgId: string, data: Partial<{ name: string; description: string; logoUrl: string }>) =>
    client.patch<Org>(`/api/orgs/${orgId}`, data).then((r) => r.data),

  // ── Members ──────────────────────────────────────────────────────────────

  listMembers: (orgId: string) =>
    client.get<OrgMember[]>(`/api/orgs/${orgId}/members`).then((r) => r.data),

  // ── Invitations ──────────────────────────────────────────────────────────

  /** Send an email-specific invitation (protected — only that email can accept). */
  sendInvitation: (orgId: string, email: string, orgRole: string, message?: string) =>
    client.post<OrgInvitation>(`/api/orgs/${orgId}/invitations`, { email, orgRole, message }).then((r) => r.data),

  /** Generate an open invite link (anyone who has the link can accept). */
  generateInviteLink: (orgId: string, orgRole: string) =>
    client.post<OrgInvitation>(`/api/orgs/${orgId}/invite-link`, { orgRole }).then((r) => r.data),

  /** List invitations for the current org (optionally filter by status). */
  listInvitations: (orgId: string, status?: string) =>
    client.get<OrgInvitation[]>(`/api/orgs/${orgId}/invitations`, { params: status ? { status } : undefined }).then((r) => r.data),

  /** Revoke a pending invitation. */
  revokeInvitation: (orgId: string, invitationId: string) =>
    client.delete(`/api/orgs/${orgId}/invitations/${invitationId}`),

  // ── Member management ────────────────────────────────────────────────────

  updateMemberRole: (orgId: string, userId: string, orgRole: string) =>
    client.patch<OrgMember>(`/api/orgs/${orgId}/members/${userId}/role`, { orgRole }).then((r) => r.data),

  removeMember: (orgId: string, userId: string) =>
    client.delete(`/api/orgs/${orgId}/members/${userId}`),

  // ── Danger zone ──────────────────────────────────────────────────────────

  transferOwnership: (orgId: string, newOwnerId: string) =>
    client.post(`/api/orgs/${orgId}/transfer`, { newOwnerId }),

  deleteOrg: (orgId: string) =>
    client.delete(`/api/orgs/${orgId}`),

  // ── Advanced settings ────────────────────────────────────────────────────

  updateSettings: (orgId: string, settings: Partial<{
    maxUsers: number; maxBoards: number; maxStorageGB: number;
    allowDiscord: boolean; allowExport: boolean; customBranding: boolean; ssoEnabled: boolean;
  }>) => client.patch<Org>(`/api/orgs/${orgId}/settings`, settings).then((r) => r.data),

  /** Public — preview an invitation without being logged in. */
  previewInvitation: (token: string) =>
    client.get<InvitationPreview>(`/api/invitations/${token}/preview`).then((r) => r.data),

  /** Accept an invitation — user must be authenticated. */
  acceptInvitation: (token: string) =>
    client.post<AcceptInvitationResult>(`/api/invitations/${token}/accept`).then((r) => r.data),
}
