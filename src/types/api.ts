export type ApiDataResponse<TData> = {
  data: TData
}

export type PaginationMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type PaginatedResponse<TData> = {
  data: TData[]
  meta: PaginationMeta
}
