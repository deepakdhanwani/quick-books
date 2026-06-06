# Quick Books — Application Requirements

> **Instructions:** Fill in each section below with as much detail as you can. The more specific you are, the better the application will match your vision. Leave sections blank if you're unsure — we can refine them together.

---

## 1. Project Overview

**Application name:** Quick Books

**One-line description:**
A SaaS platform that helps shopkeepers and business owners quickly log their purchases, sales, and payments — with a web portal for the platform admin and a mobile app for subscribers.

**Problem it solves:**
Small shopkeepers and business owners need a simple, fast way to record day-to-day transactions — what they buy, what they sell, and money they pay or receive — without the complexity of full accounting software. This app gives subscribers a lightweight tool to track purchases from their customers, sales to their customers, and payments with both customers and vendors.

**Target users:**
- **Platform admin** — manages the SaaS application (subscriptions, subscribers, system settings).
- **Subscribers (shopkeepers / business owners)** — pay to use the app to log their business purchases, sales, and payments.
- **End customers & vendors** *(not app users)* — the people a subscriber buys from or sells to; their transaction data is logged by the subscriber within the app.

**Business model:**
SaaS — shopkeepers and business owners subscribe to use the application.

---

## 2. Core Features

### Admin (Web Portal)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Create subscribers** | Admin can create subscriber accounts with mobile number and a generated **login PIN**. Admin shares the PIN with the subscriber. Admin does **not** assign a subscription plan — the subscriber chooses their own plan on first login. |
| 2 | **Manage subscription plans** | Admin can create and manage plans (e.g. monthly, yearly, etc.). |
| 3 | **Manage taxes** | Admin can define taxes (e.g. government taxes) applied when a subscriber signs up based on their subscription plan. |
| 4 | **Manage discounts** | Admin can apply discounts on subscriptions — for all subscribers or for specific subscribers. |
| 5 | **Reports** | Admin can view all relevant reports across every module — e.g. revenue, pending subscriptions, upcoming/expiring subscriptions, and breakdowns by business type. |

### Subscriber (Mobile App)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Manage customers** | Subscriber can create and manage their customers (end buyers). |
| 2 | **Manage vendors** | Subscriber can create and manage their vendors (suppliers). |
| 3 | **Log purchases** | Subscriber can record purchases (buying from vendors). |
| 4 | **Log sales** | Subscriber can record sales (selling to customers). |
| 5 | **Share transactions as PDF** | Subscriber can share purchase or sales details via the device share sheet (e.g. WhatsApp, email, etc.); the shared content is sent as a PDF. |
| 6 | **View transaction details** | Subscriber can view full details of their sales and purchases. |
| 7 | **Pending payments overview** | Subscriber can see amounts they still need to pay (e.g. to vendors) and amounts they are still owed (e.g. from customers). |
| 8 | **Reports** | Subscriber can view all relevant reports for their own business — e.g. sales, purchases, payments, pending amounts, and summaries by customer or vendor. |
| 9 | **Choose subscription plan** | On first login, subscriber must select a subscription plan before accessing any app features. |
| 10 | **Renew subscription** | When a subscription expires, subscriber must renew to regain access to app features. |

> **Note:** Both Admin and Subscriber users have access to reports. Admin reports cover the full platform (all subscribers, subscriptions, revenue). Subscriber reports cover only their own business data (sales, purchases, customers, vendors, payments).

> **Subscription access rules:**
> - Admin creates the account only — no plan is assigned at creation time.
> - Subscriber chooses and pays for a plan on **first login**.
> - While the subscription is **active**, all features are accessible.
> - When the subscription **expires**, the subscriber can still **log in** but **cannot access any app features** until they renew.
> - Renewal follows the same plan-selection flow; applicable taxes and discounts are applied automatically.

---

## 3. User Roles & Permissions

| Role | What they can do |
|------|-----------------|
| **Admin** (platform owner) | Manages the SaaS application via the **web portal** — subscribers, subscriptions, system administration, and **platform-wide reports**. |
| **Subscriber** (shopkeeper / business owner) | Uses the **mobile app** to choose/renew a subscription plan, then log purchases, sales, and payments related to their customers and vendors, and view **business reports**. If subscription is expired, can log in only — no features accessible until renewal. |
| **Customer / Vendor** *(data only, not an app user)* | Does not log in. Their details and transactions are recorded by the subscriber who serves or buys from them. |

