package io.bento.orgservice.enums;

public enum OrgRoles {
    ORG_MEMBER(0),
    ORG_ADMIN(1),
    ORG_OWNER(2);

    private final int rank;

    OrgRoles(int rank) {
        this.rank = rank;
    }

    public boolean isAtLeast(OrgRoles minimum) {
        return this.rank >= minimum.rank;
    }

    public boolean isHigherThan(OrgRoles minimum) {
        return this.rank > minimum.rank;
    }
}
