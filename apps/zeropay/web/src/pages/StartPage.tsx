// 제안서에 없음 · 제로페이 회원 시작 화면 (튼튼몰을 흉내 낸 모의)
import { useState } from 'react'
import { ApiFailure, memberApi, useLoad, won } from '../api'
import { LoginForm } from '../components/LoginForm'
import { MallFrame } from '../components/MallFrame'

export function StartPage() {
  const me = useLoad(memberApi.me, [])
  const [error, setError] = useState('')

  if (me.error?.name === 'MEMBER_LOGIN_REQUIRED') {
    return (
      <MallFrame>
        <LoginForm onDone={me.reload} />
      </MallFrame>
    )
  }
  if (!me.data) return <MallFrame>{me.error ? <p className="pad err">{me.error.message}</p> : <p className="pad">불러오는 중…</p>}</MallFrame>

  const goKeepay = async () => {
    try {
      window.location.href = (await memberApi.link()).url
    } catch (failure) {
      setError(failure instanceof ApiFailure ? failure.message : '이동에 실패했습니다')
    }
  }
  const logout = async () => {
    await memberApi.logout()
    me.reload()
  }

  const { member, balance, expiresOn } = me.data
  return (
    <MallFrame>
      <div className="pad">
        <p className="hello">안녕하세요, {member.name} 님</p>
        <div className="balance">
          <span>
            잔액조회 [스포츠상품권]
            <small>{expiresOn ? `${expiresOn} 까지` : '지급 내역 없음'}</small>
          </span>
          <b>{won(balance)}P</b>
        </div>

        <p className="sec">튼튼머니 스포츠상품권으로 가입하는 보험</p>
        <div className="product">
          <div className="ph">상품 사진</div>
          <div className="in">
            <div className="seller">킵페이</div>
            <div className="name">튼튼머니 스포츠 안전 보험</div>
            <ul>
              <li>헬스장 휴폐업 보험 · 월 15,000원</li>
              <li>스포츠활동 보험 · 월 10,000원~</li>
            </ul>
            <button className="primary" onClick={goKeepay}>
              킵페이에서 가입하기
            </button>
          </div>
        </div>
        {error && <p className="err">{error}</p>}
        <button className="ghost" onClick={logout}>
          로그아웃
        </button>
      </div>
    </MallFrame>
  )
}
