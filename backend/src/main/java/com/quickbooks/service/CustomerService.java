package com.quickbooks.service;

import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.dto.customer.CreateCustomerRequest;
import com.quickbooks.dto.customer.CustomerResponse;
import com.quickbooks.dto.customer.UpdateCustomerActiveRequest;
import com.quickbooks.dto.customer.UpdateCustomerRequest;
import com.quickbooks.entity.Customer;
import com.quickbooks.entity.Subscriber;
import com.quickbooks.entity.enums.AuditAction;
import com.quickbooks.entity.enums.AuditEntityType;
import com.quickbooks.entity.enums.CustomerType;
import com.quickbooks.repository.CustomerRepository;
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
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final SaleRepository saleRepository;
    private final SubscriberService subscriberService;
    private final AuditLogService auditLogService;

    public CustomerService(CustomerRepository customerRepository,
                           SaleRepository saleRepository,
                           SubscriberService subscriberService,
                           AuditLogService auditLogService) {
        this.customerRepository = customerRepository;
        this.saleRepository = saleRepository;
        this.subscriberService = subscriberService;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public PageResponse<CustomerResponse> findPage(Long subscriberId, int page, int size, Boolean active, String search) {
        int normalizedPage = Math.max(page, 0);
        int normalizedSize = Math.min(Math.max(size, 1), 100);
        String normalizedSearch = normalizeOptional(search);

        Pageable pageable = PageRequest.of(normalizedPage, normalizedSize, Sort.by("name").ascending());
        Page<Customer> result = customerRepository.findBySubscriber(
                subscriberId,
                active,
                normalizedSearch,
                pageable
        );

        List<Long> customerIds = result.getContent().stream().map(Customer::getId).toList();
        Map<Long, BigDecimal> pendingByCustomer = loadPendingAmountsByCustomer(subscriberId, customerIds);

        return PageResponse.from(result.map(customer -> {
            CustomerResponse response = CustomerResponse.from(customer);
            response.setTotalPendingAmount(pendingByCustomer.getOrDefault(customer.getId(), BigDecimal.ZERO));
            return response;
        }));
    }

    private Map<Long, BigDecimal> loadPendingAmountsByCustomer(Long subscriberId, List<Long> customerIds) {
        if (customerIds.isEmpty()) {
            return Map.of();
        }

        return saleRepository.sumPendingAmountsByCustomerIds(subscriberId, customerIds).stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (BigDecimal) row[1]
                ));
    }

    @Transactional(readOnly = true)
    public CustomerResponse getById(Long subscriberId, Long customerId) {
        return CustomerResponse.from(getOwnedCustomer(subscriberId, customerId));
    }

    @Transactional
    public CustomerResponse create(Long subscriberId, CreateCustomerRequest request) {
        Subscriber subscriber = subscriberService.getById(subscriberId);
        String name = normalizeName(request.getName());

        if (customerRepository.existsBySubscriberIdAndNameIgnoreCase(subscriberId, name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Customer with this name already exists");
        }

        Customer customer = new Customer();
        customer.setSubscriber(subscriber);
        applyFields(customer, request, name);
        customer.setActive(request.getActive() == null || request.getActive());

        Customer saved = customerRepository.save(customer);
        auditLogService.log(AuditAction.CREATE, AuditEntityType.CUSTOMER, saved.getId(), saved.getName());
        return CustomerResponse.from(saved);
    }

    @Transactional
    public CustomerResponse update(Long subscriberId, Long customerId, UpdateCustomerRequest request) {
        Customer customer = getOwnedCustomer(subscriberId, customerId);
        String name = normalizeName(request.getName());

        if (customerRepository.existsBySubscriberIdAndNameIgnoreCaseAndIdNot(subscriberId, name, customerId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Customer with this name already exists");
        }

        applyFields(customer, request, name);
        if (request.getActive() != null) {
            customer.setActive(request.getActive());
        }

        Customer saved = customerRepository.save(customer);
        auditLogService.log(AuditAction.UPDATE, AuditEntityType.CUSTOMER, saved.getId(), saved.getName());
        return CustomerResponse.from(saved);
    }

    @Transactional
    public CustomerResponse updateActive(Long subscriberId, Long customerId, UpdateCustomerActiveRequest request) {
        Customer customer = getOwnedCustomer(subscriberId, customerId);
        customer.setActive(request.getActive());
        Customer saved = customerRepository.save(customer);
        auditLogService.log(AuditAction.UPDATE, AuditEntityType.CUSTOMER, saved.getId(),
                saved.getName() + " active=" + saved.isActive());
        return CustomerResponse.from(saved);
    }

    @Transactional
    public void delete(Long subscriberId, Long customerId) {
        Customer customer = getOwnedCustomer(subscriberId, customerId);
        auditLogService.log(AuditAction.DELETE, AuditEntityType.CUSTOMER, customer.getId(), customer.getName());
        customerRepository.delete(customer);
    }

    private Customer getOwnedCustomer(Long subscriberId, Long customerId) {
        return customerRepository.findByIdAndSubscriberId(customerId, subscriberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));
    }

    private String normalizeName(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Customer name is required");
        }
        return name.trim();
    }

    private void applyFields(Customer customer, CreateCustomerRequest request, String name) {
        customer.setName(name);
        customer.setPhone(normalizeOptional(request.getPhone()));
        customer.setEmail(normalizeOptional(request.getEmail()));
        customer.setAddress(normalizeOptional(request.getAddress()));
        applyBusinessFields(customer, request.getCustomerType(), request.getBusinessName(),
                request.getGstNumber(), request.getBusinessDetails());
    }

    private void applyFields(Customer customer, UpdateCustomerRequest request, String name) {
        customer.setName(name);
        customer.setPhone(normalizeOptional(request.getPhone()));
        customer.setEmail(normalizeOptional(request.getEmail()));
        customer.setAddress(normalizeOptional(request.getAddress()));
        applyBusinessFields(customer, request.getCustomerType(), request.getBusinessName(),
                request.getGstNumber(), request.getBusinessDetails());
    }

    private void applyBusinessFields(Customer customer,
                                     CustomerType customerType,
                                     String businessName,
                                     String gstNumber,
                                     String businessDetails) {
        customer.setCustomerType(customerType);
        if (customerType == null || customerType == CustomerType.INDIVIDUAL) {
            customer.setBusinessName(null);
            customer.setGstNumber(null);
            customer.setBusinessDetails(null);
            return;
        }
        customer.setBusinessName(normalizeOptional(businessName));
        customer.setGstNumber(normalizeOptional(gstNumber));
        customer.setBusinessDetails(normalizeOptional(businessDetails));
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
