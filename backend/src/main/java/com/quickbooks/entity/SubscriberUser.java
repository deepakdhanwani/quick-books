package com.quickbooks.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "subscriber_users")
public class SubscriberUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subscriber_id", nullable = false)
    private Subscriber subscriber;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "login_pin_hash", nullable = false)
    private String loginPinHash;

    @Column(name = "login_pin", nullable = false, length = 20)
    private String loginPin;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public Long getId() { return id; }
    public Subscriber getSubscriber() { return subscriber; }
    public void setSubscriber(Subscriber subscriber) { this.subscriber = subscriber; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getLoginPinHash() { return loginPinHash; }
    public void setLoginPinHash(String loginPinHash) { this.loginPinHash = loginPinHash; }
    public String getLoginPin() { return loginPin; }
    public void setLoginPin(String loginPin) { this.loginPin = loginPin; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
