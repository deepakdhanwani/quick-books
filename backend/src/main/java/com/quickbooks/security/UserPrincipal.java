package com.quickbooks.security;

public class UserPrincipal {

    private final Long id;
    private final String identifier;
    private final UserRole role;

    public UserPrincipal(Long id, String identifier, UserRole role) {
        this.id = id;
        this.identifier = identifier;
        this.role = role;
    }

    public Long getId() { return id; }
    public String getIdentifier() { return identifier; }
    public UserRole getRole() { return role; }
}
