# POS SYSTEM - Backend Project Documentation
**ASP.NET Core 8 · C# · Entity Framework Core · SQL Server · JWT Auth**  
*Version 1.1 | July 2026*

---

## 1. Project Overview
This document is the complete backend specification and build guide for the POS System REST API. The backend is built in C# using ASP.NET Core 8 Web API and serves as the single source of truth for all business logic: authentication & role-based authorization, product management, automated external barcode integration, dual-unit (bulk & single) inventory tracking, sales processing, alert generation, and analytics aggregation. It exposes a secure JSON REST API consumed by the React frontend.

### 1.1 Goals
- **Role-Based Access Control (RBAC)**: Enforce strict user account roles — **Shop Owner** (full administrative, catalog management, restocking, analytics, and worker management rights) vs. **Worker/Cashier** (restricted to scanning, POS sales processing, and stock deduction only).
- **Automated Product Onboarding**: Shift product registration from manual data entry to automated barcode scanning powered by external product lookup APIs (e.g., Open Food Facts / BarcodeLookup API) for automatic product title, brand, category, suggested price, and image population.
- **Dual-Unit (Bulk & Single) Sales & Inventory Model**: Support products sold simultaneously in bulk packaging (cartons, crates, packs) and individual single units (pieces, bottles). Track stock accurately at the base unit level while permitting sales and restocking using unit conversions.
- **Atomic Sales Processing**: Process sales transactions and automatically decrement base unit inventory in a single atomic transaction.
- **Real-Time Low-Stock Alerts**: Automatically generate alerts when base inventory levels fall below defined thresholds.
- **Analytics & Business Intelligence**: Aggregate sales into actionable insights (best sellers, slow movers, revenue trends, recommendations) restricted exclusively to Shop Owners.

### 1.2 Tech Stack

| Technology | Role | Version / Notes |
| :--- | :--- | :--- |
| **ASP.NET Core 8** | Web API framework | .NET 8 LTS |
| **C#** | Primary language | C# 12 |
| **Entity Framework Core 8** | ORM & migrations | EF Core 8 |
| **SQL Server** | Production database | 2019+ or Azure SQL |
| **SQLite** | Development database | Quick local setup |
| **JWT Bearer Auth** | Token authentication | Microsoft.AspNetCore.Authentication.JwtBearer |
| **BCrypt.Net** | Password hashing | v4+ |
| **HttpClient / Refit** | External API integration | Open Food Facts / Barcode Lookup API client |
| **AutoMapper** | DTO ↔ Entity mapping | v13+ |
| **FluentValidation** | Request validation | v11+ |
| **Serilog** | Structured logging | v3+ |
| **Swashbuckle / Swagger** | API documentation UI | v6+ (with JWT Authorize support) |
| **xUnit & Moq** | Testing suite | Unit & integration tests |

---

## 2. Solution & Folder Structure

