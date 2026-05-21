import type { ApiDataResponse, PaginatedResponse } from '@/types/api'

export const salesOrderStatuses = [
  'DRAFT',
  'CONFIRMED',
  'FULFILLED',
  'COMPLETED',
  'CANCELLED',
] as const

export type SalesOrderStatus = (typeof salesOrderStatuses)[number]

export type SalesOrderLine = {
  id: string
  productId: string
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

export type SalesOrderReservation = {
  id: string
  productId: string
  warehouseId: string
  sku?: string | null
  productName?: string | null
  warehouseCode?: string | null
  warehouseName?: string | null
  quantity: number
  status: string
}

export type SalesOrder = {
  id: string
  orderCode: string
  customerId: string
  customerCode?: string | null
  customerName?: string | null
  customer?: {
    code?: string | null
    name?: string | null
    email?: string | null
    phone?: string | null
  } | null
  warehouseId: string
  warehouseCode?: string | null
  warehouseName?: string | null
  warehouse?: {
    code?: string | null
    name?: string | null
  } | null
  status: SalesOrderStatus
  subtotalAmount?: string | null
  subtotal?: string | null
  discountAmount: string
  taxAmount: string
  totalAmount: string
  note: string | null
  createdAt: string
  confirmedAt?: string | null
  fulfilledAt?: string | null
  completedAt?: string | null
  cancelledAt?: string | null
  lines?: SalesOrderLine[]
  reservations?: SalesOrderReservation[]
  invoice?: unknown
}

export type ListSalesOrdersParams = {
  page?: number
  limit?: number
  q?: string
  status?: SalesOrderStatus
  customerId?: string
  warehouseId?: string
}

export type CreateSalesOrderLinePayload = {
  productId: string
  quantity: number
  unitPrice: string
}

export type CreateSalesOrderPayload = {
  customerId: string
  warehouseId: string
  discountAmount: string
  taxAmount: string
  note?: string | null
  lines: CreateSalesOrderLinePayload[]
}

export type ConfirmSalesOrderPayload = Record<string, never>

export type CancelSalesOrderPayload = {
  reason: string
}

export type FulfillSalesOrderPayload = {
  note?: string | null
}

export type SalesOrdersResponse = PaginatedResponse<SalesOrder>
export type SalesOrderResponse = ApiDataResponse<SalesOrder>
