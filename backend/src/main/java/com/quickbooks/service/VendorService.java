package com.quickbooks.service;

import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.dto.vendor.CreateVendorRequest;
import com.quickbooks.dto.vendor.UpdateVendorActiveRequest;
import com.quickbooks.dto.vendor.UpdateVendorRequest;
import com.quickbooks.dto.vendor.VendorResponse;
import com.quickbooks.entity.Subscriber;
import com.quickbooks.entity.Vendor;
import com.quickbooks.entity.enums.AuditAction;
import com.quickbooks.entity.enums.AuditEntityType;
import com.quickbooks.entity.enums.CustomerType;
import com.quickbooks.entity.enums.OpeningBalanceNature;
import com.quickbooks.repository.PurchaseRepository;
import com.quickbooks.repository.VendorRepository;
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
public class VendorService {

    private final VendorRepository vendorRepository;
    private final PurchaseRepository purchaseRepository;
    private final SubscriberService subscriberService;
    private final AuditLogService auditLogService;

    public VendorService(VendorRepository vendorRepository,
                         PurchaseRepository purchaseRepository,
                         SubscriberService subscriberService,
                         AuditLogService auditLogService) {
        this.vendorRepository = vendorRepository;
        this.purchaseRepository = purchaseRepository;
        this.subscriberService = subscriberService;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public PageResponse<VendorResponse> findPage(Long subscriberId, int page, int size, Boolean active, String search) {
        int normalizedPage = Math.max(page, 0);
        int normalizedSize = Math.min(Math.max(size, 1), 100);
        String normalizedSearch = normalizeOptional(search);

        Pageable pageable = PageRequest.of(normalizedPage, normalizedSize, Sort.by("name").ascending());
        Page<Vendor> result = vendorRepository.findBySubscriber(
                subscriberId,
                active,
                normalizedSearch,
                pageable
        );

        List<Long> vendorIds = result.getContent().stream().map(Vendor::getId).toList();
        Map<Long, BigDecimal> pendingByVendor = loadPendingAmountsByVendor(subscriberId, vendorIds);

        return PageResponse.from(result.map(vendor -> {
            VendorResponse response = VendorResponse.from(vendor);
            response.setTotalPendingAmount(computeVendorOutstanding(
                    vendor,
                    pendingByVendor.getOrDefault(vendor.getId(), BigDecimal.ZERO)));
            return response;
        }));
    }

    private Map<Long, BigDecimal> loadPendingAmountsByVendor(Long subscriberId, List<Long> vendorIds) {
        if (vendorIds.isEmpty()) {
            return Map.of();
        }

        return purchaseRepository.sumPendingAmountsByVendorIds(subscriberId, vendorIds).stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (BigDecimal) row[1]
                ));
    }

    @Transactional(readOnly = true)
    public VendorResponse getById(Long subscriberId, Long vendorId) {
        Vendor vendor = getOwnedVendor(subscriberId, vendorId);
        VendorResponse response = VendorResponse.from(vendor);
        response.setTotalPendingAmount(computeVendorOutstanding(
                vendor,
                loadPendingAmountsByVendor(subscriberId, List.of(vendorId))
                        .getOrDefault(vendorId, BigDecimal.ZERO)));
        return response;
    }

    @Transactional
    public VendorResponse create(Long subscriberId, CreateVendorRequest request) {
        Subscriber subscriber = subscriberService.getById(subscriberId);
        String name = normalizeName(request.getName());

        if (vendorRepository.existsBySubscriberIdAndNameIgnoreCase(subscriberId, name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Vendor with this name already exists");
        }

        Vendor vendor = new Vendor();
        vendor.setSubscriber(subscriber);
        applyFields(vendor, request, name);
        vendor.setActive(request.getActive() == null || request.getActive());

        Vendor saved = vendorRepository.save(vendor);
        auditLogService.log(AuditAction.CREATE, AuditEntityType.VENDOR, saved.getId(), saved.getName());
        return VendorResponse.from(saved);
    }

    @Transactional
    public VendorResponse update(Long subscriberId, Long vendorId, UpdateVendorRequest request) {
        Vendor vendor = getOwnedVendor(subscriberId, vendorId);
        String name = normalizeName(request.getName());

        if (vendorRepository.existsBySubscriberIdAndNameIgnoreCaseAndIdNot(subscriberId, name, vendorId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Vendor with this name already exists");
        }

        applyFields(vendor, request, name);
        if (request.getActive() != null) {
            vendor.setActive(request.getActive());
        }

        Vendor saved = vendorRepository.save(vendor);
        auditLogService.log(AuditAction.UPDATE, AuditEntityType.VENDOR, saved.getId(), saved.getName());
        return VendorResponse.from(saved);
    }

    @Transactional
    public VendorResponse updateActive(Long subscriberId, Long vendorId, UpdateVendorActiveRequest request) {
        Vendor vendor = getOwnedVendor(subscriberId, vendorId);
        vendor.setActive(request.getActive());
        Vendor saved = vendorRepository.save(vendor);
        auditLogService.log(AuditAction.UPDATE, AuditEntityType.VENDOR, saved.getId(),
                saved.getName() + " active=" + saved.isActive());
        return VendorResponse.from(saved);
    }

    @Transactional
    public void delete(Long subscriberId, Long vendorId) {
        Vendor vendor = getOwnedVendor(subscriberId, vendorId);
        auditLogService.log(AuditAction.DELETE, AuditEntityType.VENDOR, vendor.getId(), vendor.getName());
        vendorRepository.delete(vendor);
    }

    private Vendor getOwnedVendor(Long subscriberId, Long vendorId) {
        return vendorRepository.findByIdAndSubscriberId(vendorId, subscriberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendor not found"));
    }

    private String normalizeName(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vendor name is required");
        }
        return name.trim();
    }

    private void applyFields(Vendor vendor, CreateVendorRequest request, String name) {
        vendor.setName(name);
        vendor.setContactPerson(normalizeOptional(request.getContactPerson()));
        vendor.setPhone(normalizeOptional(request.getPhone()));
        vendor.setEmail(normalizeOptional(request.getEmail()));
        vendor.setAddress(normalizeOptional(request.getAddress()));
        applyBusinessFields(vendor, request.getVendorType(), request.getBusinessName(),
                request.getGstNumber(), request.getBusinessDetails());
        applyOpeningBalance(vendor, request.getOpeningBalance(), request.getOpeningBalanceNature());
    }

    private void applyFields(Vendor vendor, UpdateVendorRequest request, String name) {
        vendor.setName(name);
        vendor.setContactPerson(normalizeOptional(request.getContactPerson()));
        vendor.setPhone(normalizeOptional(request.getPhone()));
        vendor.setEmail(normalizeOptional(request.getEmail()));
        vendor.setAddress(normalizeOptional(request.getAddress()));
        applyBusinessFields(vendor, request.getVendorType(), request.getBusinessName(),
                request.getGstNumber(), request.getBusinessDetails());
        applyOpeningBalance(vendor, request.getOpeningBalance(), request.getOpeningBalanceNature());
    }

    private void applyOpeningBalance(Vendor vendor,
                                     BigDecimal openingBalance,
                                     OpeningBalanceNature openingBalanceNature) {
        if (openingBalance == null && openingBalanceNature == null) {
            return;
        }
        if (openingBalance != null) {
            vendor.setOpeningBalance(OpeningBalanceSupport.normalizeAmount(openingBalance));
        }
        if (openingBalanceNature != null) {
            vendor.setOpeningBalanceNature(openingBalanceNature);
        }
    }

    private BigDecimal computeVendorOutstanding(Vendor vendor, BigDecimal pendingFromPurchases) {
        OpeningBalanceSupport.OpeningSplit opening = OpeningBalanceSupport.vendorOpening(
                vendor.getOpeningBalance(),
                vendor.getOpeningBalanceNature());
        return OpeningBalanceSupport.normalizeAmount(
                pendingFromPurchases.add(OpeningBalanceSupport.vendorNetBalance(opening)));
    }

    private void applyBusinessFields(Vendor vendor,
                                     CustomerType vendorType,
                                     String businessName,
                                     String gstNumber,
                                     String businessDetails) {
        vendor.setVendorType(vendorType != null ? vendorType : CustomerType.OTHER);
        vendor.setBusinessName(normalizeOptional(businessName));
        vendor.setGstNumber(normalizeOptional(gstNumber));
        vendor.setBusinessDetails(normalizeOptional(businessDetails));
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
