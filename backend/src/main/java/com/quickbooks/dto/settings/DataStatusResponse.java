package com.quickbooks.dto.settings;

import java.time.OffsetDateTime;
import java.util.List;

public class DataStatusResponse {

    private List<TableCountResponse> transactionalTables;
    private List<BackupInfoResponse> backups;
    private OffsetDateTime lastBackupAt;

    public List<TableCountResponse> getTransactionalTables() { return transactionalTables; }
    public void setTransactionalTables(List<TableCountResponse> transactionalTables) {
        this.transactionalTables = transactionalTables;
    }
    public List<BackupInfoResponse> getBackups() { return backups; }
    public void setBackups(List<BackupInfoResponse> backups) { this.backups = backups; }
    public OffsetDateTime getLastBackupAt() { return lastBackupAt; }
    public void setLastBackupAt(OffsetDateTime lastBackupAt) { this.lastBackupAt = lastBackupAt; }
}
