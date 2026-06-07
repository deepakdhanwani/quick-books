package com.quickbooks.dto.audit;

import com.quickbooks.entity.AuditLog;
import com.quickbooks.entity.enums.ActorType;
import com.quickbooks.entity.enums.AuditAction;
import com.quickbooks.entity.enums.AuditEntityType;

import java.time.OffsetDateTime;

public class AuditLogResponse {

    private Long id;
    private ActorType actorType;
    private String actorName;
    private String actorPin;
    private AuditAction action;
    private AuditEntityType entityType;
    private Long entityId;
    private String details;
    private OffsetDateTime createdAt;

    public static AuditLogResponse from(AuditLog log) {
        AuditLogResponse response = new AuditLogResponse();
        response.setId(log.getId());
        response.setActorType(log.getActorType());
        response.setActorName(log.getActorName());
        response.setActorPin(log.getActorPin());
        response.setAction(log.getAction());
        response.setEntityType(log.getEntityType());
        response.setEntityId(log.getEntityId());
        response.setDetails(log.getDetails());
        response.setCreatedAt(log.getCreatedAt());
        return response;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public ActorType getActorType() { return actorType; }
    public void setActorType(ActorType actorType) { this.actorType = actorType; }
    public String getActorName() { return actorName; }
    public void setActorName(String actorName) { this.actorName = actorName; }
    public String getActorPin() { return actorPin; }
    public void setActorPin(String actorPin) { this.actorPin = actorPin; }
    public AuditAction getAction() { return action; }
    public void setAction(AuditAction action) { this.action = action; }
    public AuditEntityType getEntityType() { return entityType; }
    public void setEntityType(AuditEntityType entityType) { this.entityType = entityType; }
    public Long getEntityId() { return entityId; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
