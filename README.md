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

The backend does not need to be running for FE01. The frontend only configures the API client and environment variable for future integration.

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

## Design system

See [docs/design-system.md](docs/design-system.md) for the CoreERP Admin UI direction and workflow rules.
