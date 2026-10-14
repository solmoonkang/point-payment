import type { RequestHandler } from 'express'
import { z } from 'zod'
import { adminSessions } from '../../middlewares/adminAuth.js'
import type { AdminService } from './admin.service.js'

const zLoginRequest = z.object({ adminId: z.string().min(1), password: z.string().min(1) })
const zDevPatch = z.object({ pgFailNext: z.boolean().optional() })

export function createAdminController(admin: AdminService) {
  const login: RequestHandler = (request, response) => {
    const { adminId, password } = zLoginRequest.parse(request.body)
    admin.login(adminId, password)
    adminSessions.set(request, response, { adminId })
    response.json({ adminId })
  }

  const logout: RequestHandler = (request, response) => {
    adminSessions.end(request, response)
    response.json({ ok: true })
  }

  // 로그인 전에도 200 (401 이면 화면 콘솔에 오류로 찍힘)
  const me: RequestHandler = (request, response) => {
    response.json({ adminId: adminSessions.get(request)?.adminId ?? null })
  }

  const subscribers: RequestHandler = (_request, response) => {
    response.json({ rows: admin.subscribers() })
  }

  const cancel: RequestHandler = async (request, response) => {
    response.json({ order: await admin.cancel(Number(request.params.orderId)) })
  }

  const getDev: RequestHandler = (_request, response) => {
    response.json(admin.devSettings())
  }

  const updateDev: RequestHandler = (request, response) => {
    response.json(admin.updateDevSettings(zDevPatch.parse(request.body)))
  }

  return { login, logout, me, subscribers, cancel, getDev, updateDev }
}
