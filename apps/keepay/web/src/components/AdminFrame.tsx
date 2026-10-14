// 예시 7 의 틀. 메뉴 다섯은 그림 그대로이고 화면은 가입자 관리만 있음, 로고는 킵페이
// 개발용 설정 · 로그아웃은 그림에 없음 (추가)
import type { ReactNode } from 'react'
import { Link } from 'wouter'
import { adminApi } from '../api'

const MENUS: { label: string; icon: string; href?: string; more?: boolean }[] = [
  { label: '대시보드', icon: 'i-box' },
  { label: '가입자 관리', icon: 'i-user', href: '/admin' },
  { label: '사고 접수 관리', icon: 'i-book' },
  { label: '프로모션 관리', icon: 'i-doc' },
  { label: '자주 묻는 질문 관리', icon: 'i-help', more: true },
]

const Icon = ({ id }: { id: string }) => (
  <svg className="i">
    <use href={`#${id}`} />
  </svg>
)

export function AdminFrame({ current, crumb, action, children }: { current: string; crumb: [string, string]; action?: ReactNode; children: ReactNode }) {
  // 로그아웃 뒤 새로 열어 로그인 확인부터 다시 (AdminGate)
  const logout = async () => {
    await adminApi.logout()
    window.location.assign('/admin')
  }

  return (
    <div className="adm">
      <aside>
        <img src="/images/keepay-logo.png" alt="킵페이 로고" style={{ width: 150, margin: '14px 0 14px 12px' }} />
        {MENUS.map((menu) =>
          menu.href ? (
            <Link key={menu.label} href={menu.href} className={menu.href === current ? 'on' : ''}>
              <Icon id={menu.icon} />
              {menu.label}
            </Link>
          ) : (
            <div key={menu.label}>
              <Icon id={menu.icon} />
              {menu.label}
              {menu.more && <span>›</span>}
            </div>
          ),
        )}
        <div className="extra">
          <Link href="/admin/dev" className={current === '/admin/dev' ? 'on' : ''}>
            <Icon id="i-help" />
            개발용 설정
          </Link>
          <button onClick={logout}>로그아웃</button>
        </div>
      </aside>
      <div className="mn">
        <div className="bc">
          <span>
            {crumb[0]} &nbsp;›&nbsp; {crumb[1]}
          </span>
          {action}
        </div>
        {children}
      </div>
    </div>
  )
}
