import type { RequestHandler } from 'express'
import { z } from 'zod'
import { visitorOf, visitorSessions } from '../../middlewares/visitor.js'
import type { MemberService } from './member.service.js'

const zLinkRequest = z.object({ code: z.string().min(1) })
const zSignUpRequest = z.object({
  name: z.string().trim().min(1, '이름을 입력해 주세요'),
  birth: z.string().regex(/^\d{8}$/, '생년월일은 8자리 숫자입니다'),
  phone: z.string().regex(/^01\d{8,9}$/, '휴대폰번호는 - 없이 숫자만 입력해 주세요'),
  email: z.string().email('이메일 형식이 아닙니다'),
  agreements: z.object({ terms: z.boolean(), privacy: z.boolean(), thirdParty: z.boolean(), marketing: z.boolean() }),
})

export function createMemberController(member: MemberService) {
  const link: RequestHandler = async (request, response) => {
    const { code } = zLinkRequest.parse(request.body)
    const linked = await member.link(code)
    // 다른 제로페이 회원으로 바뀌었으면 이전 사람의 킵페이 가입 정보를 이어 쓰지 않음
    const previous = visitorOf(request)
    const keep = previous.zeropayMemberId === linked.zeropayMemberId ? { memberId: previous.memberId } : {}
    visitorSessions.set(request, response, { ...keep, ...linked })
    response.json({ zeropayName: linked.zeropayName })
  }

  const session: RequestHandler = (request, response) => {
    const visitor = visitorOf(request)
    response.json({
      zeropayLinked: Boolean(visitor.zeropayMemberId),
      zeropayName: visitor.zeropayName ?? null,
      member: visitor.memberId ? member.get(visitor.memberId) : null,
    })
  }

  // 제로페이 회원 번호는 화면이 보낸 값이 아니라 세션에서 붙임
  const signUp: RequestHandler = (request, response) => {
    const input = zSignUpRequest.parse(request.body)
    const visitor = visitorOf(request)
    const signedUp = member.signUp({ ...input, zeropayMemberId: visitor.zeropayMemberId ?? null })
    visitorSessions.set(request, response, { ...visitor, memberId: signedUp.id })
    response.json({ member: signedUp })
  }

  return { link, session, signUp }
}
