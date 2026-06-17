package com.quickbooks.dto.monitor;

import com.quickbooks.entity.RequestLog;

import java.time.OffsetDateTime;

public class RequestLogResponse {

    private Long id;
    private OffsetDateTime createdAt;
    private String method;
    private String path;
    private String queryString;
    private int statusCode;
    private long durationMs;
    private String clientIp;
    private String userRole;
    private Long subscriberId;
    private String subscriberName;
    private Long companyId;
    private String companyName;
    private String actorName;
    private String actorType;

    public static RequestLogResponse from(RequestLog log) {
        RequestLogResponse response = new RequestLogResponse();
        response.setId(log.getId());
        response.setCreatedAt(log.getCreatedAt());
        response.setMethod(log.getMethod());
        response.setPath(log.getPath());
        response.setQueryString(log.getQueryString());
        response.setStatusCode(log.getStatusCode());
        response.setDurationMs(log.getDurationMs());
        response.setClientIp(log.getClientIp());
        response.setUserRole(log.getUserRole());
        response.setSubscriberId(log.getSubscriberId());
        response.setSubscriberName(log.getSubscriberName());
        response.setCompanyId(log.getCompanyId());
        response.setCompanyName(log.getCompanyName());
        response.setActorName(log.getActorName());
        response.setActorType(log.getActorType());
        return response;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }
    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }
    public String getQueryString() { return queryString; }
    public void setQueryString(String queryString) { this.queryString = queryString; }
    public int getStatusCode() { return statusCode; }
    public void setStatusCode(int statusCode) { this.statusCode = statusCode; }
    public long getDurationMs() { return durationMs; }
    public void setDurationMs(long durationMs) { this.durationMs = durationMs; }
    public String getClientIp() { return clientIp; }
    public void setClientIp(String clientIp) { this.clientIp = clientIp; }
    public String getUserRole() { return userRole; }
    public void setUserRole(String userRole) { this.userRole = userRole; }
    public Long getSubscriberId() { return subscriberId; }
    public void setSubscriberId(Long subscriberId) { this.subscriberId = subscriberId; }
    public String getSubscriberName() { return subscriberName; }
    public void setSubscriberName(String subscriberName) { this.subscriberName = subscriberName; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public String getActorName() { return actorName; }
    public void setActorName(String actorName) { this.actorName = actorName; }
    public String getActorType() { return actorType; }
    public void setActorType(String actorType) { this.actorType = actorType; }
}
