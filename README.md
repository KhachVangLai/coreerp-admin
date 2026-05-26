# CoreERP Admin

React admin dashboard for the CoreERP order-to-cash MVP. The interface is built
for internal ERP users who need dense tables, role-aware actions, and fast access
to operational records.

## Highlights

- Table-first admin UI for master data, inventory, sales orders, invoices,
  payments, audit logs, and operational dashboard views.
- Protected routes, role-based sidebar visibility, and role-aware write actions.
- REST API integration with the separate `coreerp-api` backend.
- Form validation with React Hook Form and Zod.
- TanStack Query data loading, caching, and mutation handling.
- GitHub Actions CI for lint and production build checks.

## Tech Stack

- React, TypeScript, Vite
- TailwindCSS, shadcn/ui, Lucide React
- React Router
- TanStack Query
- React Hook Form, Zod
- Axios

## Pages

| Route | Purpose |
| --- | --- |
| `/login` | Tenant login |
| `/app/dashboard` | Operational overview |
| `/app/users` | Tenant user management |
| `/app/customers` | Customer master data |
| `/app/products` | Product master data |
| `/app/warehouses` | Warehouse master data |
| `/app/inventory` | Stock receive and adjustment |
| `/app/sales-orders` | Sales order list |
| `/app/sales-orders/new` | Sales order creation |
| `/app/sales-orders/:id` | Sales order workflow actions |
| `/app/invoices` | Invoice list |
| `/app/invoices/:id` | Invoice issue and payment context |
| `/app/payments` | Payment records |
| `/app/audit-logs` | Tenant audit trail |

## Role Access

| Role | Main Access |
| --- | --- |
| `TENANT_ADMIN` | Full tenant administration |
| `SALES` | Customers and sales order workflow |
| `WAREHOUSE` | Inventory and fulfillment workflow |
| `FINANCE` | Invoices and payments |
| `VIEWER` | Read-only operational access |

Unauthorized modules are hidden from the sidebar, and direct route access still
falls back to a restricted state. Backend authorization remains the source of
truth for protected actions.

## Quick Start

Start the `coreerp-api` backend first. The frontend expects:

```text
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

Install dependencies:

```bash
npm install
```

Create a local environment file if needed:

```bash
copy .env.example .env
```

Start the dev server:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

On Windows PowerShell, `npm.cmd run dev`, `npm.cmd run lint`, and
`npm.cmd run build` are reliable alternatives if script execution policy blocks
the `npm.ps1` wrapper.

## Demo Accounts

All seeded demo accounts use password `123456`.

| Tenant | Email | Role |
| --- | --- | --- |
| `minh-anh-retail` | `admin@minhanh.vn` | `TENANT_ADMIN` |
| `minh-anh-retail` | `sales@minhanh.vn` | `SALES` |
| `minh-anh-retail` | `warehouse@minhanh.vn` | `WAREHOUSE` |
| `minh-anh-retail` | `finance@minhanh.vn` | `FINANCE` |
| `minh-anh-retail` | `viewer@minhanh.vn` | `VIEWER` |
| `hoang-long-fashion` | `admin@hoanglong.vn` | `TENANT_ADMIN` |
| `hoang-long-fashion` | `sales@hoanglong.vn` | `SALES` |
| `hoang-long-fashion` | `warehouse@hoanglong.vn` | `WAREHOUSE` |
| `hoang-long-fashion` | `finance@hoanglong.vn` | `FINANCE` |
| `hoang-long-fashion` | `viewer@hoanglong.vn` | `VIEWER` |

## Demo Flow

1. Log in as `admin@minhanh.vn` with tenant `minh-anh-retail`.
2. Review or create customer, product, and warehouse master data.
3. Receive stock into a warehouse.
4. Create and confirm a sales order.
5. Fulfill the order from inventory.
6. Generate and issue the invoice.
7. Record partial and full payments.
8. Review the audit log and dashboard.

Swagger remains the backend API reference during demos:
`http://localhost:3000/api/docs`.

## Verification

```bash
npm run lint
npm run build
```

No frontend automated test suite is currently included.

## Documentation

- [Design System](docs/design-system.md)

## Scope

This frontend uses existing CoreERP API endpoints only. It does not implement a
separate reporting module, online payment gateway, legal e-invoice workflow,
PDF export, microservices UI, or 3PL warehouse platform.

Current limitations:

- The backend must be running locally for authenticated pages.
- No production deployment is configured.
- No frontend automated tests are present.
- Dashboard metrics use existing list APIs, not dedicated reporting endpoints.
- Logout clears the local access token; no refresh-token/logout API flow is
  implemented in the MVP.
- Dark mode and repository screenshots are not included.
