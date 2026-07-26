# POS SYSTEM - Frontend Project Documentation
**React · Vite · Tailwind CSS · ZXing.js · TanStack Query · Zustand**  
*Version 1.1 | July 2026*

---

## 1. Project Overview
This document is the complete frontend specification and build guide for the POS (Point of Sale) System. The frontend is a web-based, mobile-responsive web application built in React that connects to an ASP.NET Core REST API backend. It provides an intuitive, role-tailored experience for **Shop Owners** and **Workers/Cashiers**, supporting automated barcode scanning, automated product catalog creation via barcode lookup, and dual-unit (bulk & single piece) sales and inventory management.

### 1.1 Goals
- **Role-Based Interface & Authentication**: Secure client-side routing and UI component rendering tailored to user role:
  - **Worker/Cashier Role**: Clean, fast POS interface focused strictly on camera barcode scanning, cart management, checkout processing, and alert notifications.
  - **Shop Owner Role**: Full access to POS scanning, product catalog management (with automated barcode importing), inventory restocking & threshold configuration, worker account management, and financial analytics.
- **Automated Barcode Onboarding**: Scan new product barcodes in the catalog page to automatically populate product name, brand, category, suggested price, and image from external barcode databases.
- **Dual-Unit (Bulk & Single) Selling Experience**: Seamlessly handle scanning and manual selection of items sold in bulk packaging (cartons, packs, crates) and single units. Display clear unit labels and prices in the POS cart.
- **Mobile-First POS Workflow**: Provide camera-assisted scanning using ZXing.js, instant cart total calculations, and haptic feedback on phones, tablets, and desktops.

### 1.2 Tech Stack

| Technology | Role | Version / Notes |
| :--- | :--- | :--- |
| **React** | UI framework | v18+ |
| **Vite** | Build tool & dev server | v5+ |
| **Tailwind CSS** | Utility-first styling | v3+ |
| **React Router v6** | Client-side routing & Protected Routes | v6 |
| **TanStack Query** | API data fetching & caching | v5 |
| **Zustand** | Global state (Cart Store & Auth Store) | v4 |
| **Axios** | HTTP client (with JWT request interceptor) | v1+ |
| **@zxing/library** | Camera barcode decoding | Latest |
| **Recharts** | Business analytics charts | v2+ |
| **React Hot Toast** | Toast notifications & alerts | v2 |
| **Lucide React** | Icon library | Latest |

---

## 2. Folder Structure

```text
pos-frontend/
├── public/
│   └── icons/           # PWA icons, favicon
├── src/
│   ├── api/             # Axios instances + API modules
│   │   ├── axiosClient.js       # Interceptors for JWT auth header
│   │   ├── authApi.js           # Login, profile, register worker
│   │   ├── productsApi.js       # Products CRUD & external lookup
│   │   ├── salesApi.js          # Complete sale, sales history
│   │   ├── inventoryApi.js       # Inventory & restock API
│   │   ├── alertsApi.js          # Low-stock alerts API
│   │   └── analyticsApi.js      # Owner analytics API
│   ├── components/      # Reusable shared UI components
│   │   ├── ProtectedRoute.jsx   # Role-based route guard component
│   │   ├── BarcodeScanner.jsx   # ZXing camera scanner overlay
│   │   ├── CartItem.jsx         # Cart row with unit selector (Bulk vs Single)
│   │   ├── UnitSelectorPill.jsx # Packaging unit toggle pill
│   │   ├── ProductAutoFillModal.jsx # Auto-fill modal for external barcode lookup
│   │   ├── RestockModal.jsx     # Owner restocking modal
│   │   ├── AlertBadge.jsx       # Navbar unread count badge
│   │   ├── StockBadge.jsx       # Stock status color badge
│   │   ├── Navbar.jsx           # Role-aware top/bottom navigation bar
│   │   └── Sidebar.jsx          # Role-aware desktop sidebar
│   ├── pages/           # Application views
│   │   ├── LoginPage.jsx        # Login screen for Owner & Workers
│   │   ├── ScanPage.jsx         # POS Camera scanner & cart quick-add
│   │   ├── CheckoutPage.jsx     # Full checkout & payment collection
│   │   ├── InventoryPage.jsx    # Stock management & restock controls
│   │   ├── AlertsPage.jsx       # Active low-stock notifications
│   │   ├── ProductsPage.jsx     # Product catalog & automated barcode import (Owner)
│   │   ├── AnalyticsPage.jsx    # BI dashboard & recommendations (Owner)
│   │   └── WorkersPage.jsx      # Worker account management (Owner)
│   ├── hooks/
│   │   ├── useAuth.js           # Auth state & permissions hook
│   │   ├── useBarcode.js        # Camera scanner logic hook
│   │   ├── useCart.js           # Zustand cart actions
│   │   └── useAlerts.js         # Alerts polling hook
│   ├── store/
│   │   ├── authStore.js         # JWT token, user profile, role state
│   │   └── cartStore.js         # POS cart state
│   ├── utils/
│   │   ├── formatCurrency.js
│   │   └── dateHelpers.js
│   ├── App.jsx                  # Router & layout provider
│   └── main.jsx                 # Entry point
```

