import { z } from 'zod'
import { zWon } from './common.js'

// 조회한 잔액은 그 순간의 값이라, 실제로 쓸 수 있는지는 사용 요청 · 승인 때 다시 확인됨
export const zBalanceResponse = z.object({
  memberId: z.string(),
  balance: zWon, // 만료되면 0
  expiresOn: z.string().nullable(), // YYYY-MM-DD, 지급 전이면 null
})

export type BalanceResponse = z.infer<typeof zBalanceResponse>
