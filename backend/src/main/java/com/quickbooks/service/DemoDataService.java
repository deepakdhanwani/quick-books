package com.quickbooks.service;

import com.quickbooks.dto.company.CreateCompanyRequest;
import com.quickbooks.dto.customer.CreateCustomerRequest;
import com.quickbooks.dto.product.CreateProductRequest;
import com.quickbooks.dto.purchase.CreatePurchaseItemRequest;
import com.quickbooks.dto.purchase.CreatePurchaseRequest;
import com.quickbooks.dto.sale.CreateSaleItemRequest;
import com.quickbooks.dto.sale.CreateSaleRequest;
import com.quickbooks.dto.settings.DemoCompanySummaryResponse;
import com.quickbooks.dto.settings.DemoDataGenerationResult;
import com.quickbooks.dto.settings.DemoDataJobResponse;
import com.quickbooks.dto.settings.DemoSubscriberResponse;
import com.quickbooks.dto.settings.GenerateDemoDataRequest;
import com.quickbooks.dto.subscriber.CreateSubscriberRequest;
import com.quickbooks.dto.subscriber.SubscribeRequest;
import com.quickbooks.dto.subscriber.SubscriberResponse;
import com.quickbooks.dto.vendor.CreateVendorRequest;
import com.quickbooks.entity.BusinessType;
import com.quickbooks.entity.Company;
import com.quickbooks.entity.Subscriber;
import com.quickbooks.entity.SubscriptionPlan;
import com.quickbooks.entity.enums.CustomerType;
import com.quickbooks.entity.enums.PaymentMode;
import com.quickbooks.entity.enums.PaymentSettlementType;
import com.quickbooks.entity.enums.SubscriptionStatus;
import com.quickbooks.repository.CompanyRepository;
import com.quickbooks.repository.CustomerRepository;
import com.quickbooks.repository.ProductRepository;
import com.quickbooks.repository.PurchaseRepository;
import com.quickbooks.repository.SaleRepository;
import com.quickbooks.repository.SubscriberRepository;
import com.quickbooks.repository.SubscriptionPlanRepository;
import com.quickbooks.repository.VendorRepository;
import com.quickbooks.service.demo.DemoDataJobStore;
import com.quickbooks.service.demo.DemoNaming;
import com.quickbooks.service.demo.DemoProductCatalog;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.task.TaskExecutor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class DemoDataService {

    private static final int MIN_CUSTOMERS = 50;
    private static final int MIN_VENDORS = 10;
    private static final int MIN_PRODUCTS = 100;
    private static final int MIN_ORDERS_PER_DAY = 4;
    private static final List<String> DEMO_COMPANY_BRANCHES = List.of("Main", "North", "South", "East", "West");

    private final TaskExecutor demoDataTaskExecutor;
    private final DemoDataJobStore jobStore;
    private final SubscriberService subscriberService;
    private final SubscriberRepository subscriberRepository;
    private final BusinessTypeService businessTypeService;
    private final CompanyService companyService;
    private final CompanyRepository companyRepository;
    private final CustomerService customerService;
    private final VendorService vendorService;
    private final ProductService productService;
    private final SaleService saleService;
    private final PurchaseService purchaseService;
    private final SubscriberSubscriptionService subscriberSubscriptionService;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final CustomerRepository customerRepository;
    private final VendorRepository vendorRepository;
    private final ProductRepository productRepository;
    private final SaleRepository saleRepository;
    private final PurchaseRepository purchaseRepository;

    public DemoDataService(@Qualifier("demoDataTaskExecutor") TaskExecutor demoDataTaskExecutor,
                           DemoDataJobStore jobStore,
                           SubscriberService subscriberService,
                           SubscriberRepository subscriberRepository,
                           BusinessTypeService businessTypeService,
                           CompanyService companyService,
                           CompanyRepository companyRepository,
                           CustomerService customerService,
                           VendorService vendorService,
                           ProductService productService,
                           SaleService saleService,
                           PurchaseService purchaseService,
                           SubscriberSubscriptionService subscriberSubscriptionService,
                           SubscriptionPlanRepository subscriptionPlanRepository,
                           CustomerRepository customerRepository,
                           VendorRepository vendorRepository,
                           ProductRepository productRepository,
                           SaleRepository saleRepository,
                           PurchaseRepository purchaseRepository) {
        this.demoDataTaskExecutor = demoDataTaskExecutor;
        this.jobStore = jobStore;
        this.subscriberService = subscriberService;
        this.subscriberRepository = subscriberRepository;
        this.businessTypeService = businessTypeService;
        this.companyService = companyService;
        this.companyRepository = companyRepository;
        this.customerService = customerService;
        this.vendorService = vendorService;
        this.productService = productService;
        this.saleService = saleService;
        this.purchaseService = purchaseService;
        this.subscriberSubscriptionService = subscriberSubscriptionService;
        this.subscriptionPlanRepository = subscriptionPlanRepository;
        this.customerRepository = customerRepository;
        this.vendorRepository = vendorRepository;
        this.productRepository = productRepository;
        this.saleRepository = saleRepository;
        this.purchaseRepository = purchaseRepository;
    }

    public DemoDataJobResponse startGeneration(GenerateDemoDataRequest request) {
        validateDateRange(request);

        String jobId = UUID.randomUUID().toString();
        DemoDataJobStore.DemoDataJobState job = jobStore.create(jobId);
        demoDataTaskExecutor.execute(() -> runGeneration(job, request));
        return jobStore.toResponse(job);
    }

    public DemoDataJobResponse getJob(String jobId) {
        return jobStore.toResponse(jobStore.getRequired(jobId));
    }

    @Transactional(readOnly = true)
    public List<DemoSubscriberResponse> listDemoSubscribers() {
        return subscriberRepository.findByDemoTrueOrderByBusinessType_NameAsc().stream()
                .map(this::toDemoSubscriberResponse)
                .toList();
    }

    private void runGeneration(DemoDataJobStore.DemoDataJobState job, GenerateDemoDataRequest request) {
        try {
            BusinessType businessType = businessTypeService.getById(request.getBusinessTypeId());
            if (!businessType.isActive()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected business type is not active");
            }

            job.update(5, "Subscriber", "Resolving demo subscriber");
            Subscriber subscriber = resolveDemoSubscriber(businessType);

            job.update(10, "Subscription", "Ensuring active subscription");
            ensureActiveSubscription(subscriber.getId());

            job.update(12, "Companies", "Ensuring demo companies");
            List<Company> targetCompanies = resolveTargetCompanies(subscriber, businessType, request);

            int totalCustomersCreated = 0;
            int totalVendorsCreated = 0;
            int totalProductsCreated = 0;
            int totalPurchasesCreated = 0;
            int totalSalesCreated = 0;

            int companyCount = targetCompanies.size();
            for (int index = 0; index < companyCount; index++) {
                Company company = targetCompanies.get(index);
                String companyAlias = DemoNaming.companyAlias(company.getName());
                int progressBase = 15 + (index * 80 / companyCount);
                int progressSpan = Math.max(1, 80 / companyCount);

                job.update(progressBase, "Customers", "Customers for " + company.getName());
                totalCustomersCreated += ensureCustomers(subscriber, company.getId(), companyAlias, businessType.getName());

                job.update(progressBase + progressSpan / 4, "Vendors", "Vendors for " + company.getName());
                totalVendorsCreated += ensureVendors(subscriber, company.getId(), companyAlias, businessType.getName());

                job.update(progressBase + progressSpan / 2, "Products", "Products for " + company.getName());
                totalProductsCreated += ensureProducts(subscriber, company.getId(), companyAlias, businessType.getName());

                Long companyId = company.getId();
                List<Long> customerIds = customerRepository.findBySubscriber(
                                subscriber.getId(), companyId, true, null, PageRequest.of(0, MIN_CUSTOMERS))
                        .map(customer -> customer.getId())
                        .getContent();
                List<Long> vendorIds = vendorRepository.findBySubscriber(
                                subscriber.getId(), companyId, true, null, PageRequest.of(0, MIN_VENDORS))
                        .map(vendor -> vendor.getId())
                        .getContent();
                List<Long> productIds = productRepository.findBySubscriber(
                                subscriber.getId(), companyId, true, null, PageRequest.of(0, MIN_PRODUCTS))
                        .map(product -> product.getId())
                        .getContent();

                job.update(progressBase + (progressSpan * 3) / 4, "Purchases", "Purchases for " + company.getName());
                totalPurchasesCreated += createPurchases(
                        subscriber.getId(), companyId, vendorIds, productIds, request.getFromDate(), request.getToDate()
                );

                job.update(progressBase + progressSpan - 1, "Sales", "Sales for " + company.getName());
                totalSalesCreated += createSales(
                        subscriber.getId(), companyId, customerIds, productIds, request.getFromDate(), request.getToDate()
                );
            }

            job.update(98, "Finalizing", "Preparing summary");
            Subscriber refreshed = subscriberService.getById(subscriber.getId());
            List<Long> companyIds = targetCompanies.stream().map(Company::getId).toList();

            DemoDataGenerationResult result = new DemoDataGenerationResult();
            result.setSubscriberId(refreshed.getId());
            result.setCompaniesSeeded(companyCount);
            result.setCompaniesSummary(buildCompaniesSummary(targetCompanies));
            if (companyCount == 1) {
                Company onlyCompany = targetCompanies.get(0);
                result.setCompanyId(onlyCompany.getId());
                result.setCompanyName(onlyCompany.getName());
                result.setCompanyAlias(DemoNaming.companyAlias(onlyCompany.getName()));
            } else {
                result.setCompanyName(companyCount + " companies");
                result.setCompanyAlias("multi");
            }
            result.setBusinessName(refreshed.getBusinessName());
            result.setBusinessTypeName(businessType.getName());
            result.setOwnerName(refreshed.getOwnerName());
            result.setPhone(refreshed.getPhone());
            result.setLoginPin(refreshed.getLoginPin());
            result.setCustomersCreated(totalCustomersCreated);
            result.setVendorsCreated(totalVendorsCreated);
            result.setProductsCreated(totalProductsCreated);
            result.setPurchasesCreated(totalPurchasesCreated);
            result.setSalesCreated(totalSalesCreated);
            populateTotals(result, refreshed.getId(), companyIds);
            job.complete(result);
        } catch (Exception ex) {
            String message = ex instanceof ResponseStatusException responseStatusException
                    ? responseStatusException.getReason()
                    : ex.getMessage();
            job.fail(message != null ? message : "Demo data generation failed");
        }
    }

    private List<Company> resolveTargetCompanies(Subscriber subscriber,
                                                 BusinessType businessType,
                                                 GenerateDemoDataRequest request) {
        Long subscriberId = subscriber.getId();
        if (request.getCompanyId() != null) {
            return List.of(companyService.requireAccessibleCompany(subscriberId, request.getCompanyId()));
        }

        if (request.getCompanyName() != null && !request.getCompanyName().isBlank()) {
            String normalizedName = request.getCompanyName().trim();
            Company company = companyRepository.findBySubscriberIdAndActiveTrueOrderByNameAsc(subscriberId).stream()
                    .filter(existing -> existing.getName().equalsIgnoreCase(normalizedName))
                    .findFirst()
                    .orElseGet(() -> createDemoCompany(subscriberId, businessType, normalizedName));
            return List.of(company);
        }

        return ensureDemoCompanies(subscriberId, businessType);
    }

    private List<Company> ensureDemoCompanies(Long subscriberId, BusinessType businessType) {
        List<Company> existing = companyRepository.findBySubscriberIdAndActiveTrueOrderByNameAsc(subscriberId);
        String baseName = "Demo - " + businessType.getName();
        List<Company> companies = new ArrayList<>();

        for (String branch : DEMO_COMPANY_BRANCHES) {
            String fullName = baseName + " - " + branch;
            Company company;
            if ("Main".equals(branch)) {
                company = existing.stream()
                        .filter(item -> item.getName().equalsIgnoreCase(fullName)
                                || item.getName().equalsIgnoreCase(baseName))
                        .findFirst()
                        .orElseGet(() -> createDemoCompany(subscriberId, businessType, fullName));
            } else {
                company = existing.stream()
                        .filter(item -> item.getName().equalsIgnoreCase(fullName))
                        .findFirst()
                        .orElseGet(() -> createDemoCompany(subscriberId, businessType, fullName));
            }
            companies.add(company);
        }

        return companies;
    }

    private String buildCompaniesSummary(List<Company> companies) {
        return companies.stream()
                .map(company -> company.getName() + " ·" + DemoNaming.companyAlias(company.getName()))
                .reduce((left, right) -> left + ", " + right)
                .orElse("");
    }

    private Company createDemoCompany(Long subscriberId, BusinessType businessType, String name) {
        CreateCompanyRequest createRequest = new CreateCompanyRequest();
        createRequest.setName(name);
        createRequest.setBusinessTypeId(businessType.getId());
        Long companyId = companyService.create(subscriberId, createRequest).getId();
        return companyRepository.findById(companyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create demo company"));
    }

    private Subscriber resolveDemoSubscriber(BusinessType businessType) {
        return subscriberRepository.findFirstByBusinessType_IdAndDemoTrue(businessType.getId())
                .orElseGet(() -> createDemoSubscriber(businessType));
    }

    private Subscriber createDemoSubscriber(BusinessType businessType) {
        CreateSubscriberRequest request = new CreateSubscriberRequest();
        request.setBusinessName("Demo - " + businessType.getName());
        request.setOwnerName("Demo Owner");
        request.setPhone(demoPhone(businessType.getId()));
        request.setBusinessTypeId(businessType.getId());

        SubscriberResponse created = subscriberService.create(request);
        Subscriber subscriber = subscriberService.getById(created.getId());
        subscriber.setDemo(true);
        subscriber.setDefaultTaxPercent(new BigDecimal("18.00"));
        return subscriberRepository.save(subscriber);
    }

    private void ensureActiveSubscription(Long subscriberId) {
        SubscriptionStatus status = subscriberSubscriptionService.syncSubscriptionStatus(subscriberId);
        if (status == SubscriptionStatus.ACTIVE) {
            return;
        }

        Long planId = subscriptionPlanRepository.findByActiveTrueOrderByNameAsc().stream()
                .max(Comparator.comparing(plan -> plan.getMaxCompanies() != null ? plan.getMaxCompanies() : 1))
                .map(SubscriptionPlan::getId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Create at least one active subscription plan before generating demo data"
                ));

        SubscribeRequest subscribeRequest = new SubscribeRequest();
        subscribeRequest.setPlanId(planId);
        subscriberSubscriptionService.subscribe(subscriberId, subscribeRequest);
    }

    private int ensureCustomers(Subscriber subscriber, Long companyId, String companyAlias, String businessTypeName) {
        long existing = customerRepository.countBySubscriber_IdAndCompany_Id(subscriber.getId(), companyId);
        int toCreate = Math.max(0, MIN_CUSTOMERS - (int) existing);
        int created = 0;

        for (int i = 0; i < toCreate; i++) {
            int sequence = (int) existing + i + 1;
            CreateCustomerRequest request = new CreateCustomerRequest();
            request.setName(DemoNaming.customerName(companyAlias, sequence, businessTypeName));
            request.setPhone("98" + String.format("%02d", companyId % 100) + String.format("%06d", sequence));
            request.setEmail("c" + companyId + "_" + sequence + "@demo.local");
            request.setAddress("Demo Street " + sequence);
            request.setActive(true);
            request.setCustomerType(i % 4 == 0 ? CustomerType.COMPANY : CustomerType.INDIVIDUAL);
            if (request.getCustomerType() == CustomerType.COMPANY) {
                request.setBusinessName(request.getName() + " Pvt Ltd");
                request.setGstNumber("29DEMO" + String.format("%05d", sequence) + "Z1");
            }
            customerService.create(subscriber.getId(), companyId, request);
            created++;
        }

        return created;
    }

    private int ensureVendors(Subscriber subscriber, Long companyId, String companyAlias, String businessTypeName) {
        long existing = vendorRepository.countBySubscriber_IdAndCompany_Id(subscriber.getId(), companyId);
        int toCreate = Math.max(0, MIN_VENDORS - (int) existing);
        int created = 0;

        for (int i = 0; i < toCreate; i++) {
            int sequence = (int) existing + i + 1;
            CreateVendorRequest request = new CreateVendorRequest();
            request.setName(DemoNaming.vendorName(companyAlias, sequence, businessTypeName));
            request.setContactPerson("Contact " + sequence);
            request.setPhone("97" + String.format("%02d", companyId % 100) + String.format("%06d", sequence));
            request.setEmail("v" + companyId + "_" + sequence + "@demo.local");
            request.setAddress("Vendor Road " + sequence);
            request.setActive(true);
            request.setVendorType(i % 3 == 0 ? CustomerType.COMPANY : CustomerType.SHOP);
            if (request.getVendorType() == CustomerType.COMPANY) {
                request.setBusinessName(request.getName() + " Traders");
                request.setGstNumber("29VEND" + String.format("%05d", sequence) + "Z1");
            }
            vendorService.create(subscriber.getId(), companyId, request);
            created++;
        }

        return created;
    }

    private int ensureProducts(Subscriber subscriber, Long companyId, String companyAlias, String businessTypeName) {
        long existing = productRepository.countBySubscriber_IdAndCompany_Id(subscriber.getId(), companyId);
        int toCreate = Math.max(0, MIN_PRODUCTS - (int) existing);
        if (toCreate == 0) {
            return 0;
        }

        List<DemoProductCatalog.ProductSeed> seeds = DemoProductCatalog.buildProducts(businessTypeName, toCreate);
        int created = 0;
        for (DemoProductCatalog.ProductSeed seed : seeds) {
            String productName = uniqueProductName(
                    subscriber.getId(), companyId, companyAlias, seed.name(), (int) existing + created + 1
            );
            CreateProductRequest request = new CreateProductRequest();
            request.setName(productName);
            request.setSellingPrice(seed.price());
            request.setDiscount(seed.discount());
            request.setActive(true);
            productService.create(subscriber.getId(), companyId, request);
            created++;
        }

        return created;
    }

    private String uniqueProductName(Long subscriberId,
                                     Long companyId,
                                     String companyAlias,
                                     String baseName,
                                     int sequence) {
        String candidate = DemoNaming.productName(companyAlias, baseName);
        int attempt = 0;
        while (productRepository.existsBySubscriberIdAndCompanyIdAndNameIgnoreCase(subscriberId, companyId, candidate)) {
            attempt++;
            candidate = DemoNaming.productName(companyAlias, baseName + " #" + (sequence + attempt));
        }
        return candidate;
    }

    private int createPurchases(Long subscriberId,
                                Long companyId,
                                List<Long> vendorIds,
                                List<Long> productIds,
                                LocalDate fromDate,
                                LocalDate toDate) {
        if (vendorIds.isEmpty() || productIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vendors and products are required for purchases");
        }

        List<Long> purchaseIds = new ArrayList<>();
        int orderIndex = 0;
        for (LocalDate date = fromDate; !date.isAfter(toDate); date = date.plusDays(1)) {
            for (int i = 0; i < MIN_ORDERS_PER_DAY; i++) {
                CreatePurchaseRequest request = new CreatePurchaseRequest();
                request.setVendorId(vendorIds.get(orderIndex % vendorIds.size()));
                request.setDate(date);
                request.setTaxPercent(new BigDecimal("18.00"));
                request.setItems(randomPurchaseItems(productIds, 1 + (orderIndex % 3)));
                purchaseIds.add(purchaseService.create(subscriberId, companyId, request).getId());
                orderIndex++;
            }
        }

        applyPurchasePayments(subscriberId, companyId, purchaseIds);
        return purchaseIds.size();
    }

    private int createSales(Long subscriberId,
                            Long companyId,
                            List<Long> customerIds,
                            List<Long> productIds,
                            LocalDate fromDate,
                            LocalDate toDate) {
        if (customerIds.isEmpty() || productIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Customers and products are required for sales");
        }

        List<Long> saleIds = new ArrayList<>();
        int orderIndex = 0;
        for (LocalDate date = fromDate; !date.isAfter(toDate); date = date.plusDays(1)) {
            for (int i = 0; i < MIN_ORDERS_PER_DAY; i++) {
                CreateSaleRequest request = new CreateSaleRequest();
                request.setCustomerId(customerIds.get(orderIndex % customerIds.size()));
                request.setDate(date);
                request.setTaxPercent(new BigDecimal("18.00"));
                request.setItems(randomSaleItems(productIds, 1 + (orderIndex % 3)));
                saleIds.add(saleService.create(subscriberId, companyId, request).getId());
                orderIndex++;
            }
        }

        applySalePayments(subscriberId, companyId, saleIds);
        return saleIds.size();
    }

    private void applyPurchasePayments(Long subscriberId, Long companyId, List<Long> purchaseIds) {
        for (int i = 0; i < purchaseIds.size(); i++) {
            Long purchaseId = purchaseIds.get(i);
            var purchase = purchaseService.getById(subscriberId, companyId, purchaseId);
            BigDecimal pending = purchase.getPendingAmount();
            if (pending.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            if (i % 3 == 0) {
                continue;
            }

            if (i % 3 == 1) {
                BigDecimal partial = pending.multiply(new BigDecimal("0.50")).setScale(2, RoundingMode.HALF_UP);
                purchaseService.makePayment(
                        subscriberId,
                        companyId,
                        purchaseId,
                        partial,
                        purchase.getDate(),
                        PaymentMode.UPI,
                        PaymentSettlementType.PARTIAL,
                        "Demo partial payment",
                        "Generated demo data",
                        null
                );
            } else {
                purchaseService.makePayment(
                        subscriberId,
                        companyId,
                        purchaseId,
                        pending,
                        purchase.getDate(),
                        PaymentMode.CASH,
                        PaymentSettlementType.FULL,
                        "Demo full payment",
                        "Generated demo data",
                        null
                );
            }
        }
    }

    private void applySalePayments(Long subscriberId, Long companyId, List<Long> saleIds) {
        for (int i = 0; i < saleIds.size(); i++) {
            Long saleId = saleIds.get(i);
            var sale = saleService.getById(subscriberId, companyId, saleId);
            BigDecimal pending = sale.getPendingAmount();
            if (pending.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            if (i % 3 == 0) {
                continue;
            }

            if (i % 3 == 1) {
                BigDecimal partial = pending.multiply(new BigDecimal("0.50")).setScale(2, RoundingMode.HALF_UP);
                saleService.receivePayment(
                        subscriberId,
                        companyId,
                        saleId,
                        partial,
                        sale.getDate(),
                        PaymentMode.UPI,
                        PaymentSettlementType.PARTIAL,
                        "Demo partial receipt",
                        "Generated demo data",
                        null
                );
            } else {
                saleService.receivePayment(
                        subscriberId,
                        companyId,
                        saleId,
                        pending,
                        sale.getDate(),
                        PaymentMode.CASH,
                        PaymentSettlementType.FULL,
                        "Demo full receipt",
                        "Generated demo data",
                        null
                );
            }
        }
    }

    private List<CreateSaleItemRequest> randomSaleItems(List<Long> productIds, int count) {
        List<CreateSaleItemRequest> items = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            CreateSaleItemRequest item = new CreateSaleItemRequest();
            item.setProductId(productIds.get(ThreadLocalRandom.current().nextInt(productIds.size())));
            item.setQuantity(BigDecimal.valueOf(1 + (i % 4)).setScale(2, RoundingMode.HALF_UP));
            items.add(item);
        }
        return items;
    }

    private List<CreatePurchaseItemRequest> randomPurchaseItems(List<Long> productIds, int count) {
        List<CreatePurchaseItemRequest> items = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            CreatePurchaseItemRequest item = new CreatePurchaseItemRequest();
            item.setProductId(productIds.get(ThreadLocalRandom.current().nextInt(productIds.size())));
            item.setQuantity(BigDecimal.valueOf(1 + (i % 4)).setScale(2, RoundingMode.HALF_UP));
            items.add(item);
        }
        return items;
    }

    private String demoPhone(Long businessTypeId) {
        return "9900" + String.format("%06d", businessTypeId);
    }

    private void validateDateRange(GenerateDemoDataRequest request) {
        if (request.getFromDate() == null || request.getToDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Date range is required");
        }
        if (request.getToDate().isBefore(request.getFromDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "To date must be on or after from date");
        }
    }

    private void populateTotals(DemoDataGenerationResult result, Long subscriberId, List<Long> companyIds) {
        long customers = 0;
        long vendors = 0;
        long products = 0;
        long purchases = 0;
        long sales = 0;
        for (Long companyId : companyIds) {
            customers += customerRepository.countBySubscriber_IdAndCompany_Id(subscriberId, companyId);
            vendors += vendorRepository.countBySubscriber_IdAndCompany_Id(subscriberId, companyId);
            products += productRepository.countBySubscriber_IdAndCompany_Id(subscriberId, companyId);
            purchases += purchaseRepository.countBySubscriber_IdAndCompany_Id(subscriberId, companyId);
            sales += saleRepository.countBySubscriber_IdAndCompany_Id(subscriberId, companyId);
        }
        result.setTotalCustomers(customers);
        result.setTotalVendors(vendors);
        result.setTotalProducts(products);
        result.setTotalPurchases(purchases);
        result.setTotalSales(sales);
    }

    private DemoSubscriberResponse toDemoSubscriberResponse(Subscriber subscriber) {
        DemoSubscriberResponse response = new DemoSubscriberResponse();
        response.setId(subscriber.getId());
        response.setBusinessName(subscriber.getBusinessName());
        response.setOwnerName(subscriber.getOwnerName());
        response.setPhone(subscriber.getPhone());
        response.setLoginPin(subscriber.getLoginPin());
        response.setCreatedAt(subscriber.getCreatedAt());
        if (subscriber.getBusinessType() != null) {
            response.setBusinessTypeId(subscriber.getBusinessType().getId());
            response.setBusinessTypeName(subscriber.getBusinessType().getName());
        }

        List<DemoCompanySummaryResponse> companies = companyRepository
                .findBySubscriberIdAndActiveTrueOrderByNameAsc(subscriber.getId()).stream()
                .map(company -> toDemoCompanySummary(subscriber.getId(), company))
                .toList();
        response.setCompanies(companies);

        response.setCustomerCount(companies.stream().mapToLong(DemoCompanySummaryResponse::getCustomerCount).sum());
        response.setVendorCount(companies.stream().mapToLong(DemoCompanySummaryResponse::getVendorCount).sum());
        response.setProductCount(companies.stream().mapToLong(DemoCompanySummaryResponse::getProductCount).sum());
        response.setSaleCount(companies.stream().mapToLong(DemoCompanySummaryResponse::getSaleCount).sum());
        response.setPurchaseCount(companies.stream().mapToLong(DemoCompanySummaryResponse::getPurchaseCount).sum());
        return response;
    }

    private DemoCompanySummaryResponse toDemoCompanySummary(Long subscriberId, Company company) {
        DemoCompanySummaryResponse response = new DemoCompanySummaryResponse();
        response.setId(company.getId());
        response.setName(company.getName());
        response.setAlias(DemoNaming.companyAlias(company.getName()));
        Long companyId = company.getId();
        response.setCustomerCount(customerRepository.countBySubscriber_IdAndCompany_Id(subscriberId, companyId));
        response.setVendorCount(vendorRepository.countBySubscriber_IdAndCompany_Id(subscriberId, companyId));
        response.setProductCount(productRepository.countBySubscriber_IdAndCompany_Id(subscriberId, companyId));
        response.setSaleCount(saleRepository.countBySubscriber_IdAndCompany_Id(subscriberId, companyId));
        response.setPurchaseCount(purchaseRepository.countBySubscriber_IdAndCompany_Id(subscriberId, companyId));
        return response;
    }
}
