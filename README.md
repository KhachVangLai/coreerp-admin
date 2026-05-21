# CoreERP Admin

React admin dashboard for the CoreERP API. This frontend will demonstrate the CoreERP order-to-cash workflow across master data, inventory, sales orders, reservations, warehouse fulfillment, invoices, payments, and audit logs.

## Backend dependency

Local backend base URL:

```text
http://localhost:3000/api/v1
```

Swagger docs:

```text
http://localhost:3000/api/docs
```

The backend must be running for login and session refresh because the frontend calls:

- `POST /api/v1/auth/login`
- `GET /api/v1/me`

## Local setup

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

Build verification:

```bash
npm run build
```

## Environment variables

Create a local `.env` from `.env.example` when needed:

```text
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

## Demo login

Use a seeded backend demo account:

```text
Tenant: minh-anh-retail
Email: sales@minhanh.vn
Password: 123456
```

## Design system

See [docs/design-system.md](docs/design-system.md) for the CoreERP Admin UI direction and workflow rules.
