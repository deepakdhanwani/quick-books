package com.quickbooks.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "taxes")
public class Tax {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private BigDecimal rate;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @ManyToMany
    @JoinTable(
            name = "tax_plans",
            joinColumns = @JoinColumn(name = "tax_id"),
            inverseJoinColumns = @JoinColumn(name = "plan_id")
    )
    private Set<SubscriptionPlan> applicablePlans = new HashSet<>();

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public BigDecimal getRate() { return rate; }
    public void setRate(BigDecimal rate) { this.rate = rate; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Set<SubscriptionPlan> getApplicablePlans() { return applicablePlans; }
    public void setApplicablePlans(Set<SubscriptionPlan> applicablePlans) { this.applicablePlans = applicablePlans; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
