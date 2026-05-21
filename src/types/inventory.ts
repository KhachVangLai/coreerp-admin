import type { ApiDataResponse, PaginatedResponse } from '@/types/api'

export const stockMovementTypes = [
  'IN',
  'ADJUST',
  'RESERVE',
  'RELEASE',
  'OUT',
] as const

export type StockMovementType = (typeof stockMovementTypes)[number]

export type StockItem = {
  id: string
  warehouseId: string
  warehouseCode: string
  warehouseName: string
  productId: string
  sku: string
  productName: string
  unit: string
  quantityOnHand: number
  quantityReserved: number
  availableQuantity: number
}

export type StockMovement = {
  id: string
  warehouseId: string
  warehouseCode?: string
  warehouseName?: string
  productId: string
  sku?: string
  productName?: string
  type: StockMovementType
  quantity: number
  beforeOnHand: number
  afterOnHand: number
  beforeReserved: number
  afterReserved: number
  referenceType: string | null
  referenceId: string | null
  note: string | null
  createdAt: string
}

export type InventoryListParams = {
  page?: number
  limit?: number
  warehouseId?: string
  productId?: string
}

export type ListStockItemsParams = InventoryListParams

export type ListStockMovementsParams = InventoryListParams & {
  type?: StockMovementType
}

export type ReceiveStockPayload = {
  warehouseId: string
  productId: string
  quantity: number
  note?: string | null
}

export type AdjustStockPayload = {
  warehouseId: string
  productId: string
  newQuantityOnHand: number
  reason: string
}

export type StockItemsResponse = PaginatedResponse<StockItem>
export type StockMovementsResponse = PaginatedResponse<StockMovement>
export type ReceiveStockResponse = ApiDataResponse<StockMovement>
export type AdjustStockResponse = ApiDataResponse<StockMovement>
