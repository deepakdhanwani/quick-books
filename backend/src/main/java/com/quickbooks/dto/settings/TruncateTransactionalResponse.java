package com.quickbooks.dto.settings;

import java.util.List;

public class TruncateTransactionalResponse {

    private String message;
    private List<TableCountResponse> clearedTables;

    public TruncateTransactionalResponse() {}

    public TruncateTransactionalResponse(String message, List<TableCountResponse> clearedTables) {
        this.message = message;
        this.clearedTables = clearedTables;
    }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public List<TableCountResponse> getClearedTables() { return clearedTables; }
    public void setClearedTables(List<TableCountResponse> clearedTables) { this.clearedTables = clearedTables; }
}
