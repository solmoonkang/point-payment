// 사용 요청만 응답이 없을 때 한 번 다시 보냄. 같은 요청 번호라 제로페이가 처음 만든 건을 돌려주므로 두 번 차감되지 않음
// 사용 취소는 다시 보내지 않음. 실패를 숨기지 않고 「취소 미완료」로 남겨 운영자가 다시 시도하게 함
import {
  MERCHANT_KEY_HEADER,
  fillPath,
  paths,
  zApiError,
  zBalanceResponse,
  zLinkExchangeResponse,
  zUsage,
  zUsageListResponse,
  type BalanceResponse,
  type LinkExchangeResponse,
  type Usage,
  type UsageCreateRequest,
  type UsageListQuery,
  type UsageListResponse,
} from '@point-payment/contract'
import type { ZodType } from 'zod'
import { ErrorCode } from '../../utils/error-code.js'
import { AppError } from '../../utils/error.js'

export interface ZeropayClient {
  exchange(code: string): Promise<LinkExchangeResponse>
  balance(memberId: string): Promise<BalanceResponse>
  createUsage(request: UsageCreateRequest): Promise<Usage>
  getUsage(usageId: string): Promise<Usage>
  cancelUsage(usageId: string): Promise<Usage>
  listUsages(query: UsageListQuery): Promise<UsageListResponse>
}

export function createHttpZeropayClient(options: { baseUrl: string; merchantKey: string; timeoutMs: number }): ZeropayClient {
  return {
    exchange: (code) => send('POST', paths.linkExchange, zLinkExchangeResponse, { code }),

    balance: (memberId) => send('GET', fillPath(paths.balance, { memberId }), zBalanceResponse),

    async createUsage(request) {
      try {
        return await send('POST', paths.usages, zUsage, request)
      } catch (error) {
        if (!isRetryable(error)) throw error
        return send('POST', paths.usages, zUsage, request)
      }
    },

    getUsage: (usageId) => send('GET', fillPath(paths.usage, { usageId }), zUsage),

    cancelUsage: (usageId) => send('POST', fillPath(paths.usageCancel, { usageId }), zUsage, {}),

    listUsages: (query) => {
      const search = new URLSearchParams(Object.entries(query).filter((entry): entry is [string, string] => Boolean(entry[1])))
      return send('GET', `${paths.usages}?${search}`, zUsageListResponse)
    },
  }

  async function send<T>(method: 'GET' | 'POST', path: string, schema: ZodType<T>, body?: unknown): Promise<T> {
    const response = await request(method, path, body)
    const data: unknown = await response.json().catch(() => undefined)
    if (!response.ok) throw toAppError(data, response.status)
    // 바깥에서 들어온 값이라 계약대로인지 확인
    return schema.parse(data)
  }

  async function request(method: 'GET' | 'POST', path: string, body?: unknown): Promise<Response> {
    try {
      return await fetch(new URL(path, options.baseUrl), {
        method,
        headers: { [MERCHANT_KEY_HEADER]: options.merchantKey, ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(options.timeoutMs),
      })
    } catch {
      throw new AppError(ErrorCode.ZEROPAY_UNAVAILABLE)
    }
  }
}

function toAppError(data: unknown, httpStatus: number): AppError {
  const failure = zApiError.safeParse(data)
  if (!failure.success) return new AppError(ErrorCode.ZEROPAY_UNAVAILABLE, `HTTP ${httpStatus}`)
  return new AppError(failure.data.code === 'unavailable' ? ErrorCode.ZEROPAY_UNAVAILABLE : ErrorCode.ZEROPAY_REJECTED, failure.data.message)
}

// 응답을 못 받았거나 제로페이가 일시 장애라고 한 경우만 (거절은 다시 보내도 같음)
function isRetryable(error: unknown): boolean {
  return error instanceof AppError && error.name === ErrorCode.ZEROPAY_UNAVAILABLE.name
}
