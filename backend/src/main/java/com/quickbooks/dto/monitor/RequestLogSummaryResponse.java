package com.quickbooks.dto.monitor;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

public class RequestLogSummaryResponse {

    private OffsetDateTime windowStart;
    private OffsetDateTime windowEnd;
    private int windowMinutes;
    private long totalRequests;
    private long errorCount;
    private long slowCount;
    private double avgDurationMs;
    private long maxDurationMs;
    private List<SlowEndpointStat> slowestEndpoints = new ArrayList<>();

    public OffsetDateTime getWindowStart() { return windowStart; }
    public void setWindowStart(OffsetDateTime windowStart) { this.windowStart = windowStart; }
    public OffsetDateTime getWindowEnd() { return windowEnd; }
    public void setWindowEnd(OffsetDateTime windowEnd) { this.windowEnd = windowEnd; }
    public int getWindowMinutes() { return windowMinutes; }
    public void setWindowMinutes(int windowMinutes) { this.windowMinutes = windowMinutes; }
    public long getTotalRequests() { return totalRequests; }
    public void setTotalRequests(long totalRequests) { this.totalRequests = totalRequests; }
    public long getErrorCount() { return errorCount; }
    public void setErrorCount(long errorCount) { this.errorCount = errorCount; }
    public long getSlowCount() { return slowCount; }
    public void setSlowCount(long slowCount) { this.slowCount = slowCount; }
    public double getAvgDurationMs() { return avgDurationMs; }
    public void setAvgDurationMs(double avgDurationMs) { this.avgDurationMs = avgDurationMs; }
    public long getMaxDurationMs() { return maxDurationMs; }
    public void setMaxDurationMs(long maxDurationMs) { this.maxDurationMs = maxDurationMs; }
    public List<SlowEndpointStat> getSlowestEndpoints() { return slowestEndpoints; }
    public void setSlowestEndpoints(List<SlowEndpointStat> slowestEndpoints) { this.slowestEndpoints = slowestEndpoints; }

    public static class SlowEndpointStat {
        private String method;
        private String path;
        private long requestCount;
        private double avgDurationMs;
        private long maxDurationMs;

        public String getMethod() { return method; }
        public void setMethod(String method) { this.method = method; }
        public String getPath() { return path; }
        public void setPath(String path) { this.path = path; }
        public long getRequestCount() { return requestCount; }
        public void setRequestCount(long requestCount) { this.requestCount = requestCount; }
        public double getAvgDurationMs() { return avgDurationMs; }
        public void setAvgDurationMs(double avgDurationMs) { this.avgDurationMs = avgDurationMs; }
        public long getMaxDurationMs() { return maxDurationMs; }
        public void setMaxDurationMs(long maxDurationMs) { this.maxDurationMs = maxDurationMs; }
    }
}
