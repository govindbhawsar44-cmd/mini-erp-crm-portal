# Mini ERP + CRM Operations Portal

> **Full Stack Developer Assignment Submission for Fundsroom Infotech Pvt. Ltd.**

A production-grade, full-stack **Mini ERP & CRM Operations Portal** built for wholesale and distribution companies to streamline customer relationship management, inventory cataloging, stock movement tracking, and sales challan dispatch with atomic stock deduction and PDF invoice generation.

---

## 🌟 Executive Summary & Key Highlights

* **Backend Stack:** Node.js, TypeScript, Express.js, Prisma ORM, Zod validation, JWT Authentication, PDFKit exporter.
* **Frontend Stack:** React (Vite), TypeScript, Lucide React Icons, Custom Glassmorphic CSS Design System, Responsive Layout.
* **Database:** SQLite (Default zero-config local runner) / PostgreSQL (Seamless Prisma provider toggle).
* **Security & Access Control:** Role-Based Access Control (RBAC) supporting **4 Roles** (`ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`).
* **Critical Business Logic Enforced:**
  1. **Atomic Stock Reduction:** When a Sales Challan is set to `CONFIRMED`, product stock is reduced atomically and an `OUT` movement log is recorded.
  2. **Insufficient Stock Prevention:** Prevents negative inventory. API rejects any order with `HTTP 400 Bad Request` listing exact out-of-stock SKUs.
  3. **Historical Snapshotting:** Sales Challan stores historical product snapshots (`productName`, `sku`, `unitPrice` at time of sale) ensuring catalog updates do not alter historic sales invoices.
  4. **PDF Invoice Exporter:** Native server-side PDF invoice generation download.

---

## 🔑 Test Login Credentials (All 4 Roles Pre-seeded)

Use these credentials or click the **1-Click Quick Login** buttons on the login page:

| Role | Email | Password | Allowed System Permissions |
| :--- | :--- | :--- | :--- |
| **👑 Admin** | `admin@erp.com` | `admin123` | Full access across CRM, Inventory, Stock Adjustments, and Challans |
| **💼 Sales** | `sales@erp.com` | `sales123` | Create/Edit Customers, Add Follow-up Notes, Create & Confirm Sales Challans |
| **📦 Warehouse** | `warehouse@erp.com` | `warehouse123` | Manage Products, Adjust Stock (IN/OUT), View Stock Logs |
| **🧾 Accounts** | `accounts@erp.com` | `accounts123` | View Customers & Products, Confirm/Cancel Challans, Export PDF Invoices |

---

## 🚀 Quick Start Local Setup Guide

### 1. Prerequisites
* Node.js v18+ or v20+
* npm or yarn

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Run database setup & seeding (creates SQLite database & seeds demo data)
npx prisma generate
npx prisma db push
npm run seed

# Start backend server (Runs on http://localhost:5000)
npm run dev
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server (Runs on http://localhost:3000)
npm run dev
```

Visit **`http://localhost:3000`** in your browser!

---

## 📂 Project Architecture

```
project21/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database models (User, Customer, Product, StockLog, Challan, Items)
│   │   └── seed.ts                # Pre-populated test accounts & sample data
│   ├── src/
│   │   ├── controllers/           # Auth, Customer, Product, Challan, Stock, PDF controllers
│   │   ├── middleware/            # Auth JWT, Role RBAC, Zod Validator, Error Handler
│   │   ├── routes/                # REST API endpoints
│   │   ├── utils/                 # Prisma client, PDF generator
│   │   └── index.ts               # Express entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/            # Sidebar, Navbar, StatCard, Badge, Modal
│   │   ├── context/               # AuthContext (Role check & JWT management)
│   │   ├── pages/                 # Dashboard, Customers, Products, Challans, Detail Views
│   │   ├── services/              # Axios API client
│   │   ├── styles/                # Glassmorphic CSS design tokens
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── postman_collection.json        # Ready-to-import Postman Collection
├── docker-compose.yml             # Docker container orchestration
├── Dockerfile                     # Backend Dockerfile
└── README.md
```

---

## 🛠️ API Endpoints Summary

### Auth & Roles
* `POST /api/auth/login` — Authenticates user and returns JWT token + role.
* `GET /api/auth/me` — Fetches current logged-in session user profile.

### Customer CRM Module
* `GET /api/customers` — List customers with search, status filter (`LEAD`/`ACTIVE`/`INACTIVE`), type filter, and pagination.
* `GET /api/customers/:id` — Fetch customer details, follow-up notes timeline, and challan history.
* `POST /api/customers` — Create customer profile (`ADMIN`, `SALES`).
* `PUT /api/customers/:id` — Edit customer details (`ADMIN`, `SALES`).
* `POST /api/customers/:id/notes` — Add CRM follow-up note (`ADMIN`, `SALES`).

### Product & Inventory Module
* `GET /api/products` — List products with SKU/Name search, category filter, low stock filter (`lowStock=true`), and pagination.
* `GET /api/products/:id` — Product detail and stock movement history log.
* `POST /api/products` — Create product (`ADMIN`, `WAREHOUSE`).
* `PUT /api/products/:id` — Edit product (`ADMIN`, `WAREHOUSE`).
* `POST /api/products/:id/stock` — Adjust stock (`IN`/`OUT`) with audit logging (`ADMIN`, `WAREHOUSE`).
* `GET /api/products/stock-logs/all` — History log of all stock movements.

### Sales Challan Module
* `GET /api/challans` — List challans with search & status filter (`DRAFT`/`CONFIRMED`/`CANCELLED`).
* `GET /api/challans/:id` — View challan details and snapshot pricing.
* `POST /api/challans` — Create Sales Challan as Draft or Confirmed (`ADMIN`, `SALES`).
* `PUT /api/challans/:id/status` — Update Challan status (`CONFIRMED` triggers stock deduction; `CANCELLED` restores stock).
* `GET /api/challans/:id/pdf` — Export & download PDF invoice.

---

## 🐳 Docker Deployment (Bonus Feature)

To run the entire backend containerized:
```bash
docker-compose up --build
```
The backend API will be available at `http://localhost:5000`.

---

## 📹 Screen Recording Demonstration Steps

When recording your screen for Round 1 evaluation:
1. **Login & RBAC Demo:** Log in using the 1-click **Admin** button, then demonstrate switching to **Sales** or **Warehouse** to highlight role permissions.
2. **Customer CRM Flow:** Navigate to **Customers CRM**, create a new customer lead, and log a follow-up note.
3. **Inventory & Low Stock Alert:** Navigate to **Products & Stock**, highlight low stock warnings, and perform a manual stock adjustment (`IN` / `OUT`).
4. **Sales Challan Creation & Stock Deduction:**
   * Create a new Sales Challan for 5 units of a product.
   * Confirm the Challan and demonstrate that product stock automatically decreased by 5 and created an `OUT` log entry.
   * Demonstrate insufficient stock validation by trying to order 99,999 units.
5. **PDF Invoice Export:** Click **Export PDF** on any confirmed Challan to show the downloaded PDF invoice.

---

## 📄 Submission Details
* **GitHub Repository:** Submitting link
* **Postman Collection:** `postman_collection.json` included in repository root
* **Submission Form:** Completed via Google Form link