---

## 4. User Flows

### Admin Flows (Web Portal)

#### Flow 1: Create a subscriber
1. Admin logs into the web portal.
2. Admin navigates to **Subscribers** and clicks **Create Subscriber**.
3. Admin enters subscriber details (business name, owner name, contact info, business type).
4. Admin enters the subscriber's mobile number; system auto-generates a **login PIN**.
5. Admin shares the mobile number and login PIN with the subscriber.
6. Subscriber account is created with **no subscription plan assigned**.
7. Subscriber can log in on the mobile app (mobile number + PIN) but must choose a plan before using any features.

#### Flow 2: Manage subscription plans & taxes
1. Admin navigates to **Subscription Plans**.
2. Admin creates or edits a plan (name, duration — monthly/yearly, price, features).
3. Admin navigates to **Taxes** and defines tax rules (name, rate, applicable plans).
4. Changes apply to new subscriptions; existing subscriptions follow their original terms unless updated by admin.

#### Flow 3: Apply a discount
1. Admin navigates to **Discounts**.
2. Admin creates a discount (percentage or fixed amount, validity period).
3. Admin chooses scope: **all subscribers** or **specific subscriber(s)**.
4. Discount is applied at subscription creation or renewal for eligible subscribers.

#### Flow 4: View admin reports
1. Admin navigates to **Reports**.
2. Admin selects report type (revenue, pending subscriptions, expiring subscriptions, business type breakdown, etc.).
3. Admin filters by date range, plan, or business type.
4. Admin views, exports, or prints the report.

---

### Subscriber Flows (Mobile App)

#### Flow 5: First login — choose a subscription plan
1. Subscriber opens the mobile app and logs in with their **mobile number** and **login PIN** provided by admin.
2. System detects no active subscription and redirects to the **Choose Plan** screen.
3. Subscriber views available plans (monthly, yearly, etc.) with prices, taxes, and any applicable discounts.
4. Subscriber selects a plan and completes payment/subscription activation.
5. System activates the subscription; subscriber gains full access to all app features.
6. Subscriber lands on the home/dashboard screen.

#### Flow 5b: Log in with expired subscription
1. Subscriber logs in with valid credentials.
2. System detects the subscription has **expired**.
3. Subscriber is shown a **Renew Subscription** screen — no other features are accessible.
4. Subscriber cannot navigate to customers, sales, purchases, reports, or any other module.
5. Subscriber must select a plan and renew to regain access.

#### Flow 5c: Renew subscription
1. Subscriber on the renewal screen views available plans (same as first-time selection).
2. Applicable taxes and any eligible discounts (global or subscriber-specific) are applied.
3. Subscriber confirms and completes renewal.
4. Subscription is reactivated; full feature access is restored.

#### Flow 5d: Log in and set up (active subscription)
1. Subscriber logs in with an active subscription.
2. Subscriber lands on the home/dashboard screen.
3. Subscriber optionally adds customers and vendors before logging transactions.

#### Flow 6: Create a customer or vendor
1. Subscriber navigates to **Customers** or **Vendors**.
2. Subscriber taps **Add New** and enters details (name, phone, email, address).
3. Contact is saved and available when logging sales or purchases.

#### Flow 7: Log a sale
1. Subscriber taps **New Sale**.
2. Subscriber selects a customer (or adds one inline).
3. Subscriber enters sale details (items/products, quantities, prices, date).
4. Subscriber records payment status: **fully paid**, **partially paid**, or **unpaid** (pending).
5. Sale is saved; pending amount (if any) is reflected in the pending payments overview.

#### Flow 8: Log a purchase
1. Subscriber taps **New Purchase**.
2. Subscriber selects a vendor (or adds one inline).
3. Subscriber enters purchase details (items/products, quantities, prices, date).
4. Subscriber records payment status: **fully paid**, **partially paid**, or **unpaid** (pending).
5. Purchase is saved; pending amount (if any) is reflected in the pending payments overview.

