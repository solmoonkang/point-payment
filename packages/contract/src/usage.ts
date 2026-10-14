import { z } from 'zod'
import { zWon } from './common.js'

// 같은 요청 번호로 다시 보내면 처음 만든 사용 건을 돌려줌 (응답을 못 받았을 때 안전하게 다시 보내기 위해)
// 같은 번호로 내용이 다르면 conflict
export const zRequestId = z.string().min(8).max(64)

// pending: 회원 승인 대기 · approved: 차감 완료 · rejected: 거절 · cancelled: 사용 취소 (차감했다면 복원)
export const zUsageStatus = z.enum(['pending', 'approved', 'rejected', 'cancelled'])

export const zRejectReason = z.enum(['insufficient', 'expired', 'declined'])

export const zUsageCreateRequest = z.object({
  requestId: zRequestId,
  memberId: z.string().min(1),
  amount: zWon.positive(), // 쓸 금액만 보냄 (남은 잔액은 제로페이만 계산)
  merchantOrderId: z.string().min(1), // 킵페이 가입자 리스트의 #
  returnUrl: z.string().url(), // 회원 승인 뒤 돌아갈 킵페이 주소
})

export const zUsage = z.object({
  usageId: z.string(),
  requestId: zRequestId,
  memberId: z.string(),
  merchantOrderId: z.string(),
  amount: zWon,
  status: zUsageStatus,
  rejectReason: zRejectReason.nullable(),
  approvalNo: z.string().nullable(), // 정산 대조에 씀
  approvalUrl: z.string().url(), // 회원이 결제를 승인하는 제로페이 화면
  createdAt: z.string(),
  approvedAt: z.string().nullable(),
  cancelledAt: z.string().nullable(),
})

export type UsageStatus = z.infer<typeof zUsageStatus>
export type RejectReason = z.infer<typeof zRejectReason>
export type UsageCreateRequest = z.infer<typeof zUsageCreateRequest>
export type Usage = z.infer<typeof zUsage>
