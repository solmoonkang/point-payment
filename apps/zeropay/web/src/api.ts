import { useCallback, useEffect, useState } from 'react'

// name 은 서버 ErrorCode 의 키 (예: MEMBER_LOGIN_REQUIRED)
export class ApiFailure extends Error {
  constructor(name: string, message: string) {
    super(message)
    this.name = name
  }
}

async function call<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, body === undefined ? undefined : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new ApiFailure(data.error ?? 'SERVER_ERROR', data.message ?? '요청이 실패했습니다')
  return data as T
}

export interface MemberView { id: string; name: string; birth: string; phone: string }
export interface Me { member: MemberView; balance: number; expiresOn: string | null; keepayUrl: string }
export interface HistoryRow {
  entryId: string
  kind: 'grant' | 'use' | 'cancel'
  approvalNo: string | null
  memberName: string
  phone: string
  merchant: string | null
  merchantOrderId: string | null
  amount: number
  balanceAfter: number
  at: string
}
export interface Settings { dropNextUseResponse: boolean; failNextCancel: boolean }

export const memberApi = {
  login: (loginId: string, password: string) => call<{ member: MemberView }>('/api/member/login', { loginId, password }),
  logout: () => call<{ ok: true }>('/api/member/logout', {}),
  me: () => call<Me>('/api/member/me'),
}

export const adminApi = {
  login: (adminId: string, password: string) => call<{ adminId: string }>('/api/admin/login', { adminId, password }),
  logout: () => call<{ ok: true }>('/api/admin/logout', {}),
  me: () => call<{ adminId: string | null }>('/api/admin/me'),
  history: () => call<{ rows: HistoryRow[] }>('/api/admin/vouchers'),
  members: () => call<{ members: MemberView[] }>('/api/admin/members'),
  grant: (input: { memberId: string; amount: number; expiresOn: string; memo: string }) => call<unknown>('/api/admin/vouchers/grant', input),
  settings: () => call<Settings>('/api/admin/settings'),
  updateSettings: (patch: Partial<Settings>) => call<Settings>('/api/admin/settings', patch),
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
