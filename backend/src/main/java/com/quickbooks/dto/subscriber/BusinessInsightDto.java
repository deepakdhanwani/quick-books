package com.quickbooks.dto.subscriber;

public class BusinessInsightDto {

    private String type;
    private String priority;
    private String title;
    private String message;
    private String metric;

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getMetric() { return metric; }
    public void setMetric(String metric) { this.metric = metric; }
}