#### Flow 9: Share a transaction as PDF
1. Subscriber opens a sale or purchase detail screen.
2. Subscriber taps **Share**.
3. Device share sheet opens (WhatsApp, email, SMS, etc.).
4. System generates a PDF of the transaction and attaches it to the chosen channel.
5. Recipient receives the PDF with sale/purchase details.

#### Flow 10: View pending payments
1. Subscriber navigates to **Pending Payments**.
2. Subscriber sees two sections:
   - **To Receive** — outstanding amounts owed by customers.
   - **To Pay** — outstanding amounts owed to vendors.
3. Subscriber taps an entry to view the linked sale or purchase.

#### Flow 11: View subscriber reports
1. Subscriber navigates to **Reports**.
2. Subscriber selects report type (sales summary, purchase summary, payment status, customer/vendor breakdown, date range).
3. Subscriber views the report scoped to their own business data only.

---

## 5. Data & Entities

| Entity | Key fields | Notes |
|--------|-----------|-------|
| **Admin** | id, email, password_hash, name, created_at | Platform administrator; logs in via web portal. Email and password are auto-generated by the application on first setup. |
| **Subscriber** | id, business_name, owner_name, phone, login_pin_hash, business_type, subscription_status (none/active/expired), created_at | Account created by admin without a plan; logs in with phone + PIN; chooses plan on first login. |
| **SubscriptionPlan** | id, name, duration (monthly/yearly/custom), price, description, is_active | Defined by admin. |
| **Tax** | id, name, rate, applicable_plan_ids, is_active | Government or platform taxes applied per plan. |
| **Discount** | id, name, type (percentage/fixed), value, scope (all/specific), valid_from, valid_to, is_active | Can target all or specific subscribers. |
| **SubscriberSubscription** | id, subscriber_id, plan_id, discount_id, tax_amount, total_amount, start_date, end_date, status (active/expired) | Created when subscriber chooses or renews a plan — not assigned by admin. |
| **Customer** | id, subscriber_id, name, phone, email, address, created_at | End buyer; belongs to one subscriber. |
| **Vendor** | id, subscriber_id, name, phone, email, address, created_at | Supplier; belongs to one subscriber. |
| **Sale** | id, subscriber_id, customer_id, date, total_amount, paid_amount, pending_amount, payment_status, notes, created_at | Sale to a customer. |
| **Purchase** | id, subscriber_id, vendor_id, date, total_amount, paid_amount, pending_amount, payment_status, notes, created_at | Purchase from a vendor. |
| **SaleItem** | id, sale_id, description, quantity, unit_price, amount | Line items within a sale. |
| **PurchaseItem** | id, purchase_id, description, quantity, unit_price, amount | Line items within a purchase. |
| **Payment** | id, subscriber_id, type (received/paid), amount, date, reference_type (sale/purchase), reference_id, notes | Tracks money received from customers or paid to vendors. |

**Relationships (summary):**
- One **Subscriber** has many **Customers**, **Vendors**, **Sales**, **Purchases**, and **SubscriberSubscriptions**.
- One **Sale** belongs to one **Customer**; one **Purchase** belongs to one **Vendor**.
- **SaleItems** / **PurchaseItems** belong to their parent transaction.
- **Payments** link to a sale or purchase and update paid/pending amounts.

---

## 6. Technical Preferences

### Project Structure

The application is split into **three separate projects**:

| # | Project | Technology | Description |
|---|---------|-----------|-------------|
| 1 | **Backend** | Spring Boot | REST API, business logic, authentication, and database access. |
| 2 | **Admin Web** | React Native (Web) | Admin portal for platform management. Web first; same codebase can extend to mobile in the future. |
| 3 | **User Mobile App** | React Native (Mobile) + **Expo SDK 54** | Subscriber mobile app (iOS/Android); developed using Expo Go (SDK 54). |

```
quick-books/
├── backend/          # Spring Boot API
├── admin-web/        # Admin portal (React Native Web)
└── mobile-app/       # Subscriber app (React Native + Expo)
```

