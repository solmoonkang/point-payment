import { z } from 'zod'
import { zWon } from './common.js'

// 받는 즉시 차감함. 잔액 부족 · 만료는 실패 응답 (INSUFFICIENT_BALANCE · VOUCHER_EXPIRED)
// 같은 가맹점 주문 번호로 다시 보내면 처음 승인 번호를 돌려줌 (응답을 못 받았을 때 두 번 차감되지 않게)
export const zUsageCreateRequest = z.object({
  memberId: z.string().min(1),
  amount: zWon.positive(), // 쓸 금액만 보냄 (남은 잔액은 제로페이만 계산)
  merchantOrderId: z.string().min(1),
})

export const zUsageApproval = z.object({
  approvalNo: z.string(), // 사용 취소 · 정산 대조에 씀
})

export const zUsageCancelRequest = z.object({
  reason: z.string().min(1), // 제로페이 내역에 남김 (가입 취소 · 카드 결제 실패)
})

// 사용 취소 응답 · 사용 내역의 한 건
export const zUsage = z.object({
  approvalNo: z.string(),
  memberId: z.string(),
  merchantOrderId: z.string(),
  amount: zWon,
  status: z.enum(['approved', 'cancelled']),
  approvedAt: z.string(),
  cancelledAt: z.string().nullable(),
})

export type UsageCreateRequest = z.infer<typeof zUsageCreateRequest>
export type UsageApproval = z.infer<typeof zUsageApproval>
export type UsageCancelRequest = z.infer<typeof zUsageCancelRequest>
export type Usage = z.infer<typeof zUsage>
