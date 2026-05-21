import { apiClient } from '@/lib/api-client'
import type {
  GenerateInvoicePayload,
  InvoiceResponse,
  InvoicesResponse,
  IssueInvoicePayload,
  ListInvoicesParams,
  ListPaymentsParams,
  PaymentResponse,
  PaymentsResponse,
  RecordPaymentPayload,
} from '@/types/finance'

export async function listInvoices(params: ListInvoicesParams) {
  const response = await apiClient.get<InvoicesResponse>('/invoices', {
    params: compactParams(params),
  })

  return response.data
}

export async function getInvoice(id: string) {
  const response = await apiClient.get<InvoiceResponse>(`/invoices/${id}`)

  return response.data.data
}

export async function generateInvoiceFromSalesOrder(
  salesOrderId: string,
  payload: GenerateInvoicePayload = {},
) {
  const response = await apiClient.post<InvoiceResponse>(
    `/invoices/from-sales-order/${salesOrderId}`,
    payload,
  )

  return response.data.data
}

export async function issueInvoice(id: string, payload: IssueInvoicePayload) {
  const response = await apiClient.patch<InvoiceResponse>(
    `/invoices/${id}/issue`,
    payload,
  )

  return response.data.data
}

export async function listPayments(params: ListPaymentsParams) {
  const response = await apiClient.get<PaymentsResponse>('/payments', {
    params: compactParams(params),
  })

  return response.data
}

export async function recordPayment(
  invoiceId: string,
  payload: RecordPaymentPayload,
) {
  const response = await apiClient.post<PaymentResponse>(
    `/invoices/${invoiceId}/payments`,
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