```text
POS.sln
├── POS.API/                    ← ASP.NET Core Web API (entry point)
│   ├── Controllers/
│   │   ├── AuthController.cs       ← Login, register worker, me endpoints
│   │   ├── ProductsController.cs   ← Product catalog & external lookup
│   │   ├── SalesController.cs      ← Checkout & sales history
│   │   ├── InventoryController.cs  ← Restock & stock management
│   │   ├── AlertsController.cs     ← Low-stock alerts
│   │   └── AnalyticsController.cs  ← Owner analytics dashboard
│   ├── DTOs/                   ← Request & response shapes
│   │   ├── AuthDto.cs
│   │   ├── ProductDto.cs
│   │   ├── ProductUnitDto.cs
│   │   ├── ExternalProductLookupDto.cs
│   │   ├── SaleDto.cs
│   │   ├── InventoryDto.cs
│   │   ├── AlertDto.cs
│   │   └── AnalyticsDto.cs
│   ├── Middleware/
│   │   ├── ExceptionMiddleware.cs
│   │   └── RequestLoggingMiddleware.cs
│   ├── appsettings.json
│   ├── appsettings.Development.json
│   └── Program.cs
│
├── POS.Core/                   ← Domain: entities, interfaces, enums
│   ├── Entities/
│   │   ├── User.cs             ← System accounts (Owner / Worker)
│   │   ├── Product.cs          ← Master product record
│   │   ├── ProductUnit.cs      ← Packaging unit & barcode mapping (Bulk vs Single)
│   │   ├── Inventory.cs        ← Base unit stock level
│   │   ├── Sale.cs             ← Header sale record
│   │   ├── SaleItem.cs         ← Line item with unit conversion
│   │   └── Alert.cs            ← Low-stock notifications
│   ├── Interfaces/
│   │   ├── IUserRepository.cs
│   │   ├── IProductRepository.cs
│   │   ├── IExternalBarcodeService.cs
│   │   ├── ISaleRepository.cs
│   │   ├── IInventoryRepository.cs
│   │   ├── IAlertRepository.cs
│   │   └── IAnalyticsRepository.cs
│   └── Enums/
│       ├── UserRole.cs         ← Owner, Worker
│       ├── AlertType.cs        ← LowStock, OutOfStock
│       └── StockStatus.cs      ← OK, LowStock, OutOfStock
│
├── POS.Infrastructure/         ← EF Core DbContext, repositories, external API
│   ├── Data/
│   │   ├── AppDbContext.cs
│   │   └── Seed/
│   │       └── DataSeeder.cs
│   ├── Repositories/
│   │   ├── UserRepository.cs
│   │   ├── ProductRepository.cs
│   │   ├── SaleRepository.cs
│   │   ├── InventoryRepository.cs
│   │   ├── AlertRepository.cs
│   │   └── AnalyticsRepository.cs
│   ├── ExternalServices/
│   │   └── OpenFoodFactsBarcodeService.cs ← External API client
│   └── Migrations/
│
├── POS.Application/            ← Business logic services
│   ├── Services/
│   │   ├── AuthService.cs      ← Login, JWT generation, password validation
│   │   ├── ProductService.cs   ← Catalog CRUD & automated barcode enrichment
│   │   ├── SaleService.cs      ← Transactional sales & stock deduction
│   │   ├── InventoryService.cs ← Owner restocking & threshold management
│   │   ├── AlertService.cs     ← Low-stock detection
│   │   └── AnalyticsService.cs ← Business intelligence calculations
│   ├── Validators/
│   │   ├── LoginRequestValidator.cs
│   │   ├── CreateProductValidator.cs
│   │   └── CompleteSaleValidator.cs
│   └── Mappings/
│       └── MappingProfile.cs
│
└── POS.Tests/                  ← xUnit tests
    ├── Unit/
    │   ├── AuthServiceTests.cs
    │   ├── SaleServiceTests.cs
    │   ├── InventoryServiceTests.cs
    │   └── AlertServiceTests.cs
    └── Integration/
        └── SalesControllerTests.cs
```

---

## 3. Database Schema

### 3.1 Entities

#### Users (Account & RBAC Management)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| **Id** | `int` | PK, Identity | Primary key |
| **Username** | `nvarchar(50)` | NOT NULL, UNIQUE, INDEX | Login username |
| **Email** | `nvarchar(150)` | NOT NULL, UNIQUE | User email address |
| **PasswordHash** | `nvarchar(255)` | NOT NULL | BCrypt hashed password |
| **FullName** | `nvarchar(100)` | NOT NULL | User's full name |
| **Role** | `nvarchar(20)` | NOT NULL | `Owner` or `Worker` |
| **IsActive** | `bit` | DEFAULT 1 | Account status flag |
| **CreatedAt** | `datetime2` | NOT NULL | Record creation timestamp |

