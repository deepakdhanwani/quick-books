package com.quickbooks.service;

import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.dto.reminder.CreatePaymentReminderRequest;
import com.quickbooks.dto.reminder.PaymentReminderResponse;
import com.quickbooks.dto.reminder.SnoozePaymentReminderRequest;
import com.quickbooks.dto.reminder.UpdatePaymentReminderRequest;
import com.quickbooks.entity.Customer;
import com.quickbooks.entity.Company;
import com.quickbooks.entity.PaymentReminder;
import com.quickbooks.entity.Sale;
import com.quickbooks.entity.Subscriber;
import com.quickbooks.entity.enums.AuditAction;
import com.quickbooks.entity.enums.AuditEntityType;
import com.quickbooks.entity.enums.PaymentReminderStatus;
import com.quickbooks.repository.CustomerRepository;
import com.quickbooks.repository.PaymentReminderRepository;
import com.quickbooks.repository.SaleRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;

@Service
public class PaymentReminderService {

    private static final List<PaymentReminderStatus> ACTIVE_STATUSES =
            List.of(PaymentReminderStatus.PENDING, PaymentReminderStatus.SNOOZED);
    private static final List<PaymentReminderStatus> PAST_STATUSES =
            List.of(PaymentReminderStatus.COMPLETED, PaymentReminderStatus.CANCELLED);

    private final PaymentReminderRepository paymentReminderRepository;
    private final CustomerRepository customerRepository;
    private final SaleRepository saleRepository;
    private final SubscriberService subscriberService;
    private final CompanyService companyService;
    private final AuditLogService auditLogService;

