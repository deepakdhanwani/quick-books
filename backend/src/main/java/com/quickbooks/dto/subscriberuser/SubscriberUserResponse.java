package com.quickbooks.dto.subscriberuser;

import com.quickbooks.entity.SubscriberUser;
import com.quickbooks.security.StaffPermissions;

import java.time.OffsetDateTime;
import java.util.List;

public class SubscriberUserResponse {

    private Long id;
    private String name;
    private String loginPin;
    private boolean active;
    private OffsetDateTime createdAt;
    private StaffPermissionsResponse permissions;

    public static SubscriberUserResponse from(SubscriberUser user, List<Long> companyIds) {
        SubscriberUserResponse response = new SubscriberUserResponse();
        response.setId(user.getId());
        response.setName(user.getName());
        response.setLoginPin(user.getLoginPin());
        response.setActive(user.isActive());
        response.setCreatedAt(user.getCreatedAt());
        response.setPermissions(StaffPermissionsResponse.from(StaffPermissions.from(user, companyIds)));
        return response;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getLoginPin() { return loginPin; }
    public void setLoginPin(String loginPin) { this.loginPin = loginPin; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public StaffPermissionsResponse getPermissions() { return permissions; }
    public void setPermissions(StaffPermissionsResponse permissions) { this.permissions = permissions; }
}
