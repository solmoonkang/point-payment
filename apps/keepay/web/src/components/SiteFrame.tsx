// 예시 1~6 공통 머리 · 꼬리 (문구는 제안서 그림 그대로)
import type { ReactNode } from 'react'
import { Link } from 'wouter'

export function SiteFrame({ children }: { children: ReactNode }) {
  return (
    <div className="scr">
      <div className="nav">
        <Link href="/">
          <b>튼튼머니 스포츠활동</b>
        </Link>
        <div>
          <Link href="/join/gym">
            <span>헬스장 휴폐업 보험</span>
          </Link>
          <Link href="/join/sports">
            <span>스포츠활동 보험</span>
          </Link>
        </div>
      </div>
      {children}
      <div className="foot">
        <span>튼튼머니 스포츠활동 보험 · 본 페이지는 가입 안내용 데모입니다.</span>
        <span>고객센터 1588-0000 (평일 09:00~18:00)</span>
      </div>
    </div>
  )
}
