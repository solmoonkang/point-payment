// 튼튼몰 머리 + 「제로페이 모의」 표시
import type { ReactNode } from 'react'

export function MallFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mall">
      <header className="zbar">
        zero mall
        <span className="sw">
          제로페이몰<b>튼튼몰 ▾</b>
        </span>
        <span className="mock">제로페이 모의</span>
      </header>
      {children}
    </div>
  )
}
