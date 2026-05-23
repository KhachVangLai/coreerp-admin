# CoreERP Admin

CoreERP Admin is a React admin dashboard for demonstrating the CoreERP
order-to-cash workflow: master data, inventory, sales orders, warehouse
fulfillment, invoices, payments, audit logs, and a lightweight operational
dashboard.

The app is intentionally table-first and back-office oriented for internal ERP
admin users. It uses existing CoreERP API endpoints only; it does not implement
a separate reporting module, e-commerce checkout, legal e-invoice workflow,
payment gateway platform, microservices UI, or 3PL warehouse platform.

## Backend Dependency

This frontend depends on the separate `coreerp-api` backend repository.

- Local API base URL: `http://localhost:3000/api/v1`
- Swagger API reference: `http://localhost:3000/api/docs`
- Frontend URL: `http://localhost:5173`

The backend must be running locally for login, session refresh, and all business
pages.

## Tech Stack

- React
- Vite
- TypeScript
- TailwindCSS
- shadcn/ui
- React Router
- TanStack Query
- React Hook Form
- Zod
- Axios

## Implemented Pages

- `/login`
- `/app/dashboard`
- `/app/users`
- `/app/customers`
- `/app/products`
- `/app/warehouses`
- `/app/inventory`
- `/app/sales-orders`
- `/app/sales-orders/new`
- `/app/sales-orders/:id`
- `/app/invoices`
- `/app/invoices/:id`
- `/app/payments`
- `/app/audit-logs`

## Role-Based Access Summary

- `TENANT_ADMIN`: full tenant administration, including users, master data,
  inventory actions, sales order actions, invoices, payments, and audit logs.
- `SALES`: customer maintenance and sales order creation/confirmation/cancel.
  Read access to operational pages where allowed by the backend.
- `WAREHOUSE`: inventory receive/adjust actions and sales order fulfillment.
  Read access to stock and sales order context.
- `FINANCE`: invoice and payment workflows, plus read access to sales order
  context.
- `VIEWER`: read-only access to allowed operational pages.

Sidebar visibility follows these role rules:

- Users: `TENANT_ADMIN` only
- Audit Logs: `TENANT_ADMIN` only
- Invoices and Payments: `TENANT_ADMIN`, `FINANCE`, `VIEWER`
- Sales Orders: all authenticated roles
- Inventory: all authenticated roles

Write actions are hidden in the UI by role and still enforced by the backend.

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local environment file if needed:

```bash
copy .env.example .env
```

Start the backend from the `coreerp-api` repository first, then start the
frontend:

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

## Environment Variables

```text
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

## Demo Accounts

Tenant: `minh-anh-retail`

| Email | Password | Role |
| --- | --- | --- |
| `admin@minhanh.vn` | `123456` | `TENANT_ADMIN` |
| `sales@minhanh.vn` | `123456` | `SALES` |
| `warehouse@minhanh.vn` | `123456` | `WAREHOUSE` |
| `finance@minhanh.vn` | `123456` | `FINANCE` |
| `viewer@minhanh.vn` | `123456` | `VIEWER` |

Tenant: `hoang-long-fashion`

| Email | Password | Role |
| --- | --- | --- |
| `admin@hoanglong.vn` | `123456` | `TENANT_ADMIN` |
| `sales@hoanglong.vn` | `123456` | `SALES` |
| `warehouse@hoanglong.vn` | `123456` | `WAREHOUSE` |
| `finance@hoanglong.vn` | `123456` | `FINANCE` |
| `viewer@hoanglong.vn` | `123456` | `VIEWER` |

## Demo Walkthrough

1. Start the `coreerp-api` backend.
2. Start this frontend with `npm run dev`.
3. Log in as `admin@minhanh.vn` using tenant `minh-anh-retail`.
4. Create or review a customer, product, and warehouse.
5. Receive stock for the product into the warehouse.
6. Create a sales order.
7. Confirm the sales order to reserve stock.
8. Fulfill the sales order to issue stock out.
9. Generate an invoice from the fulfilled sales order.
10. Issue the invoice.
11. Record a partial payment.
12. Record a full payment.
13. Check Audit Logs for the tenant activity trail.
14. View Dashboard for a lightweight operational overview.

Swagger remains the authoritative API reference during the walkthrough:
`http://localhost:3000/api/docs`.

Payments in this MVP are manual finance-user payment records. The UI supports
recording partial and full payments through the backend, but does not implement
online payment gateways, payment links, provider webhooks, refunds, or payment
reconciliation.

Invoices in this MVP are invoice data records with issue workflow, line
snapshots, and payment tracking. The UI does not implement printable invoice
views, PDF export, legal e-invoice integration, digital signatures, or invoice
email sending.

## Testing And Build Commands

```bash
npm run lint
npm run build
```

No frontend automated test suite is currently present.

## Design System

See [docs/design-system.md](docs/design-system.md) for UI direction, page
patterns, status badge rules, and workflow UI rules.

## Known Limitations

- No production deployment is configured yet.
- No frontend automated tests are present yet.
- No advanced reporting charts are implemented.
- No Redis, Kafka, Redpanda, or Outbox workflows are exposed by the MVP.
- No online payment gateway, payment links, provider webhooks, refunds, or
  reconciliation are implemented.
- No printable invoice view, invoice PDF export, legal e-invoice integration,
  digital signature, or invoice email sending is implemented.
- No dark mode is implemented.
- No refresh token or logout API is implemented; logout clears the local access
  token in the frontend.
- The backend must be running locally for authenticated pages.
- Dashboard counts and snapshots use existing list APIs, not dedicated report
  endpoints.
- The Vite production build may warn about large chunks; route-level lazy
  loading can be added later if bundle size becomes a priority.
- Screenshots can be added later; no repository screenshots are included now.

## Technical Debt

- Vite chunk-size warning / route lazy loading.
- Frontend automated tests are not implemented yet.
- CI/CD is not implemented yet.
- Deployment is not implemented yet.

## Future Improvements

- Add printable invoice view / PDF export if needed for MVP+ demos.
- Add GitHub Actions CI for lint, build, and test.
- Add frontend E2E tests with Playwright for auth, role gating, and workflow
  actions.
- Add route-level lazy loading and bundle analysis.
- Add reports/read models for revenue, unpaid invoices, and low stock if
  analytics become a product requirement.
- Add platform tenant onboarding.
- Add deployment guide and production environment examples.
- Optionally add a payment gateway adapter and webhook simulation only if a
  customer-facing payment flow is added.
- Optionally add an e-invoice provider abstraction only if legal invoice
  integration is needed.
- Optionally add Outbox/Kafka/Redpanda only if async integration or a service
  split becomes necessary.
- Optionally add Redis/Valkey only for non-critical caching or rate limiting
  after measured need.
