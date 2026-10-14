import type { RequestHandler } from 'express'
import { ErrorCode } from '../utils/error-code.js'
import { AppError } from '../utils/error.js'
import { createSessionStore } from '../utils/session.js'

export const adminSessions = createSessionStore<{ adminId: string }>('kp_admin')

export const adminAuth: RequestHandler = (request, _response, next) => {
  if (!adminSessions.get(request)) throw new AppError(ErrorCode.ADMIN_LOGIN_REQUIRED)
  next()
}
