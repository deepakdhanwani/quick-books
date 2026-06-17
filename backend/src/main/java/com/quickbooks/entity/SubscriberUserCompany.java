package com.quickbooks.entity;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "subscriber_user_companies")
@IdClass(SubscriberUserCompany.SubscriberUserCompanyId.class)
public class SubscriberUserCompany {

    @Id
    @Column(name = "subscriber_user_id")
    private Long subscriberUserId;

    @Id
    @Column(name = "company_id")
    private Long companyId;

    public SubscriberUserCompany() {}

    public SubscriberUserCompany(Long subscriberUserId, Long companyId) {
        this.subscriberUserId = subscriberUserId;
        this.companyId = companyId;
    }

    public Long getSubscriberUserId() { return subscriberUserId; }
    public void setSubscriberUserId(Long subscriberUserId) { this.subscriberUserId = subscriberUserId; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }

    public static class SubscriberUserCompanyId implements Serializable {
        private Long subscriberUserId;
        private Long companyId;

        public SubscriberUserCompanyId() {}

        public SubscriberUserCompanyId(Long subscriberUserId, Long companyId) {
            this.subscriberUserId = subscriberUserId;
            this.companyId = companyId;
        }

        public Long getSubscriberUserId() { return subscriberUserId; }
        public void setSubscriberUserId(Long subscriberUserId) { this.subscriberUserId = subscriberUserId; }
        public Long getCompanyId() { return companyId; }
        public void setCompanyId(Long companyId) { this.companyId = companyId; }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            SubscriberUserCompanyId that = (SubscriberUserCompanyId) o;
            return Objects.equals(subscriberUserId, that.subscriberUserId)
                    && Objects.equals(companyId, that.companyId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(subscriberUserId, companyId);
        }
    }
}
