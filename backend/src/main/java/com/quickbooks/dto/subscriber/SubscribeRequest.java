package com.quickbooks.dto.subscriber;

import jakarta.validation.constraints.NotNull;

public class SubscribeRequest {

    @NotNull
    private Long planId;

    public Long getPlanId() { return planId; }
    public void setPlanId(Long planId) { this.planId = planId; }
}
