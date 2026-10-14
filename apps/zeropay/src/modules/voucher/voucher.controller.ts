import { zBalanceResponse, zUsage, zUsageCreateRequest, zUsageListQuery } from '@point-payment/contract'
import type { RequestHandler } from 'express'
import { z } from 'zod'
import { ErrorCode } from '../../utils/error-code.js'
import { AppError } from '../../utils/error.js'
import type { AdminService } from '../admin/admin.service.js'
import type { VoucherService } from './voucher.service.js'

const zApproveRequest = z.object({ payPassword: z.string().min(1) })
const zGrantRequest = z.object({
  memberId: z.string().min(1),
  amount: z.number().int().positive(),
  expiresOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  memo: z.string().default(''),
})

export function createVoucherController(voucher: VoucherService, admin: AdminService) {
  const merchantOf = (locals: Record<string, unknown>) => locals.merchant as string
  const memberOf = (locals: Record<string, unknown>) => locals.memberId as string
  const param = (value: string | string[] | undefined) => String(value ?? '')

  const balance: RequestHandler = (request, response) => {
    const memberId = param(request.params.memberId)
    response.json(zBalanceResponse.parse({ memberId, ...voucher.balance(memberId) }))
  }

  const createUsage: RequestHandler = (request, response) => {
    const usage = voucher.createUsage(merchantOf(response.locals), zUsageCreateRequest.parse(request.body))
    // 오류 상황 설정: 처리는 끝냈지만 응답 없이 연결을 끊음 → 가맹점이 같은 요청 번호로 다시 보내는지 보려는 것
    if (admin.consume('dropNextUseResponse')) {
      request.socket.destroy()
      return
    }
    response.json(zUsage.parse(usage))
  }

  const getUsage: RequestHandler = (request, response) => {
    response.json(zUsage.parse(voucher.getUsage(merchantOf(response.locals), param(request.params.usageId))))
  }

  const cancelUsage: RequestHandler = (request, response) => {
    if (admin.consume('failNextCancel')) throw new AppError(ErrorCode.CANCEL_FAILURE_FORCED)
    response.json(zUsage.parse(voucher.cancelUsage(merchantOf(response.locals), param(request.params.usageId))))
  }

  const listUsages: RequestHandler = (request, response) => {
    const usages = voucher.listUsages(merchantOf(response.locals), zUsageListQuery.parse(request.query))
    response.json({ usages: usages.map((usage) => zUsage.parse(usage)) })
  }

  const approvalView: RequestHandler = (request, response) => {
    response.json(voucher.approvalView(memberOf(response.locals), param(request.params.usageId)))
  }

  const approve: RequestHandler = (request, response) => {
    const { payPassword } = zApproveRequest.parse(request.body)
    const usage = voucher.approve(memberOf(response.locals), param(request.params.usageId), payPassword)
    response.json({ status: usage.status, returnUrl: usage.returnUrl })
  }

  const decline: RequestHandler = (request, response) => {
    const usage = voucher.decline(memberOf(response.locals), param(request.params.usageId))
    response.json({ status: usage.status, returnUrl: usage.returnUrl })
  }

  const history: RequestHandler = (_request, response) => {
    response.json({ rows: voucher.history() })
  }

  const grant: RequestHandler = (request, response) => {
    response.json(voucher.grant(zGrantRequest.parse(request.body)))
  }

  return { balance, createUsage, getUsage, cancelUsage, listUsages, approvalView, approve, decline, history, grant }
}