**Platform:**
- [x] Web app (browser) — **Admin Web** (initial release)
- [ ] Mobile app (iOS / Android) — **Admin Web** (planned for future; same React Native codebase)
- [x] Mobile app (iOS / Android) — **User Mobile App**
- [ ] Desktop app

### Tech Stack Summary

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Backend API** | Spring Boot (Java) | REST API consumed by both admin and subscriber clients. |
| **Database** | PostgreSQL | Primary data store for all application data. |
| **DB migrations** | Liquibase | Version-controlled schema migrations managed in the Spring Boot project. |
| **Admin Web** | React Native (Web) | Responsive admin portal. |
| **User Mobile App** | React Native + Expo SDK 54 | Subscriber mobile application. |

### Architecture
- **Component-based** — each functionality is built as a separate, reusable component following standard development practices.
- Shared UI components (buttons, inputs, cards, lists, modals) are extracted and reused across screens.
- Frontend projects communicate with the backend exclusively via REST API.

### Configuration
- Most application settings are stored in **`.env` files** (database URL, API keys, JWT secrets, ports, etc.).
- Each project has its own `.env` file; a `.env.example` template is provided for reference.
- Sensitive values are never committed to source control.

### Deployment
- **Docker Compose** file at the project root to orchestrate all services for deployment.
- Expected services in Docker Compose:
  - PostgreSQL database
  - Spring Boot backend
  - Admin Web (served as static/build output or containerized)
- Enables consistent local development and production deployment via Docker.

**Database:**
PostgreSQL (with Liquibase migrations)

**Authentication:**

| User | Method | Details |
|------|--------|---------|
| **Admin** | Email + password | On first application setup, the backend **auto-generates** admin email and password (logged/output for the platform owner). Admin uses these credentials to log into the web portal. |
| **Subscriber** | Mobile number + login PIN | When admin creates a subscriber, the system auto-generates a login PIN. Admin shares the PIN with the subscriber. Subscriber logs in using their mobile number and PIN. |

---

## 7. Design & UI

**Visual style:**
- **Responsive design** — layouts adapt to different screen sizes (web admin portal and mobile subscriber app).
- **Dark theme** — the application uses a dark theme throughout.
- **Modern & polished UI** — clean, attractive interface using modern UI controls and components.
- **Component-based** — each feature is built with dedicated, reusable UI components per standard development practices.

**Color scheme / branding:**
Dark theme (primary visual direction). Specific brand colors to be defined during design phase.

**Reference apps or designs you like:**
<!-- To be added -->

**Accessibility requirements:**
<!-- To be defined -->

---

## 8. Integrations

List any third-party services the app should connect to.

| Service | Purpose |
|---------|---------|
| | |
| | |

**Examples:** Stripe (payments), SendGrid (email), QuickBooks API, bank feeds, tax APIs

---

## 9. Non-Functional Requirements

- **Performance:** <!-- e.g. Page load under 2 seconds -->
- **Security:** <!-- e.g. Encrypt sensitive data, HTTPS only -->
- **Scalability:** <!-- e.g. Support 100 concurrent users initially -->
- **Offline support:** <!-- Yes / No -->
- **Multi-language:** <!-- Yes / No — which languages? -->
- **Compliance:** <!-- e.g. GDPR, SOC 2, local tax regulations -->

---

## 10. Out of Scope (for now)

Explicitly list what this app will **not** do in the first version.

- 
- 

---

## 11. Milestones & Timeline

| Milestone | Description | Target date |
|-----------|-------------|-------------|
| MVP | | |
| v1.0 | | |
| v2.0 | | |

---

## 12. Additional Notes

Requirements gathering is **complete for the initial phase**. Remaining items (integrations, milestones, non-functional requirements) can be refined during development.

**Confirmed technical decisions:**
- 3-project monorepo: `backend` (Spring Boot), `admin-web`, `mobile-app`
- PostgreSQL + Liquibase for migrations
- Docker Compose for deployment
- `.env` files for configuration
- Auto-generated admin credentials on first setup

---

*This document serves as the blueprint for building the Quick Books application.*
