package com.quickbooks.dto.settings;

public class TableCountResponse {

    private String tableName;
    private String label;
    private long rowCount;

    public TableCountResponse() {}

    public TableCountResponse(String tableName, String label, long rowCount) {
        this.tableName = tableName;
        this.label = label;
        this.rowCount = rowCount;
    }

    public String getTableName() { return tableName; }
    public void setTableName(String tableName) { this.tableName = tableName; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public long getRowCount() { return rowCount; }
    public void setRowCount(long rowCount) { this.rowCount = rowCount; }
}
