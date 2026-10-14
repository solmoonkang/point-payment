import { z } from 'zod'

export const zWon = z.number().int().nonnegative()

export const MERCHANT_KEY_HEADER = 'x-merchant-key'

// code 는 큰 분류, error 는 보낸 쪽이 정한 세부 이름
// 받는 쪽은 code 로 다시 보낼지 정함 (unavailable 만 다시 보낼 수 있음)
export const zApiErrorCode = z.enum(['unauthorized', 'not-found', 'invalid', 'conflict', 'expired', 'unavailable'])
export const zApiError = z.object({ code: zApiErrorCode, error: z.string(), message: z.string() })

export type ApiErrorCode = z.infer<typeof zApiErrorCode>
export type ApiError = z.infer<typeof zApiError>

// 받는 쪽(제로페이 route)과 보내는 쪽(킵페이 클라이언트)이 같은 경로를 쓰도록 여기 한 곳에 둠
export const paths = {
  linkExchange: '/api/v0/link/exchange',
  balance: '/api/v0/members/:memberId/balance',
  usages: '/api/v0/usages', // POST 사용 요청 · GET 사용 내역
  usage: '/api/v0/usages/:usageId',
  usageCancel: '/api/v0/usages/:usageId/cancel',
} as const

export function fillPath(path: string, params: Record<string, string>): string {
  return path.replace(/:(\w+)/g, (_, name: string) => encodeURIComponent(params[name] ?? ''))
}
