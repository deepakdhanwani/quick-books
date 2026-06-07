package com.quickbooks.entity;

import com.quickbooks.entity.enums.AppFontSize;
import com.quickbooks.entity.enums.AppTheme;
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

    @Enumerated(EnumType.STRING)
    @Column(name = "theme_mode", nullable = false)
    private AppTheme themeMode = AppTheme.DARK;

    @Enumerated(EnumType.STRING)
    @Column(name = "font_size", nullable = false)
    private AppFontSize fontSize = AppFontSize.SMALL;

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
    public AppTheme getThemeMode() { return themeMode; }
    public void setThemeMode(AppTheme themeMode) { this.themeMode = themeMode; }
    public AppFontSize getFontSize() { return fontSize; }
    public void setFontSize(AppFontSize fontSize) { this.fontSize = fontSize; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
