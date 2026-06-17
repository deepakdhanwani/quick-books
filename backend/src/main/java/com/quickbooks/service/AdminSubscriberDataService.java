package com.quickbooks.service;

import com.quickbooks.dto.audit.AuditLogResponse;
import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.dto.company.AdminCompanySummaryResponse;
import com.quickbooks.dto.customer.CustomerResponse;
import com.quickbooks.dto.product.ProductResponse;
import com.quickbooks.dto.purchase.PurchaseResponse;
import com.quickbooks.dto.sale.SaleResponse;
import com.quickbooks.dto.subscriber.SubscriberDataSummaryResponse;
import com.quickbooks.dto.subscriberuser.SubscriberUserResponse;
import com.quickbooks.dto.vendor.VendorResponse;
import com.quickbooks.entity.Subscriber;
import com.quickbooks.entity.enums.PaymentListFilter;
import com.quickbooks.repository.AuditLogRepository;
import com.quickbooks.repository.CompanyRepository;
import com.quickbooks.repository.CustomerRepository;
import com.quickbooks.repository.ProductRepository;
import com.quickbooks.repository.PurchaseRepository;
import com.quickbooks.repository.SaleRepository;
import com.quickbooks.repository.SubscriberUserRepository;
import com.quickbooks.repository.VendorRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class AdminSubscriberDataService {

    private final SubscriberService subscriberService;
    private final CompanyService companyService;
    private final CompanyRepository companyRepository;
    private final CustomerService customerService;
    private final VendorService vendorService;
    private final ProductService productService;
    private final SaleService saleService;
    private final PurchaseService purchaseService;
    private final SubscriberUserService subscriberUserService;
    private final CustomerRepository customerRepository;
    private final VendorRepository vendorRepository;
    private final ProductRepository productRepository;
    private final SaleRepository saleRepository;
    private final PurchaseRepository purchaseRepository;
    private final SubscriberUserRepository subscriberUserRepository;
    private final AuditLogRepository auditLogRepository;

    public AdminSubscriberDataService(SubscriberService subscriberService,
                                      CompanyService companyService,
                                      CompanyRepository companyRepository,
                                      CustomerService customerService,
                                      VendorService vendorService,
                                      ProductService productService,
                                      SaleService saleService,
                                      PurchaseService purchaseService,
                                      SubscriberUserService subscriberUserService,
                                      CustomerRepository customerRepository,
                                      VendorRepository vendorRepository,
                                      ProductRepository productRepository,
                                      SaleRepository saleRepository,
                                      PurchaseRepository purchaseRepository,
                                      SubscriberUserRepository subscriberUserRepository,
                                      AuditLogRepository auditLogRepository) {
        this.subscriberService = subscriberService;
        this.companyService = companyService;
        this.companyRepository = companyRepository;
        this.customerService = customerService;
        this.vendorService = vendorService;
        this.productService = productService;
        this.saleService = saleService;
        this.purchaseService = purchaseService;
        this.subscriberUserService = subscriberUserService;
        this.customerRepository = customerRepository;
        this.vendorRepository = vendorRepository;
        this.productRepository = productRepository;
        this.saleRepository = saleRepository;
        this.purchaseRepository = purchaseRepository;
        this.subscriberUserRepository = subscriberUserRepository;
        this.auditLogRepository = auditLogRepository;
    }

    private Subscriber ensureSubscriberExists(Long subscriberId) {
        return subscriberService.getById(subscriberId);
    }

    private Long resolveCompanyId(Long subscriberId, Long companyId) {
        if (companyId != null) {
            return companyService.requireAccessibleCompany(subscriberId, companyId).getId();
        }
        Subscriber subscriber = subscriberService.getById(subscriberId);
        if (subscriber.getDefaultCompany() != null && subscriber.getDefaultCompany().isActive()) {
            return subscriber.getDefaultCompany().getId();
        }
        return companyService.ensureDefaultCompany(subscriberId, subscriber.getBusinessName()).getId();
    }

    @Transactional(readOnly = true)
    public List<AdminCompanySummaryResponse> listCompanies(Long subscriberId) {
        Subscriber subscriber = ensureSubscriberExists(subscriberId);
        Long defaultCompanyId = subscriber.getDefaultCompany() != null
                ? subscriber.getDefaultCompany().getId()
                : null;

        return companyRepository.findBySubscriberIdAndActiveTrueOrderByNameAsc(subscriberId).stream()
                .map(company -> {
                    AdminCompanySummaryResponse response = AdminCompanySummaryResponse.from(company, defaultCompanyId);
                    populateCompanyCounts(response, subscriberId, company.getId());
                    return response;
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public SubscriberDataSummaryResponse getSummary(Long subscriberId, Long companyId) {
        ensureSubscriberExists(subscriberId);
        Long resolvedCompanyId = resolveCompanyId(subscriberId, companyId);

        SubscriberDataSummaryResponse response = new SubscriberDataSummaryResponse();
        response.setCustomerCount(customerRepository.countBySubscriber_IdAndCompany_Id(subscriberId, resolvedCompanyId));
        response.setVendorCount(vendorRepository.countBySubscriber_IdAndCompany_Id(subscriberId, resolvedCompanyId));
        response.setProductCount(productRepository.countBySubscriber_IdAndCompany_Id(subscriberId, resolvedCompanyId));
        response.setSaleCount(saleRepository.countBySubscriber_IdAndCompany_Id(subscriberId, resolvedCompanyId));
        response.setPurchaseCount(purchaseRepository.countBySubscriber_IdAndCompany_Id(subscriberId, resolvedCompanyId));
        response.setTeamUserCount(subscriberUserRepository.countBySubscriberId(subscriberId));
        response.setAuditLogCount(auditLogRepository.countBySubscriberId(subscriberId));
        response.setTotalSalesAmount(saleRepository.sumNetAmountBySubscriber(subscriberId, resolvedCompanyId, null, null));
        response.setTotalPurchasesAmount(purchaseRepository.sumNetAmountBySubscriber(subscriberId, resolvedCompanyId, null, null));
        response.setPendingSalesAmount(saleRepository.sumPendingAmountBySubscriber(subscriberId, resolvedCompanyId));
        response.setPendingPurchasesAmount(purchaseRepository.sumPendingAmountBySubscriber(subscriberId, resolvedCompanyId));
        return response;
    }

    @Transactional(readOnly = true)
    public PageResponse<CustomerResponse> listCustomers(Long subscriberId,
                                                        Long companyId,
                                                        int page,
                                                        int size,
                                                        Boolean active,
                                                        String search) {
        ensureSubscriberExists(subscriberId);
        return customerService.findPage(subscriberId, resolveCompanyId(subscriberId, companyId), page, size, active, search);
    }

    @Transactional(readOnly = true)
    public PageResponse<VendorResponse> listVendors(Long subscriberId,
                                                    Long companyId,
                                                    int page,
                                                    int size,
                                                    Boolean active,
                                                    String search) {
        ensureSubscriberExists(subscriberId);
        return vendorService.findPage(subscriberId, resolveCompanyId(subscriberId, companyId), page, size, active, search);
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> listProducts(Long subscriberId,
                                                      Long companyId,
                                                      int page,
                                                      int size,
                                                      Boolean active,
                                                      String search) {
        ensureSubscriberExists(subscriberId);
        return productService.findPage(subscriberId, resolveCompanyId(subscriberId, companyId), page, size, active, search);
    }

    @Transactional(readOnly = true)
    public PageResponse<SaleResponse> listSales(Long subscriberId,
                                                Long companyId,
                                                int page,
                                                int size,
                                                String search,
                                                PaymentListFilter paymentFilter,
                                                LocalDate fromDate,
                                                LocalDate toDate) {
        ensureSubscriberExists(subscriberId);
        return saleService.findPage(
                subscriberId,
                resolveCompanyId(subscriberId, companyId),
                page,
                size,
                search,
                paymentFilter,
                fromDate,
                toDate
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<PurchaseResponse> listPurchases(Long subscriberId,
                                                          Long companyId,
                                                          int page,
                                                          int size,
                                                          String search,
                                                          PaymentListFilter paymentFilter,
                                                          LocalDate fromDate,
                                                          LocalDate toDate) {
        ensureSubscriberExists(subscriberId);
        return purchaseService.findPage(
                subscriberId,
                resolveCompanyId(subscriberId, companyId),
                page,
                size,
                search,
                paymentFilter,
                fromDate,
                toDate
        );
    }

    @Transactional(readOnly = true)
    public List<SubscriberUserResponse> listTeamUsers(Long subscriberId) {
        ensureSubscriberExists(subscriberId);
        return subscriberUserService.list(subscriberId);
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditLogResponse> listAuditLogs(Long subscriberId, int page, int size) {
        ensureSubscriberExists(subscriberId);
        int normalizedPage = Math.max(page, 0);
        int normalizedSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(normalizedPage, normalizedSize, Sort.by("createdAt").descending());
        return PageResponse.from(
                auditLogRepository.findBySubscriberIdOrderByCreatedAtDesc(subscriberId, pageable)
                        .map(AuditLogResponse::from)
        );
    }

    private void populateCompanyCounts(AdminCompanySummaryResponse response, Long subscriberId, Long companyId) {
        response.setCustomerCount(customerRepository.countBySubscriber_IdAndCompany_Id(subscriberId, companyId));
        response.setVendorCount(vendorRepository.countBySubscriber_IdAndCompany_Id(subscriberId, companyId));
        response.setProductCount(productRepository.countBySubscriber_IdAndCompany_Id(subscriberId, companyId));
        response.setSaleCount(saleRepository.countBySubscriber_IdAndCompany_Id(subscriberId, companyId));
        response.setPurchaseCount(purchaseRepository.countBySubscriber_IdAndCompany_Id(subscriberId, companyId));
    }
}
