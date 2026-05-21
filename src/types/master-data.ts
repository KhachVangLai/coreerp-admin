import type { ApiDataResponse, PaginatedResponse } from '@/types/api'

export const customerTypes = ['B2B', 'B2C'] as const
export const entityStatuses = ['ACTIVE', 'INACTIVE'] as const

export type CustomerType = (typeof customerTypes)[number]
export type CustomerStatus = (typeof entityStatuses)[number]
export type ProductStatus = (typeof entityStatuses)[number]

export type ListParams = {
  page?: number
  limit?: number
  q?: string
  status?: CustomerStatus | ProductStatus
}

export type Customer = {
  id: string
  code: string
  name: string
  phone: string | null
  email: string | null
  taxCode: string | null
  type: CustomerType
  status: CustomerStatus
  createdAt: string
}

export type ListCustomersParams = ListParams & {
  type?: CustomerType
}

export type CreateCustomerPayload = {
  code: string
  name: string
  phone?: string | null
  email?: string | null
  taxCode?: string | null
  type: CustomerType
}

export type UpdateCustomerPayload = {
  name: string
  phone?: string | null
  email?: string | null
  taxCode?: string | null
  type: CustomerType
  status: CustomerStatus
}

export type Product = {
  id: string
  sku: string
  name: string
  unit: string
  basePrice: string
  status: ProductStatus
  createdAt: string
}

export type ListProductsParams = ListParams

export type CreateProductPayload = {
  sku: string
  name: string
  unit: string
  basePrice: string
}

export type UpdateProductPayload = {
  name: string
  unit: string
  basePrice: string
  status: ProductStatus
}

export type Warehouse = {
  id: string
  code: string
  name: string
  address: string | null
  isActive: boolean
  createdAt: string
}

export type ListWarehousesParams = {
  page?: number
  limit?: number
  q?: string
  isActive?: boolean
}

export type CreateWarehousePayload = {
  code: string
  name: string
  address?: string | null
}

export type UpdateWarehousePayload = {
  name: string
  address?: string | null
  isActive: boolean
}

export type CustomerResponse = ApiDataResponse<Customer>
export type CustomersResponse = PaginatedResponse<Customer>
export type ProductResponse = ApiDataResponse<Product>
export type ProductsResponse = PaginatedResponse<Product>
export type WarehouseResponse = ApiDataResponse<Warehouse>
export type WarehousesResponse = PaginatedResponse<Warehouse>
