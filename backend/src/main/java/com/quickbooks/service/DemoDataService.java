package com.quickbooks.service;

import com.quickbooks.dto.customer.CreateCustomerRequest;
import com.quickbooks.dto.product.CreateProductRequest;
import com.quickbooks.dto.purchase.CreatePurchaseItemRequest;
import com.quickbooks.dto.purchase.CreatePurchaseRequest;
import com.quickbooks.dto.sale.CreateSaleItemRequest;
import com.quickbooks.dto.sale.CreateSaleRequest;
import com.quickbooks.dto.settings.DemoDataGenerationResult;
import com.quickbooks.dto.settings.DemoDataJobResponse;
import com.quickbooks.dto.settings.DemoSubscriberResponse;
import com.quickbooks.dto.settings.GenerateDemoDataRequest;
import com.quickbooks.dto.subscriber.CreateSubscriberRequest;
import com.quickbooks.dto.subscriber.SubscribeRequest;
import com.quickbooks.dto.subscriber.SubscriberResponse;
import com.quickbooks.dto.vendor.CreateVendorRequest;
import com.quickbooks.entity.BusinessType;
import com.quickbooks.entity.Subscriber;
import com.quickbooks.entity.enums.CustomerType;
import com.quickbooks.entity.enums.PaymentMode;
import com.quickbooks.entity.enums.PaymentSettlementType;
import com.quickbooks.entity.enums.SubscriptionStatus;
import com.quickbooks.repository.CustomerRepository;
import com.quickbooks.repository.ProductRepository;
import com.quickbooks.repository.PurchaseRepository;
import com.quickbooks.repository.SaleRepository;
import com.quickbooks.repository.SubscriberRepository;
import com.quickbooks.repository.SubscriptionPlanRepository;
import com.quickbooks.repository.VendorRepository;
import com.quickbooks.service.demo.DemoDataJobStore;
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
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class DemoDataService {

    private static final int MIN_CUSTOMERS = 50;
    private static final int MIN_VENDORS = 10;
    private static final int MIN_PRODUCTS = 100;
    private static final int MIN_ORDERS_PER_DAY = 4;

    private final TaskExecutor demoDataTaskExecutor;
    private final DemoDataJobStore jobStore;
    private final SubscriberService subscriberService;
    private final SubscriberRepository subscriberRepository;
    private final BusinessTypeService businessTypeService;
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

            job.update(12, "Subscription", "Ensuring active subscription");
            ensureActiveSubscription(subscriber.getId());

            job.update(20, "Customers", "Creating customers");
            int customersCreated = ensureCustomers(subscriber, businessType.getName());

            job.update(35, "Vendors", "Creating vendors");
            int vendorsCreated = ensureVendors(subscriber, businessType.getName());

            job.update(50, "Products", "Creating products");
            int productsCreated = ensureProducts(subscriber, businessType.getName());

            List<Long> customerIds = customerRepository.findBySubscriber(subscriber.getId(), true, null,
                            PageRequest.of(0, MIN_CUSTOMERS))
                    .map(customer -> customer.getId())
                    .getContent();
            List<Long> vendorIds = vendorRepository.findBySubscriber(subscriber.getId(), true, null,
                            PageRequest.of(0, MIN_VENDORS))
                    .map(vendor -> vendor.getId())
                    .getContent();
            List<Long> productIds = productRepository.findBySubscriber(subscriber.getId(), true, null,
                            PageRequest.of(0, MIN_PRODUCTS))
                    .map(product -> product.getId())
                    .getContent();

            job.update(70, "Purchases", "Creating purchase orders");
            int purchasesCreated = createPurchases(
                    subscriber.getId(), vendorIds, productIds, request.getFromDate(), request.getToDate()
            );

            job.update(85, "Sales", "Creating sales orders");
            int salesCreated = createSales(
                    subscriber.getId(), customerIds, productIds, request.getFromDate(), request.getToDate()
            );

            job.update(98, "Finalizing", "Preparing summary");
            Subscriber refreshed = subscriberService.getById(subscriber.getId());

            DemoDataGenerationResult result = new DemoDataGenerationResult();
            result.setSubscriberId(refreshed.getId());
            result.setBusinessName(refreshed.getBusinessName());
            result.setBusinessTypeName(businessType.getName());
            result.setOwnerName(refreshed.getOwnerName());
            result.setPhone(refreshed.getPhone());
            result.setLoginPin(refreshed.getLoginPin());
            result.setCustomersCreated(customersCreated);
            result.setVendorsCreated(vendorsCreated);
            result.setProductsCreated(productsCreated);
            result.setPurchasesCreated(purchasesCreated);
            result.setSalesCreated(salesCreated);
            populateTotals(result, refreshed.getId());
            job.complete(result);
        } catch (Exception ex) {
            String message = ex instanceof ResponseStatusException responseStatusException
                    ? responseStatusException.getReason()
                    : ex.getMessage();
            job.fail(message != null ? message : "Demo data generation failed");
        }
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
                .findFirst()
                .map(plan -> plan.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Create at least one active subscription plan before generating demo data"
                ));

        SubscribeRequest subscribeRequest = new SubscribeRequest();
        subscribeRequest.setPlanId(planId);
        subscriberSubscriptionService.subscribe(subscriberId, subscribeRequest);
    }

    private int ensureCustomers(Subscriber subscriber, String businessTypeName) {
        long existing = customerRepository.countBySubscriber_Id(subscriber.getId());
        int toCreate = Math.max(0, MIN_CUSTOMERS - (int) existing);
        int created = 0;

        for (int i = 0; i < toCreate; i++) {
            int sequence = (int) existing + i + 1;
            CreateCustomerRequest request = new CreateCustomerRequest();
            request.setName("Customer " + sequence + " - " + businessTypeName);
            request.setPhone("9800" + String.format("%06d", sequence));
            request.setEmail("customer" + sequence + "@demo.local");
            request.setAddress("Demo Street " + sequence);
            request.setActive(true);
            request.setCustomerType(i % 4 == 0 ? CustomerType.COMPANY : CustomerType.INDIVIDUAL);
            if (request.getCustomerType() == CustomerType.COMPANY) {
                request.setBusinessName(request.getName() + " Pvt Ltd");
                request.setGstNumber("29DEMO" + String.format("%05d", sequence) + "Z1");
            }
            customerService.create(subscriber.getId(), request);
            created++;
        }

        return created;
    }

    private int ensureVendors(Subscriber subscriber, String businessTypeName) {
        long existing = vendorRepository.countBySubscriber_Id(subscriber.getId());
        int toCreate = Math.max(0, MIN_VENDORS - (int) existing);
        int created = 0;

        for (int i = 0; i < toCreate; i++) {
            int sequence = (int) existing + i + 1;
            CreateVendorRequest request = new CreateVendorRequest();
            request.setName("Vendor " + sequence + " - " + businessTypeName);
            request.setContactPerson("Contact " + sequence);
            request.setPhone("9810" + String.format("%06d", sequence));
            request.setEmail("vendor" + sequence + "@demo.local");
            request.setAddress("Vendor Road " + sequence);
            request.setActive(true);
            request.setVendorType(i % 3 == 0 ? CustomerType.COMPANY : CustomerType.SHOP);
            if (request.getVendorType() == CustomerType.COMPANY) {
                request.setBusinessName(request.getName() + " Traders");
                request.setGstNumber("29VEND" + String.format("%05d", sequence) + "Z1");
            }
            vendorService.create(subscriber.getId(), request);
            created++;
        }

        return created;
    }

    private int ensureProducts(Subscriber subscriber, String businessTypeName) {
        long existing = productRepository.countBySubscriber_Id(subscriber.getId());
        int toCreate = Math.max(0, MIN_PRODUCTS - (int) existing);
        if (toCreate == 0) {
            return 0;
        }

        List<DemoProductCatalog.ProductSeed> seeds = DemoProductCatalog.buildProducts(businessTypeName, toCreate);
        int created = 0;
        for (DemoProductCatalog.ProductSeed seed : seeds) {
            String productName = uniqueProductName(subscriber.getId(), seed.name(), (int) existing + created + 1);
            CreateProductRequest request = new CreateProductRequest();
            request.setName(productName);
            request.setSellingPrice(seed.price());
            request.setDiscount(seed.discount());
            request.setActive(true);
            productService.create(subscriber.getId(), request);
            created++;
        }

        return created;
    }

    private String uniqueProductName(Long subscriberId, String baseName, int sequence) {
        String candidate = baseName;
        int attempt = 0;
        while (productRepository.existsBySubscriberIdAndNameIgnoreCase(subscriberId, candidate)) {
            attempt++;
            candidate = baseName + " #" + (sequence + attempt);
        }
        return candidate;
    }

    private int createPurchases(Long subscriberId,
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
                purchaseIds.add(purchaseService.create(subscriberId, request).getId());
                orderIndex++;
            }
        }

        applyPurchasePayments(subscriberId, purchaseIds);
        return purchaseIds.size();
    }

    private int createSales(Long subscriberId,
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
                saleIds.add(saleService.create(subscriberId, request).getId());
                orderIndex++;
            }
        }

        applySalePayments(subscriberId, saleIds);
        return saleIds.size();
    }

    private void applyPurchasePayments(Long subscriberId, List<Long> purchaseIds) {
        for (int i = 0; i < purchaseIds.size(); i++) {
            Long purchaseId = purchaseIds.get(i);
            var purchase = purchaseService.getById(subscriberId, purchaseId);
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

    private void applySalePayments(Long subscriberId, List<Long> saleIds) {
        for (int i = 0; i < saleIds.size(); i++) {
            Long saleId = saleIds.get(i);
            var sale = saleService.getById(subscriberId, saleId);
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

    private void populateTotals(DemoDataGenerationResult result, Long subscriberId) {
        result.setTotalCustomers(customerRepository.countBySubscriber_Id(subscriberId));
        result.setTotalVendors(vendorRepository.countBySubscriber_Id(subscriberId));
        result.setTotalProducts(productRepository.countBySubscriber_Id(subscriberId));
        result.setTotalPurchases(purchaseRepository.countBySubscriber_Id(subscriberId));
        result.setTotalSales(saleRepository.countBySubscriber_Id(subscriberId));
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
        response.setCustomerCount(customerRepository.countBySubscriber_Id(subscriber.getId()));
        response.setVendorCount(vendorRepository.countBySubscriber_Id(subscriber.getId()));
        response.setProductCount(productRepository.countBySubscriber_Id(subscriber.getId()));
        response.setSaleCount(saleRepository.countBySubscriber_Id(subscriber.getId()));
        response.setPurchaseCount(purchaseRepository.countBySubscriber_Id(subscriber.getId()));
        return response;
    }
}
