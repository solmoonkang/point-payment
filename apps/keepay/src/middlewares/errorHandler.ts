import type { ApiErrorCode } from '@point-payment/contract'
import type { ErrorRequestHandler, RequestHandler } from 'express'
import { ZodError } from 'zod'
import { ErrorCode } from '../utils/error-code.js'
import { AppError } from '../utils/error.js'

const HTTP_STATUS: Record<ApiErrorCode, number> = {
  unauthorized: 401,
  'not-found': 404,
  invalid: 400,
  conflict: 409,
  expired: 410,
  unavailable: 503,
}

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const failure = toAppError(error)
  response.status(HTTP_STATUS[failure.status]).json({ code: failure.status, error: failure.name, message: failure.message })
}

// 화면 연결보다 앞에 둬서, 없는 API 경로가 화면(index.html)으로 넘어가지 않게 함
export const apiNotFound: RequestHandler = () => {
  throw new AppError(ErrorCode.API_NOT_FOUND)
}

function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error
  if (error instanceof ZodError) return new AppError(ErrorCode.INVALID_INPUT, error.issues.map((issue) => issue.message).join(', '))
  console.error(error)
  return new AppError(ErrorCode.SERVER_ERROR)
}