#### Products (Master Product Catalog)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| **Id** | `int` | PK, Identity | Primary key |
| **Name** | `nvarchar(200)` | NOT NULL | Display name of the product |
| **BaseUnitName** | `nvarchar(50)` | NOT NULL, DEFAULT 'Piece' | Base unit measure (e.g. Piece, Bottle, Kg) |
| **Category** | `nvarchar(100)` | NULL | Product category |
| **Brand** | `nvarchar(100)` | NULL | Product brand |
| **Description** | `nvarchar(1000)`| NULL | Product description |
| **ImageUrl** | `nvarchar(500)` | NULL | Product photo URL (auto-fetched or uploaded) |
| **IsActive** | `bit` | DEFAULT 1 | Soft delete flag |
| **CreatedAt** | `datetime2` | NOT NULL | Record creation timestamp |
| **UpdatedAt** | `datetime2` | NOT NULL | Last update timestamp |

#### ProductUnits (Bulk & Single Unit Packaging Configurations)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| **Id** | `int` | PK, Identity | Primary key |
| **ProductId** | `int` | FK → Products.Id, INDEX | Parent product |
| **UnitName** | `nvarchar(50)` | NOT NULL | Packaging label (e.g. Single, Pack of 6, Carton of 24) |
| **Barcode** | `nvarchar(100)` | NOT NULL, UNIQUE, INDEX | Scanned barcode value for this unit packaging |
| **ConversionFactor**| `int` | NOT NULL, DEFAULT 1 | Number of base units in this package (Single = 1, Carton = 24) |
| **Price** | `decimal(18,2)` | NOT NULL | Selling price for this specific packaging unit |
| **IsDefault** | `bit` | DEFAULT 0 | Primary barcode indicator for single unit scan |

#### Inventory (Base Unit Stock Tracking)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| **Id** | `int` | PK, Identity | Primary key |
| **ProductId** | `int` | FK → Products.Id, UNIQUE | One inventory record per master product |
| **Quantity** | `int` | NOT NULL, DEFAULT 0 | **Current stock count in BASE UNITS** |
| **LowStockThreshold**| `int` | NOT NULL, DEFAULT 10 | Low stock alert threshold (in base units) |
| **LastUpdatedAt** | `datetime2` | NOT NULL | Timestamp of last stock change |
| **LastRestockedBy** | `int` | FK → Users.Id, NULL | User ID of the owner who last restocked |

#### Sales (Sale Transactions)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| **Id** | `int` | PK, Identity | Primary key |
| **UserId** | `int` | FK → Users.Id, INDEX | Cashier/Worker or Owner who processed sale |
| **SaleDate** | `datetime2` | NOT NULL, INDEX | Timestamp of completed transaction |
| **TotalAmount** | `decimal(18,2)` | NOT NULL | Sum of line totals |
| **TaxAmount** | `decimal(18,2)` | NOT NULL, DEFAULT 0 | Tax amount |
| **PaymentMethod** | `nvarchar(50)` | NOT NULL | Cash / Card / Mobile Money |
| **Notes** | `nvarchar(500)` | NULL | Cashier notes |

#### SaleItems (Transaction Line Items)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| **Id** | `int` | PK, Identity | Primary key |
| **SaleId** | `int` | FK → Sales.Id, INDEX | Parent sale transaction |
| **ProductId** | `int` | FK → Products.Id, INDEX | Master product |
| **ProductUnitId** | `int` | FK → ProductUnits.Id, INDEX| Unit packaging sold (Bulk vs Single) |
| **UnitName** | `nvarchar(50)` | NOT NULL | Snapshot of unit name sold (e.g. Carton of 24) |
| **Quantity** | `int` | NOT NULL | Number of packages sold |
| **ConversionFactor**| `int` | NOT NULL | Snapshot of conversion factor at time of sale |
| **BaseUnitsDeducted**| `int` | NOT NULL | `Quantity × ConversionFactor` (base units deducted) |
| **UnitPrice** | `decimal(18,2)` | NOT NULL | Price charged per package unit snapshot |
| **LineTotal** | `decimal(18,2)` | NOT NULL | `Quantity × UnitPrice` |

