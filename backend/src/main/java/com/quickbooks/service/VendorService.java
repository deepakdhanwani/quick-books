package com.quickbooks.service;

import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.dto.vendor.CreateVendorRequest;
import com.quickbooks.dto.vendor.UpdateVendorActiveRequest;
import com.quickbooks.dto.vendor.UpdateVendorRequest;
import com.quickbooks.dto.vendor.VendorResponse;
import com.quickbooks.entity.Subscriber;
import com.quickbooks.entity.Vendor;
import com.quickbooks.entity.enums.CustomerType;
import com.quickbooks.repository.VendorRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class VendorService {

    private final VendorRepository vendorRepository;
    private final SubscriberService subscriberService;

    public VendorService(VendorRepository vendorRepository,
                         SubscriberService subscriberService) {
        this.vendorRepository = vendorRepository;
        this.subscriberService = subscriberService;
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

        return PageResponse.from(result.map(VendorResponse::from));
    }

    @Transactional(readOnly = true)
    public VendorResponse getById(Long subscriberId, Long vendorId) {
        return VendorResponse.from(getOwnedVendor(subscriberId, vendorId));
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

        return VendorResponse.from(vendorRepository.save(vendor));
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

        return VendorResponse.from(vendorRepository.save(vendor));
    }

    @Transactional
    public VendorResponse updateActive(Long subscriberId, Long vendorId, UpdateVendorActiveRequest request) {
        Vendor vendor = getOwnedVendor(subscriberId, vendorId);
        vendor.setActive(request.getActive());
        return VendorResponse.from(vendorRepository.save(vendor));
    }

    @Transactional
    public void delete(Long subscriberId, Long vendorId) {
        Vendor vendor = getOwnedVendor(subscriberId, vendorId);
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
    }

    private void applyFields(Vendor vendor, UpdateVendorRequest request, String name) {
        vendor.setName(name);
        vendor.setContactPerson(normalizeOptional(request.getContactPerson()));
        vendor.setPhone(normalizeOptional(request.getPhone()));
        vendor.setEmail(normalizeOptional(request.getEmail()));
        vendor.setAddress(normalizeOptional(request.getAddress()));
        applyBusinessFields(vendor, request.getVendorType(), request.getBusinessName(),
                request.getGstNumber(), request.getBusinessDetails());
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