---

## 3. Role-Based Navigation & Page Specifications

### Role Access Breakdown

| Route | Page Component | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `/login` | `LoginPage` | Public | Authentication login screen |
| `/` or `/scan` | `ScanPage` | Owner, Worker | Camera barcode scanner & rapid cart add |
| `/checkout` | `CheckoutPage` | Owner, Worker | Cart summary, unit pricing, payment & sale completion |
| `/alerts` | `AlertsPage` | Owner, Worker | View low-stock notification alerts |
| `/inventory` | `InventoryPage` | Owner (Full), Worker (Read-only) | View base stock; **Owner only** can restock & adjust thresholds |
| `/products` | `ProductsPage` | Owner Only | Catalog management & **Automated Barcode Import** |
| `/analytics` | `AnalyticsPage` | Owner Only | Revenue trends, best sellers & AI restock recommendations |
| `/workers` | `WorkersPage` | Owner Only | Create & manage worker login accounts |

---

### 3.1 Login Page (`/login`)
- **UI**: Clean card layout with toggle/input for Username and Password.
- **Logic**: Calls `POST /api/auth/login`. On success, stores JWT token and user details in `authStore` (persisted in `localStorage`). Automatically redirects `Owner` to `/scan` or `/analytics`, and `Worker` to `/scan`.

### 3.2 POS Scan Page (`/scan`) & Dual-Unit Support
- **UI**: Top camera viewfinder overlay with scan line animation.
- **Scan Logic**:
  - Scanning a barcode triggers `GET /api/products/barcode/{barcode}`.
  - If the barcode matches a **Bulk Package** (e.g. Carton of 24), it is added to the cart as `Carton of 24` at $40.00.
  - If the barcode matches a **Single Unit**, it is added as `Single Unit` at $2.00.
- **Unit Selector**: Item preview card displays packaging unit pills (e.g., `[ Single: $2.00 ]` | `[ Carton of 24: $40.00 ]`), allowing cashiers to easily switch package units manually if needed.

### 3.3 Checkout Page (`/checkout`)
- **UI**: Itemized cart list showing Product Name, Selected Packaging Unit (`Single` vs `Carton of 24`), Unit Price, Quantity Stepper, and Line Total.
- **Payment Controls**: Select Payment Method (`Cash`, `Card`, `Mobile Money`) + optional cashier notes.
- **Logic**: Sends `POST /api/sales` payload with `productUnitId` and `quantity`. The backend handles deducting base stock atomically (`quantity × conversionFactor`).

### 3.4 Products Page (`/products`) — Owner Only & Automated Barcode Import
- **Automated Barcode Import Workflow**:
  1. Owner clicks **"Scan to Auto-Add Product"** or enters a new barcode.
  2. Frontend queries `GET /api/products/lookup-external/{barcode}`.
  3. If external match is found, the modal automatically populates:
     - **Product Title** (e.g., "Heineken Lager Beer 500ml")
     - **Brand** (e.g., "Heineken")
     - **Category** (e.g., "Beverages")
     - **Image URL**
     - **Suggested Price**
  4. Owner sets selling price for Single Unit and configures Bulk Packaging Units (e.g. Unit Name: "Carton of 24", Barcode: scanned/entered, Conversion Factor: 24, Bulk Price: $38.00).
  5. Owner specifies initial stock count (in bulk cartons or base units) and saves.