    public PaymentReminderService(PaymentReminderRepository paymentReminderRepository,
                                  CustomerRepository customerRepository,
                                  SaleRepository saleRepository,
                                  SubscriberService subscriberService,
                                  CompanyService companyService,
                                  AuditLogService auditLogService) {
        this.paymentReminderRepository = paymentReminderRepository;
        this.customerRepository = customerRepository;
        this.saleRepository = saleRepository;
        this.subscriberService = subscriberService;
        this.companyService = companyService;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<PaymentReminderResponse> findDueToday(Long subscriberId, Long companyId) {
        LocalDate today = LocalDate.now();
        return paymentReminderRepository.findActiveBySubscriber(subscriberId, companyId, ACTIVE_STATUSES).stream()
                .map(reminder -> PaymentReminderResponse.from(reminder, today))
                .filter(PaymentReminderResponse::isDueToday)
                .sorted(Comparator.comparing(PaymentReminderResponse::getCustomerName))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentReminderResponse> findDueSummary(Long subscriberId, Long companyId) {
        if (companyId == null) {
            return List.of();
        }
        LocalDate today = LocalDate.now();
        return paymentReminderRepository.findDueOrOverdueBySubscriber(
                        subscriberId,
                        companyId,
                        ACTIVE_STATUSES,
                        PaymentReminderStatus.PENDING,
                        PaymentReminderStatus.SNOOZED,
                        today).stream()
                .map(reminder -> PaymentReminderResponse.from(reminder, today))
                .sorted(Comparator
                        .comparing(PaymentReminderResponse::isOverdue)
                        .reversed()
                        .thenComparing(PaymentReminderResponse::getEffectiveDueDate)
                        .thenComparing(PaymentReminderResponse::getCustomerName))
                .toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<PaymentReminderResponse> findPage(
            Long subscriberId,
            Long companyId,
            int page,
            int size,
            String timeFilter) {
        LocalDate today = LocalDate.now();
        int normalizedPage = Math.max(page, 0);
        int normalizedSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(
                normalizedPage,
                normalizedSize,
                Sort.by("promisedDate").ascending().and(Sort.by("id").ascending()));

        Page<PaymentReminder> result = switch (normalizeTimeFilter(timeFilter)) {
            case "past" -> paymentReminderRepository.findPastBySubscriber(
                    subscriberId, companyId, PAST_STATUSES, pageable);
            case "all" -> paymentReminderRepository.findAllBySubscriber(subscriberId, companyId, pageable);
            default -> paymentReminderRepository.findBySubscriberAndStatuses(
                    subscriberId, companyId, ACTIVE_STATUSES, pageable);
        };

        return PageResponse.from(result.map(reminder -> PaymentReminderResponse.from(reminder, today)));
    }

    @Transactional(readOnly = true)
    public PaymentReminderResponse getById(Long subscriberId, Long companyId, Long reminderId) {
        return PaymentReminderResponse.from(getOwnedReminder(subscriberId, companyId, reminderId), LocalDate.now());
    }

    @Transactional
    public PaymentReminderResponse create(Long subscriberId, Long companyId, CreatePaymentReminderRequest request) {
        Subscriber subscriber = subscriberService.getById(subscriberId);
        Company company = companyService.requireAccessibleCompany(subscriberId, companyId);
        Customer customer = getOwnedCustomer(subscriberId, companyId, request.getCustomerId());
        Sale sale = resolveSale(subscriberId, companyId, request.getSaleId(), customer.getId());

        PaymentReminder reminder = new PaymentReminder();
        reminder.setSubscriber(subscriber);
        reminder.setCompany(company);
        applyFields(reminder, customer, sale, request.getAmount(), request.getPromisedDate(), request.getNotes());
        reminder.setStatus(PaymentReminderStatus.PENDING);
        reminder.setSnoozedUntil(null);

        PaymentReminder saved = paymentReminderRepository.save(reminder);
        auditLogService.log(AuditAction.CREATE, AuditEntityType.PAYMENT_REMINDER, saved.getId(),
                customer.getName() + " · " + saved.getPromisedDate());
        return PaymentReminderResponse.from(saved, LocalDate.now());
    }

    @Transactional
    public PaymentReminderResponse update(
            Long subscriberId,
            Long companyId,
            Long reminderId,
            UpdatePaymentReminderRequest request) {
        PaymentReminder reminder = getOwnedReminder(subscriberId, companyId, reminderId);
        if (reminder.getStatus() == PaymentReminderStatus.COMPLETED
                || reminder.getStatus() == PaymentReminderStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Completed reminders cannot be edited");
        }

        Customer customer = getOwnedCustomer(subscriberId, companyId, request.getCustomerId());
        Sale sale = resolveSale(subscriberId, companyId, request.getSaleId(), customer.getId());
        applyFields(reminder, customer, sale, request.getAmount(), request.getPromisedDate(), request.getNotes());
        if (reminder.getStatus() == PaymentReminderStatus.SNOOZED) {
            reminder.setStatus(PaymentReminderStatus.PENDING);
            reminder.setSnoozedUntil(null);
        }
        reminder.setUpdatedAt(OffsetDateTime.now());

        PaymentReminder saved = paymentReminderRepository.save(reminder);
        auditLogService.log(AuditAction.UPDATE, AuditEntityType.PAYMENT_REMINDER, saved.getId(),
                customer.getName() + " · " + saved.getPromisedDate());
        return PaymentReminderResponse.from(saved, LocalDate.now());
    }

    @Transactional
    public PaymentReminderResponse snooze(
            Long subscriberId,
            Long companyId,
            Long reminderId,
            SnoozePaymentReminderRequest request) {
        PaymentReminder reminder = getOwnedReminder(subscriberId, companyId, reminderId);
        if (reminder.getStatus() == PaymentReminderStatus.COMPLETED
                || reminder.getStatus() == PaymentReminderStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This reminder is already closed");
        }

        LocalDate snoozedUntil = request.getSnoozedUntil();
        if (snoozedUntil == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Snooze date is required");
        }
        if (!snoozedUntil.isAfter(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Snooze date must be in the future");
        }

        reminder.setStatus(PaymentReminderStatus.SNOOZED);
        reminder.setSnoozedUntil(snoozedUntil);
        reminder.setUpdatedAt(OffsetDateTime.now());

        PaymentReminder saved = paymentReminderRepository.save(reminder);
        auditLogService.log(AuditAction.UPDATE, AuditEntityType.PAYMENT_REMINDER, saved.getId(),
                "Snoozed until " + snoozedUntil);
        return PaymentReminderResponse.from(saved, LocalDate.now());
    }

    @Transactional
    public PaymentReminderResponse complete(Long subscriberId, Long companyId, Long reminderId) {
        PaymentReminder reminder = getOwnedReminder(subscriberId, companyId, reminderId);
        reminder.setStatus(PaymentReminderStatus.COMPLETED);
        reminder.setSnoozedUntil(null);
        reminder.setUpdatedAt(OffsetDateTime.now());

        PaymentReminder saved = paymentReminderRepository.save(reminder);
        auditLogService.log(AuditAction.UPDATE, AuditEntityType.PAYMENT_REMINDER, saved.getId(), "Completed");
        return PaymentReminderResponse.from(saved, LocalDate.now());
    }

    @Transactional
    public void delete(Long subscriberId, Long companyId, Long reminderId) {
        PaymentReminder reminder = getOwnedReminder(subscriberId, companyId, reminderId);
        auditLogService.log(AuditAction.DELETE, AuditEntityType.PAYMENT_REMINDER, reminder.getId(),
                reminder.getCustomer().getName());
        paymentReminderRepository.delete(reminder);
    }

    private PaymentReminder getOwnedReminder(Long subscriberId, Long companyId, Long reminderId) {
        return paymentReminderRepository.findDetailedByIdAndSubscriberId(reminderId, subscriberId, companyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reminder not found"));
    }

    private Customer getOwnedCustomer(Long subscriberId, Long companyId, Long customerId) {
        return customerRepository.findByIdAndSubscriberIdAndCompanyId(customerId, subscriberId, companyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));
    }

    private Sale resolveSale(Long subscriberId, Long companyId, Long saleId, Long customerId) {
        if (saleId == null) {
            return null;
        }
        Sale sale = saleRepository.findByIdAndSubscriberIdAndCompanyId(saleId, subscriberId, companyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sale not found"));
        if (!sale.getCustomer().getId().equals(customerId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sale does not belong to this customer");
        }
        return sale;
    }

    private void applyFields(
            PaymentReminder reminder,
            Customer customer,
            Sale sale,
            BigDecimal amount,
            LocalDate promisedDate,
            String notes) {
        if (promisedDate == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Promised date is required");
        }

        reminder.setCustomer(customer);
        reminder.setSale(sale);
        reminder.setAmount(normalizeAmount(amount));
        reminder.setPromisedDate(promisedDate);
        reminder.setNotes(normalizeOptional(notes));
    }

    private BigDecimal normalizeAmount(BigDecimal amount) {
        if (amount == null) {
            return null;
        }
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount cannot be negative");
        }
        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeTimeFilter(String timeFilter) {
        if (timeFilter == null || timeFilter.isBlank()) {
            return "active";
        }
        return timeFilter.trim().toLowerCase();
    }
}
