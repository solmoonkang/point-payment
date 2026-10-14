// 예시 7 과 같은 틀
import type { ReactNode } from 'react'
import { Link } from 'wouter'
import { adminApi } from '../api'

const MENUS = [
  { href: '/admin', label: '상품권 내역', icon: 'i-doc' },
  { href: '/admin/grant', label: '상품권 지급', icon: 'i-coins' },
  { href: '/admin/settings', label: '오류 상황 설정', icon: 'i-help' },
] as const

export function AdminFrame({ current, crumb, action, children }: { current: string; crumb: string; action?: ReactNode; children: ReactNode }) {
  // 로그아웃 뒤 새로 열어 로그인 확인부터 다시 (AdminGate)
  const logout = async () => {
    await adminApi.logout()
    window.location.assign('/admin')
  }

  return (
    <div className="adm">
      <aside>
        <b className="zlogo">제로페이 모의</b>
        {MENUS.map((menu) => (
          <Link key={menu.href} href={menu.href} className={menu.href === current ? 'on' : ''}>
            <svg className="i">
              <use href={`#${menu.icon}`} />
            </svg>
            {menu.label}
          </Link>
        ))}
        <button onClick={logout}>로그아웃</button>
      </aside>
      <div className="mn">
        <div className="bc">
          <span>상품권 관리 &nbsp;›&nbsp; {crumb}</span>
          {action}
        </div>
        {children}
      </div>
    </div>
  )
}
