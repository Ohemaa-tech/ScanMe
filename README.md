# 🛒 SwiftScan — Barcode-Powered Point of Sale System

> A full-stack POS system for small retail shops with automated barcode scanning, AI product vision, dual-unit inventory tracking, and role-based access control.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Frontend Setup](#frontend-setup)
  - [Backend Setup](#backend-setup)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Role-Based Access](#role-based-access)
- [Development Phases](#development-phases)
- [Contributing](#contributing)

---

## Overview

**SwiftScan** is a barcode-powered Point of Sale (POS) system designed for small retail shops. It enables:

- **Shop Owners** to manage their product catalog via barcode scanning with automated product data lookup (name, brand, category, image), track inventory in bulk and single units, restock stock, manage worker accounts, and view business analytics.
- **Workers/Cashiers** to scan product barcodes at checkout, process sales with dual-unit (bulk carton vs. single piece) support, and view low-stock alerts.

The system is built with a **React + Vite** frontend and an **ASP.NET Core 8** REST API backend, backed by **SQL Server** (production) / **SQLite** (development).

---

## Tech Stack

### Frontend
| Technology | Role |
| :--- | :--- |
| **React 18** | UI framework |
| **Vite 5** | Build tool & dev server |
| **Tailwind CSS 3** | Utility-first styling |
| **React Router v6** | Client-side routing & protected routes |
| **TanStack Query v5** | API data fetching & caching |
| **Zustand v4** | Global state (Cart & Auth stores) |
| **Axios** | HTTP client with JWT interceptor |
| **@zxing/library** | Camera barcode decoding |
| **Recharts** | Analytics charts |
| **React Hot Toast** | Toast notifications |
| **Lucide React** | Icon library |

### Backend
| Technology | Role |
| :--- | :--- |
| **ASP.NET Core 8** | Web API framework |
| **C# 12** | Primary language |
| **Entity Framework Core 8** | ORM & migrations |
| **SQL Server / SQLite** | Production / Development database |
| **JWT Bearer Auth** | Token authentication |
| **BCrypt.Net** | Password hashing |
| **AutoMapper** | DTO ↔ Entity mapping |
| **FluentValidation** | Request validation |
| **Serilog** | Structured logging |
| **Swagger / Swashbuckle** | API documentation UI |
| **xUnit & Moq** | Unit & integration testing |
| **Open Food Facts API** | Automated barcode product lookup |

---

## Features

### 🔐 Authentication & Role-Based Access Control (RBAC)
- JWT-based login with two distinct roles: **Owner** and **Worker**
- Workers are created by the Owner from within the app — no public registration
- Role-enforced API endpoints (Owner-only endpoints return `403 Forbidden` to Workers)

### 📦 Automated Product Onboarding
- Scan any product barcode → automatically fetch **name, brand, category, image, and suggested price** from Open Food Facts
- Owner reviews and confirms the populated data before saving — no manual typing required

### ⚖️ Dual-Unit (Bulk & Single) Inventory Model
- Products can be sold in multiple packaging units (e.g., **Single Bottle** at $2.00 or **Carton of 24** at $40.00)
- All stock is tracked at **base unit level** — scanning a carton automatically deducts 24 base units
- Restocking supports both bulk and single unit inputs with automatic conversion

### 🛒 POS Checkout
- Camera barcode scanning via ZXing.js
- Cart with unit selector pills (switch between Bulk and Single per item)
- Payment method selection: Cash / Card / Mobile Money
- Atomic sale processing + automatic stock deduction in a single transaction

### 🔔 Low-Stock Alerts
- Alerts automatically generated when stock falls below the configured threshold
- Badge counter in navigation bar, polled every 30 seconds
- Alerts auto-resolve when stock is replenished

### 📊 Analytics Dashboard (Owner Only)
- Best-selling products, slow movers
- Revenue trends over time
- AI-powered restock recommendations

---

## Project Structure

```
ScanMe/
├── src/                          ← React frontend source
│   ├── api/                      ← Axios API modules
│   ├── components/               ← Shared UI components
│   ├── pages/                    ← Application views
│   ├── hooks/                    ← Custom React hooks
│   ├── store/                    ← Zustand state stores
│   └── utils/                    ← Helpers & formatters
├── public/                       ← Static assets & PWA icons
├── POS.API/                      ← ASP.NET Core Web API entry point
│   ├── Controllers/
│   ├── DTOs/
│   └── Middleware/
├── POS.Core/                     ← Domain entities, interfaces & enums
│   ├── Entities/
│   ├── Interfaces/
│   └── Enums/
├── POS.Infrastructure/           ← EF Core DbContext, repositories & external services
│   ├── Data/
│   ├── Repositories/
│   └── ExternalServices/
├── POS.Application/              ← Business logic services & validators
│   ├── Services/
│   ├── Validators/
│   └── Mappings/
├── POS.Tests/                    ← xUnit unit & integration tests
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
├── POS.slnx                      ← .NET solution file
├── FRONTEND.md                   ← Full frontend specification
└── BACKEND.md                    ← Full backend specification
```

---

## Getting Started

### Prerequisites
- **Node.js** v18+ and npm
- **.NET SDK 8.0** (for backend)
- **SQL Server** (production) or SQLite auto-created for local dev

---

### Frontend Setup

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

### Backend Setup

```bash
# Navigate to the API project
cd POS.API

# Apply EF Core migrations (creates SQLite DB for development)
dotnet ef database update --project ../POS.Infrastructure

# Run the API
dotnet run
```

The API will be available at `http://localhost:5000`. Swagger UI is available at `http://localhost:5000/swagger`.

---

## Environment Variables

Create a `.env` file in the project root (already gitignored):

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ALERT_POLL_INTERVAL=30000
VITE_TAX_RATE=0.00
```

Backend secrets are configured in `POS.API/appsettings.Development.json` (also gitignored). Key settings:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=pos.db"
  },
  "Jwt": {
    "Key": "YOUR_SECRET_JWT_KEY_HERE",
    "Issuer": "POSApi",
    "Audience": "POSClient",
    "ExpiryHours": 12
  }
}
```

---

## API Overview

All endpoints require `Authorization: Bearer <token>` except `/api/auth/login`.

| Endpoint | Method | Roles | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | POST | Public | User login |
| `/api/auth/me` | GET | All | Get current user profile |
| `/api/auth/register-worker` | POST | Owner | Create worker account |
| `/api/products` | GET | All | List products |
| `/api/products/barcode/{barcode}` | GET | All | Lookup product by scanned barcode |
| `/api/products/lookup-external/{barcode}` | GET | Owner | Auto-fetch product data from Open Food Facts |
| `/api/products` | POST | Owner | Create product with packaging units |
| `/api/sales` | POST | All | Complete sale + deduct stock |
| `/api/inventory` | GET | All | View stock levels |
| `/api/inventory/restock` | POST | Owner | Restock product |
| `/api/alerts` | GET | All | View low-stock alerts |
| `/api/analytics/*` | GET | Owner | Business intelligence dashboard |

> See [BACKEND.md](./BACKEND.md) for the complete API specification.

---

## Role-Based Access

| Feature | Shop Owner | Worker/Cashier |
| :--- | :---: | :---: |
| Login | ✅ | ✅ |
| POS Barcode Scanning & Checkout | ✅ | ✅ |
| View Low-Stock Alerts | ✅ | ✅ |
| View Inventory (read-only) | ✅ | ✅ |
| Create / Edit Products | ✅ | ❌ |
| Automated Barcode Product Import | ✅ | ❌ |
| Restock Inventory | ✅ | ❌ |
| Manage Worker Accounts | ✅ | ❌ |
| Analytics Dashboard | ✅ | ❌ |

---

## Development Phases

### Backend
- [x] **Phase 1** — Auth, database setup, product catalog & automated barcode lookup (Open Food Facts)
- [ ] **Phase 2** — Dual-unit sales processing & inventory restocking
- [ ] **Phase 3** — Alert system & RBAC enforcement verification
- [ ] **Phase 4** — Analytics dashboard & production deployment

### Frontend
- [x] **Phase 1** — Auth UI, protected routing & role-based navigation
- [ ] **Phase 2** — POS scan, dual-unit cart & checkout
- [ ] **Phase 3** — Automated barcode product import & owner catalog management
- [ ] **Phase 4** — Owner inventory restocking & analytics dashboard

> See [BACKEND.md](./BACKEND.md) and [FRONTEND.md](./FRONTEND.md) for detailed phase breakdowns.

---

## Contributing

This project is currently in active development. If you'd like to contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

*Built with ❤️ — ScanMe POS System v1.1 | July 2026*
