package com.quickbooks.dto.settings;

import java.time.OffsetDateTime;

public class BackupInfoResponse {

    private String fileName;
    private long sizeBytes;
    private OffsetDateTime createdAt;

    public BackupInfoResponse() {}

    public BackupInfoResponse(String fileName, long sizeBytes, OffsetDateTime createdAt) {
        this.fileName = fileName;
        this.sizeBytes = sizeBytes;
        this.createdAt = createdAt;
    }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public long getSizeBytes() { return sizeBytes; }
    public void setSizeBytes(long sizeBytes) { this.sizeBytes = sizeBytes; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
