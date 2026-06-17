package com.quickbooks.entity;

import com.quickbooks.entity.enums.PlanDuration;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "subscription_plans")
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PlanDuration duration;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(name = "min_companies", nullable = false)
    private Integer minCompanies = 1;

    @Column(name = "max_companies", nullable = false)
    private Integer maxCompanies = 1;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public PlanDuration getDuration() { return duration; }
    public void setDuration(PlanDuration duration) { this.duration = duration; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public Integer getMinCompanies() { return minCompanies; }
    public void setMinCompanies(Integer minCompanies) { this.minCompanies = minCompanies; }
    public Integer getMaxCompanies() { return maxCompanies; }
    public void setMaxCompanies(Integer maxCompanies) { this.maxCompanies = maxCompanies; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
