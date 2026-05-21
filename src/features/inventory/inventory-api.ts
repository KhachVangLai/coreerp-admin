import { apiClient } from '@/lib/api-client'
import type {
  AdjustStockPayload,
  AdjustStockResponse,
  ListStockItemsParams,
  ListStockMovementsParams,
  ReceiveStockPayload,
  ReceiveStockResponse,
  StockItemsResponse,
  StockMovementsResponse,
} from '@/types/inventory'

export async function listStockItems(params: ListStockItemsParams) {
  const response = await apiClient.get<StockItemsResponse>(
    '/inventory/stock-items',
    {
      params: compactParams(params),
    },
  )

  return response.data
}

export async function receiveStock(payload: ReceiveStockPayload) {
  const response = await apiClient.post<ReceiveStockResponse>(
    '/inventory/receipts',
    payload,
  )

  return response.data.data
}

export async function adjustStock(payload: AdjustStockPayload) {
  const response = await apiClient.post<AdjustStockResponse>(
    '/inventory/adjustments',
    payload,
  )

  return response.data.data
}

export async function listStockMovements(params: ListStockMovementsParams) {
  const response = await apiClient.get<StockMovementsResponse>(
    '/inventory/movements',
    {
      params: compactParams(params),
    },
  )

  return response.data
}

function compactParams<TParams extends Record<string, unknown>>(params: TParams) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== '',
    ),
  )
}
