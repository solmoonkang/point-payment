// 로그인 뒤에야 운영자 화면을 그림 (먼저 그리면 목록 요청이 로그인 전에 나가 빈 목록이 남음)
import type { ReactNode } from 'react'
import { adminApi, useLoad } from '../api'
import { AdminLoginPage } from '../pages/AdminLoginPage'

export function AdminGate({ children }: { children: ReactNode }) {
  const me = useLoad(adminApi.me, [])
  if (!me.data) return null
  if (!me.data.adminId) return <AdminLoginPage onDone={me.reload} />
  return <>{children}</>
}
