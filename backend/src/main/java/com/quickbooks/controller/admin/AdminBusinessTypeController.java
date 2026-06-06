package com.quickbooks.controller.admin;

import com.quickbooks.dto.businesstype.BusinessTypeResponse;
import com.quickbooks.dto.businesstype.CreateBusinessTypeRequest;
import com.quickbooks.dto.businesstype.SeedBusinessTypesResponse;
import com.quickbooks.dto.businesstype.UpdateBusinessTypeRequest;
import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.service.BusinessTypeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/business-types")
public class AdminBusinessTypeController {

    private final BusinessTypeService businessTypeService;

    public AdminBusinessTypeController(BusinessTypeService businessTypeService) {
        this.businessTypeService = businessTypeService;
    }

    @GetMapping
    public PageResponse<BusinessTypeResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return businessTypeService.findPage(page, size);
    }

    @GetMapping("/active")
    public List<BusinessTypeResponse> listActive() {
        return businessTypeService.findActive();
    }

    @PostMapping
    public BusinessTypeResponse create(@Valid @RequestBody CreateBusinessTypeRequest request) {
        return businessTypeService.create(request);
    }

    @PostMapping("/seed-defaults")
    public SeedBusinessTypesResponse seedDefaults() {
        return businessTypeService.seedDefaults();
    }

    @PutMapping("/{id}")
    public BusinessTypeResponse update(@PathVariable Long id,
                                       @Valid @RequestBody UpdateBusinessTypeRequest request) {
        return businessTypeService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        businessTypeService.delete(id);
    }
}
