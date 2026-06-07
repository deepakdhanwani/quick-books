package com.quickbooks.service;

import com.quickbooks.dto.audit.AuditLogResponse;
import com.quickbooks.dto.common.PageResponse;
import com.quickbooks.dto.customer.CustomerResponse;
import com.quickbooks.dto.product.ProductResponse;
import com.quickbooks.dto.purchase.PurchaseResponse;
import com.quickbooks.dto.sale.SaleResponse;
import com.quickbooks.dto.subscriber.SubscriberDataSummaryResponse;
import com.quickbooks.dto.subscriberuser.SubscriberUserResponse;
import com.quickbooks.dto.vendor.VendorResponse;
import com.quickbooks.entity.enums.PaymentListFilter;
import com.quickbooks.repository.AuditLogRepository;
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

    private void ensureSubscriberExists(Long subscriberId) {
        subscriberService.getById(subscriberId);
    }

    @Transactional(readOnly = true)
    public SubscriberDataSummaryResponse getSummary(Long subscriberId) {
        ensureSubscriberExists(subscriberId);

        SubscriberDataSummaryResponse response = new SubscriberDataSummaryResponse();
        response.setCustomerCount(customerRepository.countBySubscriber_Id(subscriberId));
        response.setVendorCount(vendorRepository.countBySubscriber_Id(subscriberId));
        response.setProductCount(productRepository.countBySubscriber_Id(subscriberId));
        response.setSaleCount(saleRepository.countBySubscriber_Id(subscriberId));
        response.setPurchaseCount(purchaseRepository.countBySubscriber_Id(subscriberId));
        response.setTeamUserCount(subscriberUserRepository.countBySubscriberId(subscriberId));
        response.setAuditLogCount(auditLogRepository.countBySubscriberId(subscriberId));
        response.setTotalSalesAmount(saleRepository.sumNetAmountBySubscriber(subscriberId, null, null));
        response.setTotalPurchasesAmount(purchaseRepository.sumNetAmountBySubscriber(subscriberId, null, null));
        response.setPendingSalesAmount(saleRepository.sumPendingAmountBySubscriber(subscriberId));
        response.setPendingPurchasesAmount(purchaseRepository.sumPendingAmountBySubscriber(subscriberId));
        return response;
    }

    @Transactional(readOnly = true)
    public PageResponse<CustomerResponse> listCustomers(Long subscriberId,
                                                        int page,
                                                        int size,
                                                        Boolean active,
                                                        String search) {
        ensureSubscriberExists(subscriberId);
        return customerService.findPage(subscriberId, page, size, active, search);
    }

    @Transactional(readOnly = true)
    public PageResponse<VendorResponse> listVendors(Long subscriberId,
                                                    int page,
                                                    int size,
                                                    Boolean active,
                                                    String search) {
        ensureSubscriberExists(subscriberId);
        return vendorService.findPage(subscriberId, page, size, active, search);
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> listProducts(Long subscriberId,
                                                      int page,
                                                      int size,
                                                      Boolean active,
                                                      String search) {
        ensureSubscriberExists(subscriberId);
        return productService.findPage(subscriberId, page, size, active, search);
    }

    @Transactional(readOnly = true)
    public PageResponse<SaleResponse> listSales(Long subscriberId,
                                                int page,
                                                int size,
                                                String search,
                                                PaymentListFilter paymentFilter,
                                                LocalDate fromDate,
                                                LocalDate toDate) {
        ensureSubscriberExists(subscriberId);
        return saleService.findPage(subscriberId, page, size, search, paymentFilter, fromDate, toDate);
    }

    @Transactional(readOnly = true)
    public PageResponse<PurchaseResponse> listPurchases(Long subscriberId,
                                                          int page,
                                                          int size,
                                                          String search,
                                                          PaymentListFilter paymentFilter,
                                                          LocalDate fromDate,
                                                          LocalDate toDate) {
        ensureSubscriberExists(subscriberId);
        return purchaseService.findPage(subscriberId, page, size, search, paymentFilter, fromDate, toDate);
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
}
