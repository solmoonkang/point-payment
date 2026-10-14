import { z } from 'zod'

// 링크가 새어 나가도 오래 쓰지 못하게 짧게 둠 (교환도 한 번만 됨)
export const LINK_CODE_TTL_MS = 10 * 60 * 1000

export const LINK_CODE_PARAM = 'code'

export const zLinkExchangeRequest = z.object({
  code: z.string().min(1),
})

export const zLinkExchangeResponse = z.object({
  memberId: z.string(), // 킵페이가 가입 때 함께 저장하는 제로페이 회원 번호
  name: z.string(),
})

export type LinkExchangeRequest = z.infer<typeof zLinkExchangeRequest>
export type LinkExchangeResponse = z.infer<typeof zLinkExchangeResponse>