#### Alerts (Low-Stock System Notifications)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| **Id** | `int` | PK, Identity | Primary key |
| **ProductId** | `int` | FK → Products.Id, INDEX | Product affected |
| **AlertType** | `nvarchar(50)` | NOT NULL | `LowStock` \| `OutOfStock` |
| **Message** | `nvarchar(500)` | NOT NULL | Alert message (includes base unit count) |
| **IsRead** | `bit` | DEFAULT 0 | Read/unread status |
| **CreatedAt** | `datetime2` | NOT NULL, INDEX | Alert timestamp |

---

### 3.2 Dual-Unit (Bulk & Single) Inventory & Sales Model Architecture

To handle products that are sold both in **Bulk** (e.g. Carton of 24, Pack of 6) and **Single Units** (e.g. Individual 500ml Bottle):

1. **Single Base Unit Storage**: All inventory stock is tracked in `Inventory.Quantity` strictly at the **Base Unit level** (e.g., total single bottles in stock).
2. **Barcode Packaging Mappings (`ProductUnits`)**:
   - Manufacturer barcodes for bulk cartons and single units are different.
   - A single `Product` record links to multiple `ProductUnits` records:
     - `UnitName`: "Single Bottle", `Barcode`: "01234567", `ConversionFactor`: 1, `Price`: $2.00
     - `UnitName`: "Carton of 24", `Barcode`: "01239999", `ConversionFactor`: 24, `Price`: $40.00
3. **Automated Stock Deduction**:
   - When a worker scans "01234567" (Single Bottle), line total is $2.00, and stock is decremented by `1 × 1 = 1` base unit.
   - When a worker scans "01239999" (Carton of 24), line total is $40.00, and stock is decremented by `1 × 24 = 24` base units.
4. **Restocking**:
   - Shop owners can restock either by entering bulk carton quantities (e.g., adding 5 cartons converts to `5 × 24 = +120` base units in inventory) or entering single base units directly.

---

## 4. API Endpoint Specifications & RBAC Matrix

All endpoints require JWT Bearer Authentication (`Authorization: Bearer <token>`).

### Role Access Matrix:
- **`Owner`**: Full access to all endpoints.
- **`Worker`**: Access to Auth (`/me`), Product Scan Lookup, Sales Checkout, and Active Alert Notifications. Blocked from Adding/Editing Products, External Barcode Lookup, Stock Restocking/Updates, and Analytics.

| Endpoint Route | Method | Roles Allowed | Description | Request Payload / Params |
| :--- | :--- | :--- | :--- | :--- |
| **`/api/auth/login`** | `POST` | Anonymous | User authentication | `{ username, password }` |
| **`/api/auth/me`** | `GET` | Owner, Worker | Get active user profile | – |
| **`/api/auth/register-worker`** | `POST` | Owner Only | Owner creates new worker account | `{ username, email, password, fullName }` |
| **`/api/products`** | `GET` | Owner, Worker | List active products & unit prices | `?search=`, `?category=`, `?page=` |
| **`/api/products/{id}`** | `GET` | Owner, Worker | Get product detail with all units | – |
| **`/api/products/barcode/{barcode}`** | `GET` | Owner, Worker | Lookup product unit by scanned barcode | – |
| **`/api/products/lookup-external/{barcode}`** | `GET` | Owner Only | Automated external barcode metadata lookup | Query Open Food Facts / Barcode DB |
| **`/api/products`** | `POST` | Owner Only | Create product with bulk & single units | `{ name, baseUnitName, category, brand, units: [{unitName, barcode, conversionFactor, price}], initialBaseStock, lowStockThreshold }` |
| **`/api/products/{id}`** | `PUT` | Owner Only | Update product & packaging units | `{ name, category, brand, units: [...] }` |
| **`/api/products/{id}`** | `DELETE` | Owner Only | Soft-delete product | – |
| **`/api/sales`** | `POST` | Owner, Worker | Complete sale transaction; deduct base stock | `{ items: [{productUnitId, quantity}], paymentMethod, notes }` |
| **`/api/sales`** | `GET` | Owner, Worker | List sales history | `?from=`, `?to=`, `?page=` |
| **`/api/sales/{id}`** | `GET` | Owner, Worker | Get sale detail breakdown | – |
| **`/api/inventory`** | `GET` | Owner, Worker | Inventory list (base stock & packaging count) | `?search=`, `?status=low\|out\|ok` |
| **`/api/inventory/restock`** | `POST` | Owner Only | Restock product stock in bulk or single units | `{ productId, productUnitId, quantityRestocked }` |
| **`/api/inventory/{productId}`** | `PATCH` | Owner Only | Manually adjust base stock or low-stock threshold | `{ quantity?, lowStockThreshold? }` |
| **`/api/alerts`** | `GET` | Owner, Worker | View active low-stock alerts | `?status=active\|read\|all` |
| **`/api/alerts/count`** | `GET` | Owner, Worker | Get unread alerts count | – |
| **`/api/alerts/{id}/read`**| `PATCH` | Owner, Worker | Mark alert as read | – |
| **`/api/analytics/*`** | `GET` | Owner Only | All analytics, top sellers, revenue trends & recommendations | Restricted exclusively to Shop Owners |

