import type { ReactNode } from 'react'

export function MallFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mall">
      <header className="zbar">
        zero mall
        <span className="sw">
          제로페이몰<b>튼튼몰 ▾</b>
        </span>
      </header>
      {children}
    </div>
  )
}
