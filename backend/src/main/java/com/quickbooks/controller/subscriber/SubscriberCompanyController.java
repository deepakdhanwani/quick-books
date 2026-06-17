package com.quickbooks.controller.subscriber;

import com.quickbooks.dto.businesstype.BusinessTypeResponse;
import com.quickbooks.dto.company.CompanyResponse;
import com.quickbooks.dto.company.CreateCompanyRequest;
import com.quickbooks.security.UserPrincipal;
import com.quickbooks.security.UserPrincipal;
import com.quickbooks.service.BusinessTypeService;
import com.quickbooks.service.CompanyService;
import com.quickbooks.service.StaffAccessService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subscriber/companies")
public class SubscriberCompanyController {

    private final CompanyService companyService;
    private final BusinessTypeService businessTypeService;
    private final StaffAccessService staffAccessService;

    public SubscriberCompanyController(CompanyService companyService,
                                       BusinessTypeService businessTypeService,
                                       StaffAccessService staffAccessService) {
        this.companyService = companyService;
        this.businessTypeService = businessTypeService;
        this.staffAccessService = staffAccessService;
    }

    @GetMapping
    public List<CompanyResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return companyService.listForPrincipal(principal);
    }

    @PostMapping
    public CompanyResponse create(@AuthenticationPrincipal UserPrincipal principal,
                                  @Valid @RequestBody CreateCompanyRequest request) {
        staffAccessService.requireCompanyCreate(principal);
        return companyService.create(principal.getSubscriberId(), request);
    }

    @GetMapping("/business-types")
    public List<BusinessTypeResponse> businessTypes() {
        return businessTypeService.findActive();
    }
}
