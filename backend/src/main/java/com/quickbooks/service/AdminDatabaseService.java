package com.quickbooks.service;

import com.quickbooks.config.AppProperties;
import com.quickbooks.dto.settings.BackupInfoResponse;
import com.quickbooks.dto.settings.DataStatusResponse;
import com.quickbooks.dto.settings.TableCountResponse;
import com.quickbooks.dto.settings.RestoreDatabaseResponse;
import com.quickbooks.dto.settings.TruncateTransactionalRequest;
import com.quickbooks.dto.settings.TruncateTransactionalResponse;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.sql.DataSource;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.locks.ReentrantLock;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

@Service
public class AdminDatabaseService {

    private static final String RESTORE_CONFIRM_PHRASE = "RESTORE DATABASE";
    private static final Pattern JDBC_URL_PATTERN = Pattern.compile(
            "jdbc:postgresql://([^:/]+)(?::(\\d+))?/([^?]+)"
    );

    private static final List<TransactionalTable> TRANSACTIONAL_TABLES = List.of(
            new TransactionalTable("payments", "Payments"),
            new TransactionalTable("sale_items", "Sale Items"),
            new TransactionalTable("sales", "Sales"),
            new TransactionalTable("purchase_items", "Purchase Items"),
            new TransactionalTable("purchases", "Purchases"),
            new TransactionalTable("products", "Products"),
            new TransactionalTable("customers", "Customers"),
            new TransactionalTable("vendors", "Vendors"),
            new TransactionalTable("audit_logs", "Audit Logs"),
            new TransactionalTable("subscriber_subscriptions", "Subscription History")
    );

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;
    private final AppProperties appProperties;
    private final Path backupRoot;
    private final Path uploadRoot;
    private final ReentrantLock operationLock = new ReentrantLock();

    public AdminDatabaseService(JdbcTemplate jdbcTemplate,
                                DataSource dataSource,
                                AppProperties appProperties) {
        this.jdbcTemplate = jdbcTemplate;
        this.dataSource = dataSource;
        this.appProperties = appProperties;
        this.backupRoot = Paths.get(appProperties.getDatabase().getBackupDir()).toAbsolutePath().normalize();
        this.uploadRoot = Paths.get(appProperties.getStorage().getUploadDir()).toAbsolutePath().normalize();
        ensureDirectory(backupRoot, "backup");
    }

    public DataStatusResponse getStatus() {
        DataStatusResponse response = new DataStatusResponse();
        response.setTransactionalTables(loadTransactionalCounts());
        List<BackupInfoResponse> backups = listBackups();
        response.setBackups(backups);
        response.setLastBackupAt(backups.stream()
                .map(BackupInfoResponse::getCreatedAt)
                .max(Comparator.naturalOrder())
                .orElse(null));
        return response;
    }

    @Transactional
    public TruncateTransactionalResponse truncateTransactionalData(TruncateTransactionalRequest request) {
        validateConfirmPhrase(request.getConfirmPhrase(), TruncateTransactionalRequest.CONFIRM_PHRASE);

        return withOperationLock(() -> {
            clearPaymentProofFiles();

            String tableList = String.join(", ", TRANSACTIONAL_TABLES.stream().map(TransactionalTable::tableName).toList());
            jdbcTemplate.execute("TRUNCATE TABLE " + tableList + " RESTART IDENTITY CASCADE");

            List<TableCountResponse> cleared = loadTransactionalCounts();
            return new TruncateTransactionalResponse(
                    "Transactional data truncated successfully.",
                    cleared
            );
        });
    }

