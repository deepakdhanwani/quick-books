package com.quickbooks.dto.settings;

import com.quickbooks.entity.enums.DemoDataJobStatus;

import java.time.OffsetDateTime;

public class DemoDataJobResponse {

    private String jobId;
    private DemoDataJobStatus status;
    private int progressPercent;
    private String currentStep;
    private String message;
    private DemoDataGenerationResult result;
    private String error;
    private OffsetDateTime startedAt;
    private OffsetDateTime completedAt;

    public String getJobId() { return jobId; }
    public void setJobId(String jobId) { this.jobId = jobId; }
    public DemoDataJobStatus getStatus() { return status; }
    public void setStatus(DemoDataJobStatus status) { this.status = status; }
    public int getProgressPercent() { return progressPercent; }
    public void setProgressPercent(int progressPercent) { this.progressPercent = progressPercent; }
    public String getCurrentStep() { return currentStep; }
    public void setCurrentStep(String currentStep) { this.currentStep = currentStep; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public DemoDataGenerationResult getResult() { return result; }
    public void setResult(DemoDataGenerationResult result) { this.result = result; }
    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
    public OffsetDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(OffsetDateTime startedAt) { this.startedAt = startedAt; }
    public OffsetDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(OffsetDateTime completedAt) { this.completedAt = completedAt; }
}
