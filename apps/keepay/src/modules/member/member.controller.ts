import type { RequestHandler } from 'express'
import { z } from 'zod'
import { visitorOf, visitorSessions } from '../../middlewares/visitor.js'
import type { MemberService } from './member.service.js'

const REQUIRED = '필수 입력값입니다'
const zRequired = () => z.string({ required_error: REQUIRED })
const zSignUpRequest = z.object({
  name: zRequired().trim().min(1, REQUIRED),
  birth: zRequired().min(1, REQUIRED).regex(/^\d{8}$/, '생년월일은 8자리 숫자로 입력해 주세요 (예: 19910712)'),
  phone: zRequired().min(1, REQUIRED).regex(/^01\d{8,9}$/, '휴대폰번호 형식이 올바르지 않습니다 (- 없이 숫자만)'),
  email: zRequired().min(1, REQUIRED).email('이메일 형식이 올바르지 않습니다'),
  agreements: z.object({ terms: z.boolean(), privacy: z.boolean(), thirdParty: z.boolean(), marketing: z.boolean() }),
})

export function createMemberController(member: MemberService) {
  const session: RequestHandler = (request, response) => {
    const visitor = visitorOf(request)
    response.json({
      zeropayLinked: Boolean(visitor.zeropayMemberId),
      member: visitor.memberId ? member.get(visitor.memberId) : null,
    })
  }

  const signUp: RequestHandler = async (request, response) => {
    const signedUp = await member.signUp(zSignUpRequest.parse(request.body))
    visitorSessions.set(request, response, { memberId: signedUp.id, zeropayMemberId: signedUp.zeropayMemberId ?? undefined })
    response.json({ member: signedUp })
  }

  return { session, signUp }
}
