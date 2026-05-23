import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PackagePlus, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { MovementTypeBadge } from '@/components/inventory/inventory-badges'
import {
  FeedbackMessage,
  FieldError,
  FormField,
  PaginationControls,
  ResourceErrorState,
  TableCard,
  TablePagination,
  TableScroll,
  TableState,
  TruncatedCellText,
  tableBodyClassName,
  tableCellClassName,
  tableClassName,
  tableHeaderCellClassName,
  tableHeaderClassName,
  tableKeyCellClassName,
  tableKeyHeaderCellClassName,
} from '@/components/master-data/master-data-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/use-auth'
import {
  adjustStock,
  listStockItems,
  listStockMovements,
  receiveStock,
} from '@/features/inventory/inventory-api'
import {
  listProducts,
  listWarehouses,
} from '@/features/master-data/master-data-api'
import { normalizeApiError, type BackendError } from '@/lib/api-error'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type {
  AdjustStockPayload,
  ListStockItemsParams,
  ListStockMovementsParams,
  ReceiveStockPayload,
  StockItem,
  StockMovement,
  StockMovementType,
} from '@/types/inventory'
import { stockMovementTypes } from '@/types/inventory'
import type { Product, Warehouse } from '@/types/master-data'

const defaultLimit = 20
const allProductsValue = 'ALL_PRODUCTS'
const allWarehousesValue = 'ALL_WAREHOUSES'
const allMovementTypesValue = 'ALL_MOVEMENT_TYPES'

const receiveStockSchema = z.object({
  warehouseId: z.string().min(1, 'Warehouse is required.'),
  productId: z.string().min(1, 'Product is required.'),
  quantity: z
    .string()
    .min(1, 'Quantity is required.')
    .refine((value) => Number(value) > 0, {
      message: 'Quantity must be greater than 0.',
    }),
  note: z.string().trim(),
})

const adjustStockSchema = z.object({
  warehouseId: z.string().min(1, 'Warehouse is required.'),
  productId: z.string().min(1, 'Product is required.'),
  newQuantityOnHand: z
    .string()
    .min(1, 'New quantity is required.')
    .refine((value) => Number(value) >= 0, {
      message: 'New quantity must be greater than or equal to 0.',
    }),
  reason: z.string().min(1, 'Reason is required.'),
})

type ReceiveStockFormValues = z.infer<typeof receiveStockSchema>
type AdjustStockFormValues = z.infer<typeof adjustStockSchema>

type InventoryTab = 'stock-items' | 'movements' | 'receive' | 'adjust'

type StockFilters = {
  page: number
  limit: number
  warehouseId: string
  productId: string
}

type MovementFilters = StockFilters & {
  type: StockMovementType | ''
}

