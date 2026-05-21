import type { SalesOrder } from '@/types/sales-orders'

export function formatSalesOrderCustomer(order: SalesOrder) {
  return (
    order.customerName ??
    order.customer?.name ??
    order.customerCode ??
    order.customer?.code ??
    order.customerId
  )
}

export function formatSalesOrderWarehouse(order: SalesOrder) {
  return (
    order.warehouseName ??
    order.warehouse?.name ??
    order.warehouseCode ??
    order.warehouse?.code ??
    order.warehouseId
  )
}
