import { useCallback, useEffect, useState } from 'react'

// name 은 서버 ErrorCode 의 키 (예: MEMBER_LOGIN_REQUIRED)
export class ApiFailure extends Error {
  constructor(name: string, message: string, readonly fields: Record<string, string> = {}) {
    super(message)
    this.name = name
  }
}

async function call<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, body === undefined ? undefined : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new ApiFailure(data.error ?? 'SERVER_ERROR', data.message ?? '요청이 실패했습니다', data.fields)
  return data as T
}

export interface Plan { id: string; name: string; price: number; coverages: string[] }
export interface Product { id: 'gym' | 'sports'; name: string; needsGym: boolean; plans: Plan[] }
export interface Gym { id: string; name: string; address: string; tag: string }
export interface Agreements { terms: boolean; privacy: boolean; thirdParty: boolean; marketing: boolean }
export interface Customer { name: string; birth: string; phone: string; email: string }
export interface Member extends Customer { id: string; zeropayMemberId: string | null }
export interface Session { zeropayLinked: boolean; member: Member | null }
export interface Quote { price: number; balance: number | null; pointAmount: number; pgAmount: number }
export type PayMethod = 'point' | 'card'
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'cancel_failed'
export interface Order {
  id: number
  productId: string
  productName: string
  planName: string
  gymName: string | null
  price: number
  pointAmount: number
  pgAmount: number
  status: OrderStatus
  failReason: string | null
  approvalNo: string | null
}
export interface PayResult { order: Order }
export interface SubscriberRow {
  orderId: number
  productName: string
  name: string
  phone: string
  emergencyPhone: string | null
  address: string | null
  email: string
  promotionCode: string | null
  ip: string
  joinedAt: string
  payMethod: '포인트' | '카드' | '포인트+카드'
  status: OrderStatus
  price: number
  pointAmount: number
  pgAmount: number
  approvalNo: string | null
  failReason: string | null
}

export const sessionApi = {
  get: () => call<Session>('/api/session'),
}

export const productApi = {
  get: (productId: string) => call<Product>(`/api/products/${encodeURIComponent(productId)}`),
  gyms: (query: string) => call<{ gyms: Gym[] }>(`/api/gyms?query=${encodeURIComponent(query)}`),
}

export const memberApi = {
  signUp: (input: Customer & { agreements: Agreements }) => call<{ member: Member }>('/api/members', input),
}

export const orderApi = {
  quote: (productId: string, planId: string, method: PayMethod) => call<Quote>(`/api/orders/quote?${new URLSearchParams({ productId, planId, method })}`),
  pay: (input: { requestId: string; productId: string; planId: string; gymId: string | null; method: PayMethod }) => call<PayResult>('/api/orders', input),
  get: (orderId: number) => call<PayResult>(`/api/orders/${orderId}`),
}

export const adminApi = {
  login: (adminId: string, password: string) => call<{ adminId: string }>('/api/admin/login', { adminId, password }),
  logout: () => call<{ ok: true }>('/api/admin/logout', {}),
  me: () => call<{ adminId: string | null }>('/api/admin/me'),
  subscribers: () => call<{ rows: SubscriberRow[] }>('/api/admin/subscribers'),
  cancel: (orderId: number) => call<{ order: Order }>(`/api/admin/orders/${orderId}/cancel`, {}),
  dev: () => call<{ pgFailNext: boolean }>('/api/admin/dev'),
  updateDev: (patch: { pgFailNext: boolean }) => call<{ pgFailNext: boolean }>('/api/admin/dev', patch),
}

export function useLoad<T>(load: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ data?: T; error?: ApiFailure; loading: boolean }>({ loading: true })
  const run = useCallback(load, deps)
  const reload = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true }))
    run().then(
      (data) => setState({ data, loading: false }),
      (error: unknown) => setState({ error: error instanceof ApiFailure ? error : new ApiFailure('SERVER_ERROR', String(error)), loading: false }),
    )
  }, [run])
  useEffect(reload, [reload])
  return { ...state, reload }
}

export const won = (amount: number) => amount.toLocaleString('ko-KR')

export const messageOf = (failure: unknown) => (failure instanceof ApiFailure ? failure.message : '요청이 실패했습니다')
