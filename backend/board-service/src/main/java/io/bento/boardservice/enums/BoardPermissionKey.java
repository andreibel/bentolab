package io.bento.boardservice.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BoardPermissionKey {

    // ── Locked ────────────────────────────────────────────────────────────────
    ADMINISTER_BOARD(
            "Administer Board",
            "Full control over board settings, members, and structure. Cannot be delegated.",
            true),

    VIEW_BOARD(
            "View Board",
            "View the board, all columns, and all issues. All roles always have this.",
            true),

    // ── Configurable ──────────────────────────────────────────────────────────
    CREATE_ISSUES(
            "Create Issues",
            "Create new issues in any column of this board."),

    EDIT_ISSUES(
            "Edit Issues",
            "Edit issue title, description, priority, assignee, and other metadata."),

    DELETE_ISSUES(
            "Delete Issues",
            "Permanently delete issues from the board."),

    MOVE_ISSUES(
            "Move Issues",
            "Move issues between columns (change status)."),

    MANAGE_SPRINTS(
            "Manage Sprints",
            "Create, start, complete, and delete sprints."),

    MANAGE_COLUMNS(
            "Manage Columns",
            "Add, edit, delete, and reorder board columns."),

    MANAGE_BOARD_MEMBERS(
            "Manage Board Members",
            "Add, remove, and change roles of board members."),

    MANAGE_BOARD_SETTINGS(
            "Manage Board Settings",
            "Update board name, description, background, and configuration.");

    private final String label;
    private final String description;
    private final boolean locked;

    BoardPermissionKey(String label, String description) {
        this.label       = label;
        this.description = description;
        this.locked      = false;
    }
}