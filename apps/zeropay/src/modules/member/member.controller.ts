import { zLinkExchangeRequest, zLinkExchangeResponse } from '@point-payment/contract'
import type { RequestHandler } from 'express'
import { z } from 'zod'
import { memberSessions } from '../../middlewares/memberAuth.js'
import type { VoucherService } from '../voucher/voucher.service.js'
import type { MemberService } from './member.service.js'

const zLoginRequest = z.object({ loginId: z.string().min(1), password: z.string().min(1) })

export function createMemberController(member: MemberService, voucher: VoucherService) {
  const login: RequestHandler = (request, response) => {
    const { loginId, password } = zLoginRequest.parse(request.body)
    const loggedIn = member.login(loginId, password)
    memberSessions.set(request, response, { memberId: loggedIn.id })
    response.json({ member: loggedIn })
  }

  const logout: RequestHandler = (request, response) => {
    memberSessions.end(request, response)
    response.json({ ok: true })
  }

  const me: RequestHandler = (_request, response) => {
    const memberId = response.locals.memberId as string
    response.json({ member: member.get(memberId), ...voucher.balance(memberId) })
  }

  const link: RequestHandler = (_request, response) => {
    response.json({ url: member.issueLinkUrl(response.locals.memberId as string) })
  }

  const exchange: RequestHandler = (request, response) => {
    const { code } = zLinkExchangeRequest.parse(request.body)
    response.json(zLinkExchangeResponse.parse(member.exchange(code)))
  }

  const list: RequestHandler = (_request, response) => {
    response.json({ members: member.list() })
  }

  return { login, logout, me, link, exchange, list }
}
