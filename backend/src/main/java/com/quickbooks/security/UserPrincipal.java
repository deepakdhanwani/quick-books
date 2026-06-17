package com.quickbooks.security;

import com.quickbooks.entity.enums.ActorType;

public class UserPrincipal {

    private final Long subscriberId;
    private final String identifier;
    private final UserRole role;
    private final ActorType actorType;
    private final Long actorId;
    private final String actorName;
    private final String actorPin;
    private Long companyId;

    private StaffPermissions staffPermissions;

    public UserPrincipal(Long subscriberId,
                         String identifier,
                         UserRole role,
                         ActorType actorType,
                         Long actorId,
                         String actorName,
                         String actorPin) {
        this.subscriberId = subscriberId;
        this.identifier = identifier;
        this.role = role;
        this.actorType = actorType;
        this.actorId = actorId;
        this.actorName = actorName;
        this.actorPin = actorPin;
    }

    public static UserPrincipal admin(Long id, String email) {
        return new UserPrincipal(id, email, UserRole.ADMIN, null, id, email, "ADMIN");
    }

    public static UserPrincipal owner(Long subscriberId,
                                      String phone,
                                      String ownerName,
                                      String loginPin) {
        return new UserPrincipal(
                subscriberId,
                phone,
                UserRole.SUBSCRIBER,
                ActorType.OWNER,
                subscriberId,
                ownerName,
                loginPin
        );
    }

    public static UserPrincipal staff(Long subscriberId,
                                      String phone,
                                      Long staffUserId,
                                      String staffName,
                                      String loginPin) {
        return new UserPrincipal(
                subscriberId,
                phone,
                UserRole.SUBSCRIBER,
                ActorType.STAFF,
                staffUserId,
                staffName,
                loginPin
        );
    }

    public Long getId() {
        return subscriberId;
    }

    public Long getSubscriberId() { return subscriberId; }
    public String getIdentifier() { return identifier; }
    public UserRole getRole() { return role; }
    public ActorType getActorType() { return actorType; }
    public Long getActorId() { return actorId; }
    public String getActorName() { return actorName; }
    public String getActorPin() { return actorPin; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public StaffPermissions getStaffPermissions() { return staffPermissions; }
    public void setStaffPermissions(StaffPermissions staffPermissions) { this.staffPermissions = staffPermissions; }

    public boolean isOwner() {
        return actorType == ActorType.OWNER;
    }

    public boolean isStaff() {
        return actorType == ActorType.STAFF;
    }
}
