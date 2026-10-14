import { MERCHANT_KEY_HEADER } from '@point-payment/contract'
import type { RequestHandler } from 'express'
import { env } from '../config/env.js'
import { ErrorCode } from '../utils/error-code.js'
import { AppError } from '../utils/error.js'

export const merchantAuth: RequestHandler = (request, response, next) => {
  // ponytail: 가맹점 하나 · 단순 비교, 가맹점이 늘면 키 목록과 상수시간 비교로
  if (request.header(MERCHANT_KEY_HEADER) !== env.MERCHANT_KEY) throw new AppError(ErrorCode.MERCHANT_KEY_INVALID)
  response.locals.merchant = env.MERCHANT_NAME
  next()
}