export function InventoryRoute() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const canViewMovements = ['TENANT_ADMIN', 'WAREHOUSE', 'FINANCE', 'VIEWER'].includes(
    auth.user?.role ?? '',
  )
  const canWrite = ['TENANT_ADMIN', 'WAREHOUSE'].includes(auth.user?.role ?? '')
  const [activeTab, setActiveTab] = useState<InventoryTab>('stock-items')
  const [stockFilters, setStockFilters] = useState<StockFilters>({
    page: 1,
    limit: defaultLimit,
    warehouseId: '',
    productId: '',
  })
  const [movementFilters, setMovementFilters] = useState<MovementFilters>({
    page: 1,
    limit: defaultLimit,
    warehouseId: '',
    productId: '',
    type: '',
  })
  const [feedback, setFeedback] = useState<string | null>(null)

  const productsQuery = useQuery({
    queryKey: ['inventory-products'],
    queryFn: () => listProducts({ page: 1, limit: 100, status: 'ACTIVE' }),
  })
  const warehousesQuery = useQuery({
    queryKey: ['inventory-warehouses'],
    queryFn: () => listWarehouses({ page: 1, limit: 100, isActive: true }),
  })
  const stockItemsQuery = useQuery({
    queryKey: ['stock-items', stockFilters],
    queryFn: () => listStockItems(toStockListParams(stockFilters)),
  })
  const movementsQuery = useQuery({
    queryKey: ['stock-movements', movementFilters],
    queryFn: () => listStockMovements(toMovementListParams(movementFilters)),
    enabled: canViewMovements,
  })

  const receiveMutation = useMutation({
    mutationFn: receiveStock,
    onSuccess: async () => {
      setFeedback('Stock received successfully.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['stock-items'] }),
        queryClient.invalidateQueries({ queryKey: ['stock-movements'] }),
      ])
    },
  })
  const adjustMutation = useMutation({
    mutationFn: adjustStock,
    onSuccess: async () => {
      setFeedback('Stock adjusted successfully.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['stock-items'] }),
        queryClient.invalidateQueries({ queryKey: ['stock-movements'] }),
      ])
    },
  })

  const products = productsQuery.data?.data ?? []
  const warehouses = warehousesQuery.data?.data ?? []
  const tabs = getVisibleTabs(canViewMovements, canWrite)

  function selectTab(tab: InventoryTab) {
    setFeedback(null)
    receiveMutation.reset()
    adjustMutation.reset()
    setActiveTab(tab)
  }

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
        <p className="text-sm text-slate-500">
          Track stock levels, receipts, adjustments, and stock movement ledger.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={cn(
              'border-b-2 border-transparent px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-950',
              activeTab === tab.value && 'border-blue-600 text-blue-700',
            )}
            onClick={() => selectTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <FeedbackMessage message={feedback} />

      {activeTab === 'stock-items' ? (
        <StockItemsTab
          filters={stockFilters}
          products={products}
          productsError={
            productsQuery.error ? normalizeApiError(productsQuery.error) : undefined
          }
          stockItems={stockItemsQuery.data?.data ?? []}
          stockItemsError={
            stockItemsQuery.error
              ? normalizeApiError(stockItemsQuery.error)
              : undefined
          }
          isFetching={stockItemsQuery.isFetching}
          isLoading={stockItemsQuery.isLoading}
          meta={stockItemsQuery.data?.meta}
          warehouses={warehouses}
          warehousesError={
            warehousesQuery.error
              ? normalizeApiError(warehousesQuery.error)
              : undefined
          }
          onFiltersChange={(nextFilters) =>
            setStockFilters((current) => ({
              ...current,
              ...nextFilters,
              page: nextFilters.page ?? 1,
            }))
          }
        />
      ) : null}

      {activeTab === 'movements' && canViewMovements ? (
        <MovementsTab
          filters={movementFilters}
          isFetching={movementsQuery.isFetching}
          isLoading={movementsQuery.isLoading}
          meta={movementsQuery.data?.meta}
          movements={movementsQuery.data?.data ?? []}
          movementsError={
            movementsQuery.error
              ? normalizeApiError(movementsQuery.error)
              : undefined
          }
          products={products}
          productsError={
            productsQuery.error ? normalizeApiError(productsQuery.error) : undefined
          }
          warehouses={warehouses}
          warehousesError={
            warehousesQuery.error
              ? normalizeApiError(warehousesQuery.error)
              : undefined
          }
          onFiltersChange={(nextFilters) =>
            setMovementFilters((current) => ({
              ...current,
              ...nextFilters,
              page: nextFilters.page ?? 1,
            }))
          }
        />
      ) : null}

      {activeTab === 'receive' && canWrite ? (
        <ReceiveStockTab
          error={
            receiveMutation.error
              ? normalizeApiError(receiveMutation.error)
              : undefined
          }
          isSubmitting={receiveMutation.isPending}
          products={products}
          productsError={
            productsQuery.error ? normalizeApiError(productsQuery.error) : undefined
          }
          warehouses={warehouses}
          warehousesError={
            warehousesQuery.error
              ? normalizeApiError(warehousesQuery.error)
              : undefined
          }
          onSubmit={async (payload) => {
            await receiveMutation.mutateAsync(payload)
          }}
        />
      ) : null}

      {activeTab === 'adjust' && canWrite ? (
        <AdjustStockTab
          error={
            adjustMutation.error ? normalizeApiError(adjustMutation.error) : undefined
          }
          isSubmitting={adjustMutation.isPending}
          products={products}
          productsError={
            productsQuery.error ? normalizeApiError(productsQuery.error) : undefined
          }
          warehouses={warehouses}
          warehousesError={
            warehousesQuery.error
              ? normalizeApiError(warehousesQuery.error)
              : undefined
          }
          onSubmit={async (payload) => {
            await adjustMutation.mutateAsync(payload)
          }}
        />
      ) : null}
    </section>
  )
}

function getVisibleTabs(canViewMovements: boolean, canWrite: boolean) {
  const tabs: Array<{ label: string; value: InventoryTab }> = [
    { label: 'Stock Items', value: 'stock-items' },
  ]

  if (canViewMovements) {
    tabs.push({ label: 'Movements', value: 'movements' })
  }

  if (canWrite) {
    tabs.push(
      { label: 'Receive Stock', value: 'receive' },
      { label: 'Adjust Stock', value: 'adjust' },
    )
  }

  return tabs
}

