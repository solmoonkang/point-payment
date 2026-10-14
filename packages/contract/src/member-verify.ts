import { z } from 'zod'

// 킵페이 가입 때 받은 고객정보로 제로페이 회원인지 확인 (없으면 not-found, 킵페이는 카드 결제만 열어 둠)
// ponytail: 이름 · 생년월일 · 휴대폰번호만 맞춰 봄, 실제 연동이면 휴대폰 본인인증 결과(CI)로
export const zMemberVerifyRequest = z.object({
  name: z.string().min(1),
  birth: z.string().regex(/^\d{8}$/),
  phone: z.string().regex(/^01\d{8,9}$/),
})

export const zMemberVerifyResponse = z.object({
  memberId: z.string(), // 킵페이가 가입 때 함께 저장하는 제로페이 회원 번호
})

export type MemberVerifyRequest = z.infer<typeof zMemberVerifyRequest>
export type MemberVerifyResponse = z.infer<typeof zMemberVerifyResponse>
