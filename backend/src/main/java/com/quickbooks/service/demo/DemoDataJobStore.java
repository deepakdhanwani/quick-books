package com.quickbooks.service.demo;

import com.quickbooks.dto.settings.DemoDataGenerationResult;
import com.quickbooks.dto.settings.DemoDataJobResponse;
import com.quickbooks.entity.enums.DemoDataJobStatus;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class DemoDataJobStore {

    private final Map<String, DemoDataJobState> jobs = new ConcurrentHashMap<>();

    public DemoDataJobState create(String jobId) {
        DemoDataJobState state = new DemoDataJobState(jobId);
        jobs.put(jobId, state);
        return state;
    }

    public DemoDataJobState getRequired(String jobId) {
        DemoDataJobState state = jobs.get(jobId);
        if (state == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Demo data job not found");
        }
        return state;
    }

    public DemoDataJobResponse toResponse(DemoDataJobState state) {
        DemoDataJobResponse response = new DemoDataJobResponse();
        response.setJobId(state.getJobId());
        response.setStatus(state.getStatus());
        response.setProgressPercent(state.getProgressPercent());
        response.setCurrentStep(state.getCurrentStep());
        response.setMessage(state.getMessage());
        response.setResult(state.getResult());
        response.setError(state.getError());
        response.setStartedAt(state.getStartedAt());
        response.setCompletedAt(state.getCompletedAt());
        return response;
    }

    public static class DemoDataJobState {
        private final String jobId;
        private DemoDataJobStatus status = DemoDataJobStatus.PENDING;
        private int progressPercent;
        private String currentStep = "Queued";
        private String message = "Waiting to start";
        private DemoDataGenerationResult result;
        private String error;
        private final OffsetDateTime startedAt = OffsetDateTime.now();
        private OffsetDateTime completedAt;

        public DemoDataJobState(String jobId) {
            this.jobId = jobId;
        }

        public synchronized void update(int progressPercent, String currentStep, String message) {
            this.progressPercent = progressPercent;
            this.currentStep = currentStep;
            this.message = message;
            if (this.status == DemoDataJobStatus.PENDING) {
                this.status = DemoDataJobStatus.RUNNING;
            }
        }

        public synchronized void complete(DemoDataGenerationResult result) {
            this.status = DemoDataJobStatus.COMPLETED;
            this.progressPercent = 100;
            this.currentStep = "Completed";
            this.message = "Demo data generated successfully";
            this.result = result;
            this.completedAt = OffsetDateTime.now();
        }

        public synchronized void fail(String error) {
            this.status = DemoDataJobStatus.FAILED;
            this.error = error;
            this.message = error;
            this.completedAt = OffsetDateTime.now();
        }

        public String getJobId() { return jobId; }
        public DemoDataJobStatus getStatus() { return status; }
        public int getProgressPercent() { return progressPercent; }
        public String getCurrentStep() { return currentStep; }
        public String getMessage() { return message; }
        public DemoDataGenerationResult getResult() { return result; }
        public String getError() { return error; }
        public OffsetDateTime getStartedAt() { return startedAt; }
        public OffsetDateTime getCompletedAt() { return completedAt; }
    }
}
