package io.bento.orgservice.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum OrgPermissionKey {

    // ── Locked: ORG_OWNER always — cannot be changed ─────────────────────────
    ADMINISTER_ORG(
            "Administer Organization",
            "Full access to all settings, billing, and data. Cannot be delegated.",
            true),

    // ── Configurable ──────────────────────────────────────────────────────────
    MANAGE_MEMBERS(
            "Manage Members",
            "Invite, remove, and change roles of organization members."),

    MANAGE_INVITATIONS(
            "Manage Invitations",
            "Send and revoke member invitations."),

    MANAGE_BOARDS(
            "Manage Boards",
            "Create, archive, and delete boards across the organization."),

    MANAGE_ORG_SETTINGS(
            "Manage Org Settings",
            "Update organization name, logo, description, and general settings."),

    VIEW_ALL_BOARDS(
            "View All Boards",
            "See all boards regardless of individual board membership."),

    MANAGE_LABELS(
            "Manage Labels",
            "Create, edit, and delete organization-wide labels."),

    VIEW_MEMBERS(
            "View Members",
            "See the full list of organization members and their roles.");

    private final String label;
    private final String description;
    private final boolean locked;

    OrgPermissionKey(String label, String description) {
        this.label       = label;
        this.description = description;
        this.locked      = false;
    }
}