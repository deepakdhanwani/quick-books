# Quick Books

A SaaS platform for shopkeepers and business owners to log purchases, sales, and payments.

- **Admin Web** — platform management (React Native Web + Expo SDK 54)
- **Mobile App** — subscriber app (React Native + Expo SDK 54)
- **Backend** — REST API (Spring Boot + PostgreSQL + Liquibase)

See [REQUIREMENTS.md](./REQUIREMENTS.md) for the full specification.

## Project Structure

```
quick-books/
├── backend/        # Spring Boot API
├── admin-web/      # Admin portal (Expo Web)
├── mobile-app/     # Subscriber app (Expo Mobile)
├── docker-compose.yml
└── REQUIREMENTS.md
```

## Prerequisites

- Java 21+
- Maven 3.9+
- Node.js 20+
- PostgreSQL (local or Docker)
- Expo Go (SDK 54) for mobile development

## Quick Start (Local Development)

### 1. Database

Create a PostgreSQL database named `quickbooks`, or use Docker:

```bash
docker compose up postgres -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # edit with your DB credentials
mvn spring-boot:run
```

On first run, admin credentials are auto-generated and printed in the console.

**API:** http://localhost:8080  
**Health:** http://localhost:8080/api/health

### 3. Admin Web

```bash
cd admin-web
cp .env.example .env
npm install
npm run web
```

Opens at http://localhost:8081 (or the port Expo assigns).

### 4. Mobile App

```bash
cd mobile-app
cp .env.example .env
npm install
npm start
```

Scan the QR code with **Expo Go (SDK 54)**.

> For Android emulator, set `EXPO_PUBLIC_API_URL=http://10.0.2.2:8080` in `mobile-app/.env`.

## Docker Deployment

```bash
cp .env.example .env   # configure as needed
docker compose up --build
```

| Service    | URL                   |
|-----------|------------------------|
| Backend   | http://localhost:8080  |
| Admin Web | http://localhost:8081  |
| PostgreSQL| localhost:5432         |

## API Endpoints (initial)

| Method | Endpoint                      | Description              |
|--------|-------------------------------|--------------------------|
| GET    | `/api/health`                 | Health check             |
| POST   | `/api/auth/admin/login`       | Admin login              |
| POST   | `/api/auth/subscriber/login`  | Subscriber login         |
| GET    | `/api/admin/subscribers`      | List subscribers (admin) |
| POST   | `/api/admin/subscribers`      | Create subscriber (admin)|

## Environment Files

Each project has its own `.env` file. Copy from `.env.example` — never commit `.env` files with real secrets.
