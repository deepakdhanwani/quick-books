package com.quickbooks.service;

import com.quickbooks.config.AppProperties;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/pdf"
    );

    private final Path uploadRoot;

    public FileStorageService(AppProperties appProperties) {
        this.uploadRoot = Paths.get(appProperties.getStorage().getUploadDir()).toAbsolutePath().normalize();
        try {
            Files.createDirectories(uploadRoot);
        } catch (IOException ex) {
            throw new IllegalStateException("Could not create upload directory", ex);
        }
    }

    public StoredFile storePaymentProof(Long subscriberId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment proof file is required");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported file type. Use JPG, PNG, WEBP, or PDF.");
        }

        String originalName = sanitizeFileName(file.getOriginalFilename());
        String storedName = UUID.randomUUID() + "-" + originalName;
        Path targetDir = uploadRoot.resolve("payments").resolve(String.valueOf(subscriberId));
        Path targetFile = targetDir.resolve(storedName).normalize();

        if (!targetFile.startsWith(uploadRoot)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file path");
        }

        try {
            Files.createDirectories(targetDir);
            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not store payment proof");
        }

        return new StoredFile(originalName, uploadRoot.relativize(targetFile).toString().replace('\\', '/'), contentType, targetFile);
    }

    public Path resolveStoredFile(String relativePath) {
        Path resolved = uploadRoot.resolve(relativePath).normalize();
        if (!resolved.startsWith(uploadRoot) || !Files.exists(resolved)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
        }
        return resolved;
    }

    private String sanitizeFileName(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return "proof";
        }
        return fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    public record StoredFile(String originalFileName, String relativePath, String contentType, Path absolutePath) {}
}
