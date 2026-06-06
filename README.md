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
cp .env.example .env   # set DB credentials and admin login below
mvn spring-boot:run
```

The `.env` file is loaded automatically. Set your admin credentials there:

```
ADMIN_EMAIL=admin@quickbooks.local
ADMIN_PASSWORD=Admin@123
```

On **first startup only** (when the `admins` table is empty), Spring Boot creates the admin account using these values. On every later restart, the same credentials from the database are used — nothing new is generated.

**API:** http://localhost:9090  
**Health:** http://localhost:9090/api/health

### 3. Admin Web

```bash
cd admin-web
cp .env.example .env
npm install
npm run web
```

Opens at http://localhost:9091

### 4. Mobile App (Expo Go)

```bash
cd mobile-app
cp .env.example .env
npm install
npx expo start --port 9092
```

Expo dev server runs on port **9092**. Scan the QR code with **Expo Go (SDK 54)** on your phone.

| Command | What it does |
|---------|--------------|
| `npx expo start --port 9092` | Start dev server + show QR code for Expo Go |
| `npm start` | Same as above (port 9092 configured in package.json) |
| `npx expo start --android --port 9092` | Open on Android emulator |
| `npx expo start --tunnel --port 9092` | Use tunnel if phone and PC are on different networks |

> For Android emulator, set `EXPO_PUBLIC_API_URL=http://10.0.2.2:9090` in `mobile-app/.env`.  
> For a physical device on the same Wi-Fi, use your PC's LAN IP, e.g. `http://192.168.1.10:9090`.

## Ports

| Application | Port |
|-------------|------|
| Backend | **9090** |
| Admin Web | **9091** |
| Mobile App (Expo) | **9092** |

## Docker Deployment

```bash
cp .env.example .env   # configure as needed
docker compose up --build
```

| Service    | URL                   |
|-----------|------------------------|
| Backend   | http://localhost:9090  |
| Admin Web | http://localhost:9091  |
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