function toStockListParams(filters: StockFilters): ListStockItemsParams {
  return {
    page: filters.page,
    limit: filters.limit,
    warehouseId: filters.warehouseId || undefined,
    productId: filters.productId || undefined,
  }
}

function toMovementListParams(
  filters: MovementFilters,
): ListStockMovementsParams {
  return {
    page: filters.page,
    limit: filters.limit,
    warehouseId: filters.warehouseId || undefined,
    productId: filters.productId || undefined,
    type: filters.type || undefined,
  }
}

function StockItemsTab({
  filters,
  isFetching,
  isLoading,
  meta,
  onFiltersChange,
  products,
  productsError,
  stockItems,
  stockItemsError,
  warehouses,
  warehousesError,
}: {
  filters: StockFilters
  isFetching: boolean
  isLoading: boolean
  meta?: { page: number; limit: number; total: number; totalPages: number }
  onFiltersChange: (filters: Partial<StockFilters>) => void
  products: Product[]
  productsError?: BackendError
  stockItems: StockItem[]
  stockItemsError?: BackendError
  warehouses: Warehouse[]
  warehousesError?: BackendError
}) {
  return (
    <div className="space-y-4">
      <InventoryFilters
        filters={filters}
        products={products}
        productsError={productsError}
        warehouses={warehouses}
        warehousesError={warehousesError}
        onFiltersChange={onFiltersChange}
      />

      <TableCard>
        {isLoading ? (
          <TableState>Loading stock items...</TableState>
        ) : stockItemsError ? (
          <ResourceErrorState error={stockItemsError} />
        ) : stockItems.length === 0 ? (
          <TableState>No stock items match the current filters.</TableState>
        ) : (
          <StockItemsTable stockItems={stockItems} />
        )}
        <TablePagination>
          <PaginationControls
            isFetching={isFetching}
            meta={meta}
            page={filters.page}
            totalLabel="stock items"
            onPageChange={(page) => onFiltersChange({ page })}
          />
        </TablePagination>
      </TableCard>
    </div>
  )
}

function MovementsTab({
  filters,
  isFetching,
  isLoading,
  meta,
  movements,
  movementsError,
  onFiltersChange,
  products,
  productsError,
  warehouses,
  warehousesError,
}: {
  filters: MovementFilters
  isFetching: boolean
  isLoading: boolean
  meta?: { page: number; limit: number; total: number; totalPages: number }
  movements: StockMovement[]
  movementsError?: BackendError
  onFiltersChange: (filters: Partial<MovementFilters>) => void
  products: Product[]
  productsError?: BackendError
  warehouses: Warehouse[]
  warehousesError?: BackendError
}) {
  return (
    <div className="space-y-4">
      <InventoryFilters
        filters={filters}
        products={products}
        productsError={productsError}
        warehouses={warehouses}
        warehousesError={warehousesError}
        onFiltersChange={onFiltersChange}
      >
        <select
          className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
          value={filters.type || allMovementTypesValue}
          onChange={(event) =>
            onFiltersChange({
              type:
                event.target.value === allMovementTypesValue
                  ? ''
                  : (event.target.value as StockMovementType),
            })
          }
          aria-label="Filter by movement type"
        >
          <option value={allMovementTypesValue}>All movement types</option>
          {stockMovementTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </InventoryFilters>

      <TableCard>
        {isLoading ? (
          <TableState>Loading movements...</TableState>
        ) : movementsError ? (
          <ResourceErrorState error={movementsError} />
        ) : movements.length === 0 ? (
          <TableState>No stock movements match the current filters.</TableState>
        ) : (
          <MovementsTable movements={movements} />
        )}
        <TablePagination>
          <PaginationControls
            isFetching={isFetching}
            meta={meta}
            page={filters.page}
            totalLabel="movements"
            onPageChange={(page) => onFiltersChange({ page })}
          />
        </TablePagination>
      </TableCard>
    </div>
  )
}

function InventoryFilters({
  children,
  filters,
  onFiltersChange,
  products,
  productsError,
  warehouses,
  warehousesError,
}: {
  children?: React.ReactNode
  filters: StockFilters
  onFiltersChange: (filters: Partial<StockFilters>) => void
  products: Product[]
  productsError?: BackendError
  warehouses: Warehouse[]
  warehousesError?: BackendError
}) {
  return (
    <div className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
      {productsError ? <ResourceErrorState error={productsError} /> : null}
      {warehousesError ? <ResourceErrorState error={warehousesError} /> : null}
      <div className="grid gap-3 lg:grid-cols-[minmax(200px,1fr)_minmax(200px,1fr)_auto]">
        <select
          className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
          value={filters.warehouseId || allWarehousesValue}
          onChange={(event) =>
            onFiltersChange({
              warehouseId:
                event.target.value === allWarehousesValue
                  ? ''
                  : event.target.value,
            })
          }
          aria-label="Filter by warehouse"
        >
          <option value={allWarehousesValue}>All warehouses</option>
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {formatWarehouseLabel(warehouse)}
            </option>
          ))}
        </select>
        <select
          className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
          value={filters.productId || allProductsValue}
          onChange={(event) =>
            onFiltersChange({
              productId:
                event.target.value === allProductsValue ? '' : event.target.value,
            })
          }
          aria-label="Filter by product"
        >
          <option value={allProductsValue}>All products</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {formatProductLabel(product)}
            </option>
          ))}
        </select>
        {children}
      </div>
    </div>
  )
}

