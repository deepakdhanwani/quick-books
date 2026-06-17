package com.quickbooks.controller.subscriber;

import com.quickbooks.dto.businesstype.BusinessTypeResponse;
import com.quickbooks.dto.company.CompanyResponse;
import com.quickbooks.dto.company.CreateCompanyRequest;
import com.quickbooks.security.UserPrincipal;
import com.quickbooks.service.BusinessTypeService;
import com.quickbooks.service.CompanyService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subscriber/companies")
public class SubscriberCompanyController {

    private final CompanyService companyService;
    private final BusinessTypeService businessTypeService;

    public SubscriberCompanyController(CompanyService companyService, BusinessTypeService businessTypeService) {
        this.companyService = companyService;
        this.businessTypeService = businessTypeService;
    }

    @GetMapping
    public List<CompanyResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return companyService.list(principal.getSubscriberId(), principal.getCompanyId());
    }

    @PostMapping
    public CompanyResponse create(@AuthenticationPrincipal UserPrincipal principal,
                                  @Valid @RequestBody CreateCompanyRequest request) {
        return companyService.create(principal.getSubscriberId(), request);
    }

    @GetMapping("/business-types")
    public List<BusinessTypeResponse> businessTypes() {
        return businessTypeService.findActive();
    }
}