---

## 5. Service Layer — Business Logic

### 5.1 AuthService
- **`Authenticate(loginDto)`**: Validates username & BCrypt password hash. If valid, generates signed JWT token containing claims: `sub` (UserId), `unique_name` (Username), `role` (`Owner` | `Worker`), `name` (FullName).
- **`RegisterWorker(createWorkerDto)`**: Validated only when caller has `Owner` role. Hashes password using BCrypt and creates account with `UserRole.Worker`.

### 5.2 ExternalBarcodeService (Automated Barcode Onboarding)
- **`LookupBarcode(barcode)`**: Queries external product API (Open Food Facts REST API: `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`).
- **Response Transformation**: Parses returned JSON into `ExternalProductLookupDto`:
  - `ProductName` (or `product_name_en`)
  - `Brand` (or `brands`)
  - `Category` (or `categories_tags[0]`)
  - `ImageUrl` (or `image_front_url`)
  - `SuggestedPrice` (MSRP if available, otherwise defaults to 0.00 for Owner input)
- Enables shop owner to scan any new product barcode and auto-populate catalog inputs in 1 click.

### 5.3 SaleService (Dual-Unit Transactional Deduction)
1. **Validate Items**: Fetch `ProductUnits` by `productUnitId` for each line item. Ensure parent product is active.
2. **Stock Verification**: Calculate total base units required per product:
   $$\text{Required Base Units} = \sum (\text{Line Quantity} \times \text{ProductUnit.ConversionFactor})$$
   If `Inventory.Quantity < Required Base Units`, abort and throw `InsufficientStockException(productName, available, required)`.
3. **Line Calculations**: Calculate `LineTotal = Quantity × ProductUnit.Price`. Compute `TotalAmount`.
4. **Database Transaction**:
   - Save `Sale` record linked to `UserId` (current logged in worker/owner).
   - Insert `SaleItem` records capturing `ProductUnitId`, `UnitName`, `Quantity`, `ConversionFactor`, `BaseUnitsDeducted`, and `UnitPrice`.
   - Update Inventory: `UPDATE Inventory SET Quantity = Quantity - RequiredBaseUnits WHERE ProductId = ...`.
5. **Alert Triggering**: Execute `AlertService.CheckAndGenerateAlerts()` for all updated products post-commit.

