import type { RequestHandler } from 'express'
import { ErrorCode } from '../utils/error-code.js'
import { AppError } from '../utils/error.js'
import { createSessionStore } from '../utils/session.js'

export const memberSessions = createSessionStore<{ memberId: string }>('zp_member')

export const memberAuth: RequestHandler = (request, response, next) => {
  const session = memberSessions.get(request)
  if (!session) throw new AppError(ErrorCode.MEMBER_LOGIN_REQUIRED)
  response.locals.memberId = session.memberId
  next()
}
