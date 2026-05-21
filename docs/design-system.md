# CoreERP Admin Design System

## UI direction

CoreERP Admin is an enterprise back-office dashboard for order-to-cash operations. The interface should be light-mode first, table-first, quiet, dense enough for daily operations, and optimized for scanning statuses, exceptions, and next actions.

Use shadcn/ui primitives, TailwindCSS utilities, Lucide React icons, and restrained spacing. Avoid marketing-page composition.

## Layout structure

- App shell: fixed left sidebar, sticky topbar, and a scrollable main content area.
- Sidebar: primary module navigation and role-filtered entries.
- Topbar: workspace context, search entry point, notifications, and user/account actions.
- Main content: page header, filters/actions, table or form body, and supporting dialogs.

## Navigation structure

The eventual workflow navigation should follow the CoreERP order-to-cash flow:

1. Dashboard
2. Master Data
3. Inventory
4. Sales Orders
5. Stock Reservations
6. Warehouse Fulfillment
7. Invoices
8. Payments
9. Audit Logs

FE01 only provides placeholders. Do not implement business pages until their task explicitly asks for them.

## Status badge colors

- `DRAFT`: gray
- `CONFIRMED`: blue
- `FULFILLED`: purple
- `COMPLETED`: green
- `CANCELLED`: red
- `RESERVED`: blue
- `RELEASED`: amber
- `COMMITTED`: green
- `ISSUED`: blue
- `PARTIALLY_PAID`: amber
- `PAID`: green
- `ACTIVE`: green
- `INACTIVE`: gray

Badges should be compact, readable in tables, and consistent across list, detail, and dialog surfaces.

## Role-based navigation behavior

- Navigation items must be derived from the authenticated user's roles and permissions.
- Hide unauthorized modules from the sidebar instead of showing disabled dead ends.
- Preserve direct-route authorization checks when backend integration is added.
- Audit-log access should be limited to administrative or audit roles.

## Page template rules

- Use a concise page title, short description, and right-aligned primary action when applicable.
- Keep operational context near the top: counts, status filters, or pending actions.
- Avoid decorative panels that do not help users complete the workflow.
- Use stable widths and predictable alignment for repeated controls.

## Table/list page pattern

- Default to tables for operational records.
- Include search, status filter, date or owner filters when relevant.
- Show status badges, document numbers, customer/supplier references, ownership, timestamps, and next action.
- Prefer row-level action menus for secondary actions.
- Empty states should explain what is missing and offer the next valid action.

## Form/dialog pattern

- Use React Hook Form and Zod for forms.
- Keep dialogs focused on a single action or confirmation.
- Use full pages for long create/edit workflows.
- Validate required fields visibly and keep destructive actions explicit.
- Do not submit forms until API integration tasks introduce real endpoints.

## Order-to-Cash workflow UI rules

- Make the current document status visible on every detail page.
- Show irreversible or audit-relevant actions as explicit confirmations.
- Keep workflow actions aligned with backend state transitions.
- Do not invent frontend-only statuses that are not part of the backend contract.
- Reserve dashboard summaries and workflow metrics for tasks that define real API data.

## What not to do

- Do not build a landing page.
- Do not add decorative gradients, oversized hero sections, or stock imagery.
- Do not hardcode demo business records.
- Do not call backend APIs during FE01.
- Do not implement master data, inventory, order, warehouse, invoice, payment, or audit pages before their tasks.
- Do not persist plaintext credentials or tokens outside the agreed auth design.
