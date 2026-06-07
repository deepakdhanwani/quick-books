package com.quickbooks.controller.admin;

import com.quickbooks.dto.settings.BackupInfoResponse;
import com.quickbooks.dto.settings.DataStatusResponse;
import com.quickbooks.dto.settings.DemoDataJobResponse;
import com.quickbooks.dto.settings.DemoSubscriberResponse;
import com.quickbooks.dto.settings.GenerateDemoDataRequest;
import com.quickbooks.dto.settings.RestoreDatabaseResponse;
import com.quickbooks.dto.settings.TruncateTransactionalRequest;
import com.quickbooks.dto.settings.TruncateTransactionalResponse;
import com.quickbooks.service.AdminDatabaseService;
import com.quickbooks.service.DemoDataService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin/settings")
public class AdminSettingsController {

    private final AdminDatabaseService adminDatabaseService;
    private final DemoDataService demoDataService;

    public AdminSettingsController(AdminDatabaseService adminDatabaseService,
                                    DemoDataService demoDataService) {
        this.adminDatabaseService = adminDatabaseService;
        this.demoDataService = demoDataService;
    }

    @GetMapping("/data-status")
    public DataStatusResponse dataStatus() {
        return adminDatabaseService.getStatus();
    }

    @PostMapping("/truncate-transactional")
    public TruncateTransactionalResponse truncateTransactional(@Valid @org.springframework.web.bind.annotation.RequestBody TruncateTransactionalRequest request) {
        return adminDatabaseService.truncateTransactionalData(request);
    }

    @PostMapping("/backup")
    public BackupInfoResponse createBackup() {
        return adminDatabaseService.createBackup();
    }

    @GetMapping("/backups")
    public List<BackupInfoResponse> listBackups() {
        return adminDatabaseService.listBackups();
    }

    @GetMapping("/backups/{fileName}/download")
    public ResponseEntity<Resource> downloadBackup(@PathVariable String fileName) {
        Resource resource = adminDatabaseService.getBackupFile(fileName);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }

    @PostMapping(value = "/restore", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public RestoreDatabaseResponse restoreDatabase(@RequestPart("file") MultipartFile file,
                                                   @RequestParam("confirmPhrase") String confirmPhrase) {
        return adminDatabaseService.restoreDatabase(file, confirmPhrase);
    }

    @PostMapping("/generate-demo-data")
    public DemoDataJobResponse startDemoDataGeneration(@Valid @org.springframework.web.bind.annotation.RequestBody GenerateDemoDataRequest request) {
        return demoDataService.startGeneration(request);
    }

    @GetMapping("/demo-data-jobs/{jobId}")
    public DemoDataJobResponse getDemoDataJob(@PathVariable String jobId) {
        return demoDataService.getJob(jobId);
    }

    @GetMapping("/demo-subscribers")
    public List<DemoSubscriberResponse> listDemoSubscribers() {
        return demoDataService.listDemoSubscribers();
    }
}