    public BackupInfoResponse createBackup() {
        return withOperationLock(() -> {
            DbConnectionInfo connection = resolveConnectionInfo();
            String fileName = "quickbooks-backup-" + Instant.now().toEpochMilli() + ".sql";
            Path targetFile = backupRoot.resolve(fileName).normalize();

            if (!targetFile.startsWith(backupRoot)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid backup path");
            }

            List<String> command = List.of(
                    appProperties.getDatabase().getPgDumpCommand(),
                    "--host", connection.host(),
                    "--port", String.valueOf(connection.port()),
                    "--username", connection.username(),
                    "--dbname", connection.database(),
                    "--clean",
                    "--if-exists",
                    "--no-owner",
                    "--no-acl",
                    "--file", targetFile.toString()
            );

            runExternalCommand(command, Map.of("PGPASSWORD", connection.password()), "Database backup failed");

            try {
                return toBackupInfo(targetFile);
            } catch (IOException ex) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not read backup file metadata");
            }
        });
    }

    public List<BackupInfoResponse> listBackups() {
        if (!Files.exists(backupRoot)) {
            return List.of();
        }

        try (Stream<Path> paths = Files.list(backupRoot)) {
            return paths
                    .filter(Files::isRegularFile)
                    .filter(path -> path.getFileName().toString().endsWith(".sql"))
                    .sorted(Comparator.comparing((Path path) -> {
                        try {
                            return Files.getLastModifiedTime(path).toInstant();
                        } catch (IOException ex) {
                            return Instant.EPOCH;
                        }
                    }).reversed())
                    .map(path -> {
                        try {
                            return toBackupInfo(path);
                        } catch (IOException ex) {
                            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not read backup metadata");
                        }
                    })
                    .toList();
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not list backups");
        }
    }

    public Resource getBackupFile(String fileName) {
        Path resolved = resolveBackupPath(fileName);
        if (!Files.exists(resolved)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Backup not found");
        }
        return new FileSystemResource(resolved);
    }

    public RestoreDatabaseResponse restoreDatabase(MultipartFile file, String confirmPhrase) {
        validateConfirmPhrase(confirmPhrase, RESTORE_CONFIRM_PHRASE);

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Backup file is required");
        }

        String originalName = file.getOriginalFilename();
        if (originalName == null || !originalName.toLowerCase(Locale.ROOT).endsWith(".sql")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Upload a .sql backup file");
        }

        return withOperationLock(() -> {
            Path tempFile = null;
            try {
                tempFile = Files.createTempFile("quickbooks-restore-", ".sql");
                Files.copy(file.getInputStream(), tempFile, StandardCopyOption.REPLACE_EXISTING);

                DbConnectionInfo connection = resolveConnectionInfo();
                List<String> command = List.of(
                        appProperties.getDatabase().getPsqlCommand(),
                        "--host", connection.host(),
                        "--port", String.valueOf(connection.port()),
                        "--username", connection.username(),
                        "--dbname", connection.database(),
                        "--set", "ON_ERROR_STOP=1",
                        "--file", tempFile.toString()
                );

                runExternalCommand(command, Map.of("PGPASSWORD", connection.password()), "Database restore failed");
                return new RestoreDatabaseResponse("Database restored successfully.");
            } catch (IOException ex) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not process backup file");
            } finally {
                if (tempFile != null) {
                    try {
                        Files.deleteIfExists(tempFile);
                    } catch (IOException ignored) {
                        // Best effort cleanup.
                    }
                }
            }
        });
    }

    private List<TableCountResponse> loadTransactionalCounts() {
        List<TableCountResponse> counts = new ArrayList<>();
        for (TransactionalTable table : TRANSACTIONAL_TABLES) {
            Long count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM " + table.tableName(),
                    Long.class
            );
            counts.add(new TableCountResponse(table.tableName(), table.label(), count == null ? 0L : count));
        }
        return counts;
    }

    private void clearPaymentProofFiles() {
        Path paymentsDir = uploadRoot.resolve("payments");
        if (!Files.exists(paymentsDir)) {
            return;
        }

        try (Stream<Path> paths = Files.walk(paymentsDir)) {
            paths.sorted(Comparator.reverseOrder()).forEach(path -> {
                try {
                    Files.deleteIfExists(path);
                } catch (IOException ex) {
                    throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not clear payment proof files");
                }
            });
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not clear payment proof files");
        }
    }

    private BackupInfoResponse toBackupInfo(Path path) throws IOException {
        OffsetDateTime createdAt = OffsetDateTime.ofInstant(
                Files.getLastModifiedTime(path).toInstant(),
                ZoneOffset.UTC
        );
        return new BackupInfoResponse(path.getFileName().toString(), Files.size(path), createdAt);
    }

    private Path resolveBackupPath(String fileName) {
        if (fileName == null || fileName.isBlank() || fileName.contains("/") || fileName.contains("\\") || fileName.contains("..")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid backup file name");
        }

        Path resolved = backupRoot.resolve(fileName).normalize();
        if (!resolved.startsWith(backupRoot)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid backup file name");
        }
        return resolved;
    }

    private DbConnectionInfo resolveConnectionInfo() {
        if (!(dataSource instanceof HikariDataSource hikariDataSource)) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unsupported datasource configuration");
        }

        Matcher matcher = JDBC_URL_PATTERN.matcher(hikariDataSource.getJdbcUrl());
        if (!matcher.find()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not parse database URL");
        }

        String host = matcher.group(1);
        int port = matcher.group(2) == null ? 5432 : Integer.parseInt(matcher.group(2));
        String database = matcher.group(3);
        String username = hikariDataSource.getUsername();
        String password = hikariDataSource.getPassword();

        if (username == null || username.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Database username is not configured");
        }

        return new DbConnectionInfo(host, port, database, username, password == null ? "" : password);
    }

    private void runExternalCommand(List<String> command, Map<String, String> environment, String failureMessage) {
        ProcessBuilder processBuilder = new ProcessBuilder(command);
        processBuilder.redirectErrorStream(true);
        processBuilder.environment().putAll(environment);

        try {
            Process process = processBuilder.start();
            String output;
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                output = reader.lines().reduce((left, right) -> left + System.lineSeparator() + right).orElse("");
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                String detail = output.isBlank() ? "Command exited with code " + exitCode : output.trim();
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, failureMessage + ": " + detail);
            }
        } catch (IOException ex) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    failureMessage + ". Ensure PostgreSQL client tools (pg_dump/psql) are installed and available in PATH."
            );
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, failureMessage + ": operation interrupted");
        }
    }

    private void validateConfirmPhrase(String provided, String expected) {
        if (provided == null || !expected.equals(provided.trim())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Confirmation phrase must be exactly: " + expected
            );
        }
    }

    private void ensureDirectory(Path directory, String label) {
        try {
            Files.createDirectories(directory);
        } catch (IOException ex) {
            throw new IllegalStateException("Could not create " + label + " directory", ex);
        }
    }

    private <T> T withOperationLock(OperationSupplier<T> supplier) {
        if (!operationLock.tryLock()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Another database operation is already in progress");
        }
        try {
            return supplier.get();
        } finally {
            operationLock.unlock();
        }
    }

    @FunctionalInterface
    private interface OperationSupplier<T> {
        T get();
    }

    private record DbConnectionInfo(String host, int port, String database, String username, String password) {}

    private record TransactionalTable(String tableName, String label) {}
}
