package com.quickbooks.service;

import com.quickbooks.config.KnownBusinessTypes;
import com.quickbooks.dto.businesstype.BusinessTypeResponse;
import com.quickbooks.dto.businesstype.CreateBusinessTypeRequest;
import com.quickbooks.dto.businesstype.SeedBusinessTypesResponse;
import com.quickbooks.dto.businesstype.UpdateBusinessTypeRequest;
import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.entity.BusinessType;
import com.quickbooks.repository.BusinessTypeRepository;
import com.quickbooks.repository.SubscriberRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class BusinessTypeService {

    private final BusinessTypeRepository businessTypeRepository;
    private final SubscriberRepository subscriberRepository;

    public BusinessTypeService(BusinessTypeRepository businessTypeRepository,
                               SubscriberRepository subscriberRepository) {
        this.businessTypeRepository = businessTypeRepository;
        this.subscriberRepository = subscriberRepository;
    }

    public PageResponse<BusinessTypeResponse> findPage(int page, int size) {
        int normalizedPage = Math.max(page, 0);
        int normalizedSize = Math.min(Math.max(size, 1), 100);

        Pageable pageable = PageRequest.of(normalizedPage, normalizedSize, Sort.by("name").ascending());
        Page<BusinessTypeResponse> result = businessTypeRepository.findAll(pageable)
                .map(BusinessTypeResponse::from);

        return PageResponse.from(result);
    }

    public List<BusinessTypeResponse> findActive() {
        return businessTypeRepository.findByActiveTrueOrderByNameAsc().stream()
                .map(BusinessTypeResponse::from)
                .toList();
    }

    @Transactional
    public BusinessTypeResponse create(CreateBusinessTypeRequest request) {
        String name = request.getName().trim();
        if (businessTypeRepository.existsByNameIgnoreCase(name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Business type already exists");
        }

        BusinessType businessType = new BusinessType();
        businessType.setName(name);
        businessType.setDescription(request.getDescription());
        businessType.setActive(true);

        return BusinessTypeResponse.from(businessTypeRepository.save(businessType));
    }

    @Transactional
    public SeedBusinessTypesResponse seedDefaults() {
        int created = 0;
        int skipped = 0;

        for (KnownBusinessTypes.KnownType known : KnownBusinessTypes.DEFAULTS) {
            if (businessTypeRepository.existsByNameIgnoreCase(known.name())) {
                skipped++;
                continue;
            }

            BusinessType businessType = new BusinessType();
            businessType.setName(known.name());
            businessType.setDescription(known.description());
            businessType.setActive(true);
            businessTypeRepository.save(businessType);
            created++;
        }

        return new SeedBusinessTypesResponse(created, skipped, KnownBusinessTypes.DEFAULTS.size());
    }

    @Transactional
    public BusinessTypeResponse update(Long id, UpdateBusinessTypeRequest request) {
        BusinessType businessType = getById(id);
        String name = request.getName().trim();

        if (businessTypeRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Business type name already exists");
        }

        businessType.setName(name);
        businessType.setDescription(request.getDescription());
        if (request.getActive() != null) {
            businessType.setActive(request.getActive());
        }

        return BusinessTypeResponse.from(businessTypeRepository.save(businessType));
    }

    @Transactional
    public void delete(Long id) {
        BusinessType businessType = getById(id);

        if (subscriberRepository.existsByBusinessType_Id(id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot delete — subscribers are using this business type"
            );
        }

        businessTypeRepository.delete(businessType);
    }

    public BusinessType getById(Long id) {
        return businessTypeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Business type not found"));
    }
}
