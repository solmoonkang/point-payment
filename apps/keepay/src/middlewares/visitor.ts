import type { Request, RequestHandler } from 'express'
import { ErrorCode } from '../utils/error-code.js'
import { AppError } from '../utils/error.js'
import { createSessionStore } from '../utils/session.js'

// 회원 화면을 쓰는 사람: 제로페이에서 넘어왔으면 제로페이 회원 번호, 킵페이 가입을 마쳤으면 킵페이 회원 번호
export interface Visitor {
  zeropayMemberId?: string
  memberId?: string
}

export const visitorSessions = createSessionStore<Visitor>('kp_visitor')

export const visitorOf = (request: Request): Visitor => visitorSessions.get(request) ?? {}

export const requireMember: RequestHandler = (request, response, next) => {
  const visitor = visitorOf(request)
  if (!visitor.memberId) throw new AppError(ErrorCode.VISITOR_NOT_SIGNED_UP)
  response.locals.visitor = visitor
  next()
}
