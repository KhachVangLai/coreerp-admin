import type { ApiDataResponse, PaginatedResponse } from '@/types/api'

export const invoiceStatuses = [
  'DRAFT',
  'ISSUED',
  'PARTIALLY_PAID',
  'PAID',
  'CANCELLED',
] as const

export const paymentMethods = [
  'CASH',
  'BANK_TRANSFER',
  'MOMO',
  'OTHER',
] as const

export type InvoiceStatus = (typeof invoiceStatuses)[number]
export type PaymentMethod = (typeof paymentMethods)[number]

export type InvoiceLine = {
  id: string
  productId?: string
  skuSnapshot?: string | null
  productNameSnapshot?: string | null
  unitSnapshot?: string | null
  sku?: string | null
  productName?: string | null
  unit?: string | null
  quantity: number
  unitPrice: string
  lineTotal: string
}

export type Payment = {
  id: string
  invoiceId: string
  invoiceCode?: string | null
  invoice?: {
    id: string
    invoiceCode: string
    status?: InvoiceStatus
    totalAmount?: string
    paidAmount?: string
  } | null
  amount: string
  method: PaymentMethod
  referenceNo: string | null
  paidAt: string
  createdAt: string
}

export type Invoice = {
  id: string
  invoiceCode: string
  salesOrderId: string
  orderCode?: string | null
  salesOrder?: { orderCode?: string | null } | null
  customerId?: string | null
  customerCode?: string | null
  customerName?: string | null
  customer?: { code?: string | null; name?: string | null } | null
  status: InvoiceStatus
  subtotalAmount?: string | null
  subtotal?: string | null
  discountAmount: string
  taxAmount: string
  totalAmount: string
  paidAmount: string
  issuedAt: string | null
  createdAt: string
  lines?: InvoiceLine[]
  payments?: Payment[]
}

export type ListInvoicesParams = {
  page?: number
  limit?: number
  q?: string
  status?: InvoiceStatus
  customerId?: string
  salesOrderId?: string
}

export type GenerateInvoicePayload = Record<string, never>

export type IssueInvoicePayload = {
  note?: string | null
}

export type ListPaymentsParams = {
  page?: number
  limit?: number
  invoiceId?: string
  method?: PaymentMethod
  fromDate?: string
  toDate?: string
}

export type RecordPaymentPayload = {
  amount: string
  method: PaymentMethod
  referenceNo?: string | null
  paidAt?: string | null
}

export type InvoicesResponse = PaginatedResponse<Invoice>
export type InvoiceResponse = ApiDataResponse<Invoice>
export type PaymentsResponse = PaginatedResponse<Payment>
export type PaymentResponse = ApiDataResponse<Payment>
