import { apiClient } from '@/lib/api-client'
import type {
  CreateCustomerPayload,
  CreateProductPayload,
  CreateWarehousePayload,
  CustomerResponse,
  CustomersResponse,
  ListCustomersParams,
  ListProductsParams,
  ListWarehousesParams,
  ProductResponse,
  ProductsResponse,
  UpdateCustomerPayload,
  UpdateProductPayload,
  UpdateWarehousePayload,
  WarehouseResponse,
  WarehousesResponse,
} from '@/types/master-data'

export async function listCustomers(params: ListCustomersParams) {
  const response = await apiClient.get<CustomersResponse>('/customers', {
    params: compactParams(params),
  })

  return response.data
}

export async function createCustomer(payload: CreateCustomerPayload) {
  const response = await apiClient.post<CustomerResponse>('/customers', payload)

  return response.data.data
}

export async function updateCustomer(
  id: string,
  payload: UpdateCustomerPayload,
) {
  const response = await apiClient.patch<CustomerResponse>(
    `/customers/${id}`,
    payload,
  )

  return response.data.data
}

export async function listProducts(params: ListProductsParams) {
  const response = await apiClient.get<ProductsResponse>('/products', {
    params: compactParams(params),
  })

  return response.data
}

export async function createProduct(payload: CreateProductPayload) {
  const response = await apiClient.post<ProductResponse>('/products', payload)

  return response.data.data
}

export async function updateProduct(id: string, payload: UpdateProductPayload) {
  const response = await apiClient.patch<ProductResponse>(
    `/products/${id}`,
    payload,
  )

  return response.data.data
}

export async function listWarehouses(params: ListWarehousesParams) {
  const response = await apiClient.get<WarehousesResponse>('/warehouses', {
    params: compactParams(params),
  })

  return response.data
}

export async function createWarehouse(payload: CreateWarehousePayload) {
  const response = await apiClient.post<WarehouseResponse>(
    '/warehouses',
    payload,
  )

  return response.data.data
}

export async function updateWarehouse(
  id: string,
  payload: UpdateWarehousePayload,
) {
  const response = await apiClient.patch<WarehouseResponse>(
    `/warehouses/${id}`,
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
