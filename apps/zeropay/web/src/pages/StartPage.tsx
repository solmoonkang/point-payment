// 제안서에 없음 · 제로페이 회원 시작 화면 (튼튼몰을 흉내 낸 모의)
import { memberApi, useLoad, won } from '../api'
import { LoginForm } from '../components/LoginForm'
import { MallFrame } from '../components/MallFrame'

export function StartPage() {
  const me = useLoad(memberApi.me, [])

  if (me.error?.name === 'MEMBER_LOGIN_REQUIRED') {
    return (
      <MallFrame>
        <LoginForm onDone={me.reload} />
      </MallFrame>
    )
  }
  if (!me.data) return <MallFrame>{me.error ? <p className="pad err">{me.error.message}</p> : <p className="pad">불러오는 중…</p>}</MallFrame>

  const logout = async () => {
    await memberApi.logout()
    me.reload()
  }

  const { member, balance, expiresOn, keepayUrl } = me.data
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
            <a className="primary" href={keepayUrl}>
              킵페이에서 가입하기
            </a>
          </div>
        </div>
        <button className="ghost" onClick={logout}>
          로그아웃
        </button>
      </div>
    </MallFrame>
  )
}