### 5.4 InventoryService (Owner Restocking)
- Restricted exclusively to `Owner` role.
- **`RestockProduct(productId, productUnitId, quantityRestocked, userId)`**:
  - Fetches conversion factor for `productUnitId`. If a bulk carton of 24 is selected and quantity is 5, base units added = `5 × 24 = 120`.
  - Atomically increments `Inventory.Quantity += 120`.
  - Updates `LastUpdatedAt` and `LastRestockedBy = userId`.
  - Triggers `AlertService` to auto-resolve low-stock alerts if stock exceeds threshold.

---

## 6. Authentication & Authorization Architecture

### 6.1 JWT Bearer Token Setup
Configured in `Program.cs`:
```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => {
        options.TokenValidationParameters = new TokenValidationParameters {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
        };
    });

builder.Services.AddAuthorization(options => {
    options.AddPolicy("OwnerOnly", policy => policy.RequireRole("Owner"));
    options.AddPolicy("OwnerOrWorker", policy => policy.RequireRole("Owner", "Worker"));
});
```

---

## 7. Configuration — appsettings.json

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=pos.db"
  },
  "Jwt": {
    "Key": "SUPER_SECRET_POS_JWT_SIGNING_KEY_2026_CHANGE_IN_PROD!",
    "Issuer": "POSApi",
    "Audience": "POSClient",
    "ExpiryHours": 12
  },
  "ExternalBarcodeApi": {
    "BaseUrl": "https://world.openfoodfacts.org/api/v2/product/",
    "UserAgent": "ScanMePOS - Windows - Version 1.1"
  },
  "Cors": {
    "AllowedOrigins": [ "http://localhost:5173" ]
  },
  "Inventory": {
    "DefaultLowStockThreshold": 10
  }
}
```

---

## 8. Development Phases

### PHASE 1 — Auth, Database & Product Management with Automated Barcode Lookup
- [x] EF Core setup with SQLite & SQL Server providers
- [x] User entity, BCrypt hashing, JWT Token generation
- [x] `AuthController`: Login, register worker, me endpoints
- [x] Master Product entity + `ProductUnits` dual-unit relationship
- [x] `ExternalBarcodeService`: Open Food Facts automated product metadata API integration
- [x] `ProductsController` with automated lookup endpoint (`/lookup-external/{barcode}`) and CRUD guarded by `Owner` role

### PHASE 2 — Dual-Unit Sales Processing & Inventory Restocking
- [ ] `SaleService` with packaging unit conversion factor logic
- [ ] Stock verification & atomic base unit decrement in transaction
- [ ] `SalesController` accessible to both Workers and Owners
- [ ] `InventoryService` restocking logic with bulk package conversion (Owner only)

### PHASE 3 — Alert System & RBAC Enforcement Verification
- [ ] `AlertService` triggered after sales & restocking based on base unit thresholds
- [ ] `AlertsController` badge & active alerts list
- [ ] Role enforcement unit tests verifying Worker calls to Owner endpoints return HTTP 403 Forbidden

### PHASE 4 — Analytics Dashboard & Production Deployment
- [ ] Owner-only Analytics endpoints (Top sellers, slow movers, revenue trends, AI recommendations)
- [ ] Swagger JWT authorization configuration
- [ ] Health check `/health` endpoint & Docker/Cloud production deployment

---

## 9. Error Handling & HTTP Status Codes

| Scenario | HTTP Status | Response Payload |
| :--- | :--- | :--- |
| **Invalid login credentials** | `401 Unauthorized` | `{ title: 'Unauthorized', detail: 'Invalid username or password' }` |
| **Worker attempts Owner endpoint** | `403 Forbidden` | `{ title: 'Forbidden', detail: 'Requires Owner privilege' }` |
| **Barcode not found in DB** | `404 Not Found` | `{ title: 'Not Found', detail: 'No local product with barcode X' }` |
| **Insufficient stock for sale** | `422 Unprocessable` | `{ title: 'Insufficient Stock', detail: 'Required 24 base units, only 10 available' }` |
| **Barcode conflict on product create** | `409 Conflict` | `{ title: 'Conflict', detail: 'Unit barcode already registered' }` |

---

*— End of Backend Documentation —*