function StockItemsTable({ stockItems }: { stockItems: StockItem[] }) {
  return (
    <TableScroll>
      <table className={`${tableClassName} min-w-[980px]`}>
        <thead className={tableHeaderClassName}>
          <tr>
            <th className={tableKeyHeaderCellClassName}>Warehouse</th>
            <th className={tableHeaderCellClassName}>SKU</th>
            <th className={tableHeaderCellClassName}>Product</th>
            <th className={tableHeaderCellClassName}>Unit</th>
            <th className={`${tableHeaderCellClassName} text-right`}>On Hand</th>
            <th className={`${tableHeaderCellClassName} text-right`}>Reserved</th>
            <th className={`${tableHeaderCellClassName} text-right`}>Available</th>
          </tr>
        </thead>
        <tbody className={tableBodyClassName}>
          {stockItems.map((item) => (
            <tr key={item.id} className="group hover:bg-slate-50">
              <td className={`${tableKeyCellClassName} text-slate-700`}>
                <TruncatedCellText
                  maxWidth="max-w-[260px]"
                  title={`${item.warehouseCode} ${item.warehouseName}`}
                >
                  <span className="font-medium text-slate-900">
                    {item.warehouseCode}
                  </span>{' '}
                  {item.warehouseName}
                </TruncatedCellText>
              </td>
              <td className={`${tableCellClassName} font-medium text-slate-900`}>
                <TruncatedCellText maxWidth="max-w-[160px]" title={item.sku}>
                  {item.sku}
                </TruncatedCellText>
              </td>
              <td className={`${tableCellClassName} text-slate-700`}>
                <TruncatedCellText maxWidth="max-w-[280px]" title={item.productName}>
                  {item.productName}
                </TruncatedCellText>
              </td>
              <td className={`${tableCellClassName} whitespace-nowrap text-slate-600`}>
                {item.unit}
              </td>
              <td className={`${tableCellClassName} whitespace-nowrap text-right tabular-nums`}>
                {item.quantityOnHand}
              </td>
              <td
                className={cn(
                  `${tableCellClassName} whitespace-nowrap text-right tabular-nums`,
                  item.quantityReserved > 0
                    ? 'font-semibold text-blue-700'
                    : 'text-slate-600',
                )}
              >
                {item.quantityReserved}
              </td>
              <td
                className={cn(
                  `${tableCellClassName} whitespace-nowrap text-right tabular-nums`,
                  item.availableQuantity === 0
                    ? 'font-semibold text-red-700'
                    : 'font-semibold text-green-700',
                )}
              >
                {item.availableQuantity}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  )
}

function MovementsTable({ movements }: { movements: StockMovement[] }) {
  return (
    <TableScroll>
      <table className={`${tableClassName} min-w-[1500px]`}>
        <thead className={tableHeaderClassName}>
          <tr>
            <th className={tableKeyHeaderCellClassName}>Created At</th>
            <th className={tableHeaderCellClassName}>Type</th>
            <th className={tableHeaderCellClassName}>Warehouse</th>
            <th className={tableHeaderCellClassName}>Product/SKU</th>
            <th className={`${tableHeaderCellClassName} text-right`}>Quantity</th>
            <th className={`${tableHeaderCellClassName} text-right`}>Before On Hand</th>
            <th className={`${tableHeaderCellClassName} text-right`}>After On Hand</th>
            <th className={`${tableHeaderCellClassName} text-right`}>Before Reserved</th>
            <th className={`${tableHeaderCellClassName} text-right`}>After Reserved</th>
            <th className={tableHeaderCellClassName}>Reference</th>
            <th className={tableHeaderCellClassName}>Note</th>
          </tr>
        </thead>
        <tbody className={tableBodyClassName}>
          {movements.map((movement) => (
            <tr key={movement.id} className="group hover:bg-slate-50">
              <td className={`${tableKeyCellClassName} whitespace-nowrap text-slate-600`}>
                {formatDate(movement.createdAt)}
              </td>
              <td className={`${tableCellClassName} whitespace-nowrap`}>
                <MovementTypeBadge type={movement.type} />
              </td>
              <td className={`${tableCellClassName} text-slate-700`}>
                <TruncatedCellText
                  maxWidth="max-w-[260px]"
                  title={
                    movement.warehouseCode
                      ? `${movement.warehouseCode} ${movement.warehouseName ?? ''}`
                      : movement.warehouseId
                  }
                >
                  {movement.warehouseCode
                    ? `${movement.warehouseCode} ${movement.warehouseName ?? ''}`
                    : movement.warehouseId}
                </TruncatedCellText>
              </td>
              <td className={`${tableCellClassName} text-slate-700`}>
                <TruncatedCellText
                  maxWidth="max-w-[300px]"
                  title={
                    movement.sku
                      ? `${movement.sku} - ${movement.productName ?? ''}`
                      : movement.productId
                  }
                >
                  {movement.sku
                    ? `${movement.sku} - ${movement.productName ?? ''}`
                    : movement.productId}
                </TruncatedCellText>
              </td>
              <td className={`${tableCellClassName} whitespace-nowrap text-right tabular-nums`}>
                {movement.quantity}
              </td>
              <td className={`${tableCellClassName} whitespace-nowrap text-right tabular-nums`}>
                {movement.beforeOnHand}
              </td>
              <td className={`${tableCellClassName} whitespace-nowrap text-right tabular-nums`}>
                {movement.afterOnHand}
              </td>
              <td className={`${tableCellClassName} whitespace-nowrap text-right tabular-nums`}>
                {movement.beforeReserved}
              </td>
              <td className={`${tableCellClassName} whitespace-nowrap text-right tabular-nums`}>
                {movement.afterReserved}
              </td>
              <td className={`${tableCellClassName} text-slate-600`}>
                <TruncatedCellText
                  maxWidth="max-w-[220px]"
                  title={formatReference(movement)}
                >
                  {formatReference(movement)}
                </TruncatedCellText>
              </td>
              <td className={`${tableCellClassName} text-slate-600`}>
                <TruncatedCellText
                  maxWidth="max-w-[260px]"
                  title={movement.note ?? undefined}
                >
                  {movement.note || '-'}
                </TruncatedCellText>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  )
}

function ReceiveStockTab({
  error,
  isSubmitting,
  onSubmit,
  products,
  productsError,
  warehouses,
  warehousesError,
}: {
  error?: BackendError
  isSubmitting: boolean
  onSubmit: (payload: ReceiveStockPayload) => Promise<void>
  products: Product[]
  productsError?: BackendError
  warehouses: Warehouse[]
  warehousesError?: BackendError
}) {
  const form = useForm<ReceiveStockFormValues>({
    resolver: zodResolver(receiveStockSchema),
    defaultValues: {
      warehouseId: '',
      productId: '',
      quantity: '',
      note: '',
    },
  })

  const hasMasterData = products.length > 0 && warehouses.length > 0

  return (
    <div className="rounded-md border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <PackagePlus className="h-5 w-5 text-blue-600" aria-hidden="true" />
        <div>
          <h2 className="text-lg font-semibold">Receive Stock</h2>
          <p className="text-sm text-slate-500">
            Increase on-hand stock for a product in a warehouse.
          </p>
        </div>
      </div>
      <InventoryFormPrerequisites
        products={products}
        productsError={productsError}
        warehouses={warehouses}
        warehousesError={warehousesError}
      />
      {hasMasterData ? (
        <form
          className="max-w-xl space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit({
              warehouseId: values.warehouseId,
              productId: values.productId,
              quantity: Number(values.quantity),
              note: emptyToNull(values.note),
            })
            form.reset({
              warehouseId: values.warehouseId,
              productId: values.productId,
              quantity: '',
              note: '',
            })
          })}
        >
          <FieldError error={error} />
          <FormField
            label="Warehouse"
            error={form.formState.errors.warehouseId?.message}
          >
            <select
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              disabled={isSubmitting}
              {...form.register('warehouseId')}
            >
              <option value="">Select warehouse</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {formatWarehouseLabel(warehouse)}
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            label="Product"
            error={form.formState.errors.productId?.message}
          >
            <select
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              disabled={isSubmitting}
              {...form.register('productId')}
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {formatProductLabel(product)}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Quantity" error={form.formState.errors.quantity?.message}>
            <Input
              type="number"
              min="1"
              step="1"
              disabled={isSubmitting}
              {...form.register('quantity')}
            />
          </FormField>
          <FormField label="Note" error={form.formState.errors.note?.message}>
            <Input disabled={isSubmitting} {...form.register('note')} />
          </FormField>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Receiving...' : 'Receive stock'}
          </Button>
        </form>
      ) : null}
    </div>
  )
}

function AdjustStockTab({
  error,
  isSubmitting,
  onSubmit,
  products,
  productsError,
  warehouses,
  warehousesError,
}: {
  error?: BackendError
  isSubmitting: boolean
  onSubmit: (payload: AdjustStockPayload) => Promise<void>
  products: Product[]
  productsError?: BackendError
  warehouses: Warehouse[]
  warehousesError?: BackendError
}) {
  const form = useForm<AdjustStockFormValues>({
    resolver: zodResolver(adjustStockSchema),
    defaultValues: {
      warehouseId: '',
      productId: '',
      newQuantityOnHand: '',
      reason: '',
    },
  })
  const hasMasterData = products.length > 0 && warehouses.length > 0

  return (
    <div className="rounded-md border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal className="h-5 w-5 text-blue-600" aria-hidden="true" />
        <div>
          <h2 className="text-lg font-semibold">Adjust Stock</h2>
          <p className="text-sm text-slate-500">
            Set a corrected on-hand quantity after a physical count.
          </p>
        </div>
      </div>
      <InventoryFormPrerequisites
        products={products}
        productsError={productsError}
        warehouses={warehouses}
        warehousesError={warehousesError}
      />
      {hasMasterData ? (
        <form
          className="max-w-xl space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit({
              warehouseId: values.warehouseId,
              productId: values.productId,
              newQuantityOnHand: Number(values.newQuantityOnHand),
              reason: values.reason,
            })
            form.reset({
              warehouseId: values.warehouseId,
              productId: values.productId,
              newQuantityOnHand: '',
              reason: '',
            })
          })}
        >
          <FieldError error={error} />
          <FormField
            label="Warehouse"
            error={form.formState.errors.warehouseId?.message}
          >
            <select
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              disabled={isSubmitting}
              {...form.register('warehouseId')}
            >
              <option value="">Select warehouse</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {formatWarehouseLabel(warehouse)}
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            label="Product"
            error={form.formState.errors.productId?.message}
          >
            <select
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              disabled={isSubmitting}
              {...form.register('productId')}
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {formatProductLabel(product)}
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            label="New quantity on hand"
            error={form.formState.errors.newQuantityOnHand?.message}
          >
            <Input
              type="number"
              min="0"
              step="1"
              disabled={isSubmitting}
              {...form.register('newQuantityOnHand')}
            />
          </FormField>
          <FormField label="Reason" error={form.formState.errors.reason?.message}>
            <Input disabled={isSubmitting} {...form.register('reason')} />
          </FormField>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adjusting...' : 'Adjust stock'}
          </Button>
        </form>
      ) : null}
    </div>
  )
}

function InventoryFormPrerequisites({
  products,
  productsError,
  warehouses,
  warehousesError,
}: {
  products: Product[]
  productsError?: BackendError
  warehouses: Warehouse[]
  warehousesError?: BackendError
}) {
  if (productsError) {
    return <ResourceErrorState error={productsError} />
  }

  if (warehousesError) {
    return <ResourceErrorState error={warehousesError} />
  }

  if (products.length === 0 || warehouses.length === 0) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Create products and warehouses first.
      </div>
    )
  }

  return null
}

function formatProductLabel(product: Product) {
  return `${product.sku} - ${product.name}`
}

function formatWarehouseLabel(warehouse: Warehouse) {
  return `${warehouse.code} - ${warehouse.name}`
}

function formatReference(movement: StockMovement) {
  if (!movement.referenceType && !movement.referenceId) {
    return '-'
  }

  return [movement.referenceType, movement.referenceId].filter(Boolean).join(' / ')
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}