### 3.5 Inventory Page (`/inventory`) — Base & Bulk Stock View
- **UI**: Table displaying Product Name, Base Stock Quantity (e.g., "240 Pieces"), Equivalent Bulk Packaging Count (e.g., "10 Cartons of 24"), Low Stock Threshold, and Stock Status badge (`OK`, `Low`, `Out`).
- **Owner Restock Action**: Restock Modal lets the owner choose unit type for restocking (e.g. "Restock 5 Cartons of 24" -> automatically calculates `+120` base units added to backend DB). Workers see a read-only stock lookup.

---

## 4. Dual-Unit Bulk & Single Unit UX Flow

```
                  ┌─────────────────────────────────────────┐
                  │ Cashier Scans Barcode on Product / Pack │
                  └────────────────────┬────────────────────┘
                                       │
                         GET /api/products/barcode/{code}
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
        Barcode Matches Bulk Unit             Barcode Matches Single Unit
        (e.g., Carton of 24 Barcode)          (e.g., Single Item Barcode)
                    │                                     │
                    ▼                                     ▼
      Cart Item: "Coca-Cola 500ml"           Cart Item: "Coca-Cola 500ml"
      Unit: Carton of 24                     Unit: Single Unit
      Price: $40.00 | Qty: 1                 Price: $2.00 | Qty: 1
      (Base stock deduction = 24)            (Base stock deduction = 1)
```

---

## 5. State Management

### 5.1 Auth Store (`authStore.js` - Zustand)
- **State**: `user` (`{ id, username, fullName, role }`), `token`, `isAuthenticated`.
- **Actions**: `login(token, user)`, `logout()`, `hasRole(role)`.
- **Persistence**: Token stored in `localStorage` and attached automatically to every Axios request via request interceptor.

### 5.2 Cart Store (`cartStore.js` - Zustand)
- **State**: `items` array: `[{ productId, productUnitId, productName, unitName, price, conversionFactor, quantity }]`.
- **Actions**: `addItem(product, productUnit)`, `updateQty(productUnitId, qty)`, `switchUnit(productUnitId, newUnit)`, `removeItem(productUnitId)`, `clearCart()`.
- **Calculated Properties**: `totalAmount`, `totalItemCount`.

---

## 6. API Client Integration & Interceptors

```javascript
// src/api/axiosClient.js
import axios from 'axios';
import useAuthStore from '../store/authStore';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

// Attach JWT token to all requests
client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error handling for 401 & 403
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
```

---

## 7. Development Phases

### PHASE 1 — Auth UI, Protected Routing & Role Navigation
- [x] `authStore` in Zustand + JWT storage
- [x] `LoginPage.jsx` & `ProtectedRoute.jsx` role guards
- [x] `Navbar` & `Sidebar` displaying owner vs worker options
- [x] Axios JWT authorization header interceptors

### PHASE 2 — POS Scan, Dual-Unit Cart & Checkout
- [x] `BarcodeScanner` component & `useBarcode` hook
- [x] ScanPage with barcode lookup (`GET /api/products/barcode/{barcode}`)
- [x] Dual-unit selector pills (Single vs Bulk packaging)
- [x] CheckoutPage with line items, total calculations, and `POST /api/sales`

### PHASE 3 — Automated Barcode Product Import & Owner Catalog Management
- [x] ProductsPage for Owner catalog management
- [x] Automated Barcode Import Modal wired to `GET /api/products/lookup-external/{barcode}`
- [x] Packaging unit configurator (Single unit price + Bulk unit barcodes & conversion factors)

### PHASE 4 — Owner Inventory Restocking & Analytics Dashboard
- [x] InventoryPage with base unit stock & bulk carton count breakdown
- [x] Bulk unit Restock Modal for Shop Owner
- [x] AlertsPage with 30s polling
- [x] Owner Analytics Dashboard (Recharts top sellers, slow movers, revenue trends)


---

## 8. Environment Variables

```env
# .env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ALERT_POLL_INTERVAL=30000
```

---

*— End of Frontend Documentation —*
