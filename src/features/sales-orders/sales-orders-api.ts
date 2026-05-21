import { apiClient } from '@/lib/api-client'
import type {
  CancelSalesOrderPayload,
  ConfirmSalesOrderPayload,
  CreateSalesOrderPayload,
  FulfillSalesOrderPayload,
  ListSalesOrdersParams,
  SalesOrderResponse,
  SalesOrdersResponse,
} from '@/types/sales-orders'

export async function listSalesOrders(params: ListSalesOrdersParams) {
  const response = await apiClient.get<SalesOrdersResponse>('/sales-orders', {
    params: compactParams(params),
  })

  return response.data
}

export async function getSalesOrder(id: string) {
  const response = await apiClient.get<SalesOrderResponse>(`/sales-orders/${id}`)

  return response.data.data
}

export async function createSalesOrder(payload: CreateSalesOrderPayload) {
  const response = await apiClient.post<SalesOrderResponse>(
    '/sales-orders',
    payload,
  )

  return response.data.data
}

export async function confirmSalesOrder(
  id: string,
  payload: ConfirmSalesOrderPayload = {},
) {
  const response = await apiClient.patch<SalesOrderResponse>(
    `/sales-orders/${id}/confirm`,
    payload,
  )

  return response.data.data
}

export async function cancelSalesOrder(
  id: string,
  payload: CancelSalesOrderPayload,
) {
  const response = await apiClient.patch<SalesOrderResponse>(
    `/sales-orders/${id}/cancel`,
    payload,
  )

  return response.data.data
}

export async function fulfillSalesOrder(
  id: string,
  payload: FulfillSalesOrderPayload,
) {
  const response = await apiClient.patch<SalesOrderResponse>(
    `/sales-orders/${id}/fulfill`,
    payload,
  )

  return response.data.data
}

function compactParams<TParams extends Record<string, unknown>>(params: TParams) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== '',
    ),
  )
}
