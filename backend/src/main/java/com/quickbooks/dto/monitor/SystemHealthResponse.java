package com.quickbooks.dto.monitor;

public class SystemHealthResponse {

    private String status;
    private String service;
    private DatabaseHealth database;
    private JvmHealth jvm;
    private MonitoringHealth monitoring;
    private RequestLogSummaryResponse recentTraffic;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getService() { return service; }
    public void setService(String service) { this.service = service; }
    public DatabaseHealth getDatabase() { return database; }
    public void setDatabase(DatabaseHealth database) { this.database = database; }
    public JvmHealth getJvm() { return jvm; }
    public void setJvm(JvmHealth jvm) { this.jvm = jvm; }
    public MonitoringHealth getMonitoring() { return monitoring; }
    public void setMonitoring(MonitoringHealth monitoring) { this.monitoring = monitoring; }
    public RequestLogSummaryResponse getRecentTraffic() { return recentTraffic; }
    public void setRecentTraffic(RequestLogSummaryResponse recentTraffic) { this.recentTraffic = recentTraffic; }

    public static class DatabaseHealth {
        private String status;
        private long responseTimeMs;

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public long getResponseTimeMs() { return responseTimeMs; }
        public void setResponseTimeMs(long responseTimeMs) { this.responseTimeMs = responseTimeMs; }
    }

    public static class JvmHealth {
        private long heapUsedMb;
        private long heapMaxMb;
        private long uptimeSeconds;

        public long getHeapUsedMb() { return heapUsedMb; }
        public void setHeapUsedMb(long heapUsedMb) { this.heapUsedMb = heapUsedMb; }
        public long getHeapMaxMb() { return heapMaxMb; }
        public void setHeapMaxMb(long heapMaxMb) { this.heapMaxMb = heapMaxMb; }
        public long getUptimeSeconds() { return uptimeSeconds; }
        public void setUptimeSeconds(long uptimeSeconds) { this.uptimeSeconds = uptimeSeconds; }
    }

    public static class MonitoringHealth {
        private long storedLogs;
        private int retentionDays;

        public long getStoredLogs() { return storedLogs; }
        public void setStoredLogs(long storedLogs) { this.storedLogs = storedLogs; }
        public int getRetentionDays() { return retentionDays; }
        public void setRetentionDays(int retentionDays) { this.retentionDays = retentionDays; }
    }
}
