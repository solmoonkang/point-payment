// 예시 1 보험 선택
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useSearch } from 'wouter'
import { messageOf, sessionApi } from '../api'
import { SiteFrame } from '../components/SiteFrame'

export function PickPage() {
  const search = useSearch()
  const [, navigate] = useLocation()
  const [error, setError] = useState('')
  const exchanged = useRef(false)

  // 제로페이 링크의 일회용 값은 한 번만 교환되므로, 개발 모드에서 effect 가 두 번 돌아도 한 번만 보냄
  useEffect(() => {
    const code = new URLSearchParams(search).get('code')
    if (!code || exchanged.current) return
    exchanged.current = true
    sessionApi.link(code).then(
      () => navigate('/', { replace: true }),
      (failure: unknown) => setError(`제로페이 회원 연결 실패: ${messageOf(failure)}`),
    )
  }, [search, navigate])

  return (
    <SiteFrame>
      <div className="body pick" style={{ paddingBottom: 24 }}>
        <span className="pill">튼튼머니 포인트로 가입 가능</span>
        <h4>어떤 보험에 가입하시겠어요?</h4>
        <p>필요한 보장을 선택하고 몇 분 만에 가입을 완료하세요.</p>
        {error && <p className="err">{error}</p>}
        <div className="plans">
          <div className="plan">
            <img src="/images/gym.jpg" alt="헬스장 사진" />
            <div className="in">
              <div className="hd">
                <span className="ic">
                  <svg className="i">
                    <use href="#i-building" />
                  </svg>
                </span>
                헬스장 휴폐업 보험<span className="bd">NEW</span>
              </div>
              <div className="ds">결제한 헬스장이 갑자기 문을 닫아도 남은 이용료를 보상받으세요.</div>
              <ul>
                <li><span className="ck">✓</span>폐업 시 잔여 이용료 보상</li>
                <li><span className="ck">✓</span>30일 이상 휴업 보상</li>
                <li><span className="ck">✓</span>결제한 헬스장 검색으로 간편 가입</li>
              </ul>
              <div className="bt">
                <b><small>월 </small>15,000원</b>
                <Link href="/join/gym" className="btn">가입하기 →</Link>
              </div>
            </div>
          </div>
          <div className="plan">
            <img src="/images/run.jpg" alt="달리는 사람 사진" />
            <div className="in">
              <div className="hd">
                <span className="ic">
                  <svg className="i">
                    <use href="#i-run" />
                  </svg>
                </span>
                스포츠활동 보험<span className="bd">1만원 · 2만원</span>
              </div>
              <div className="ds">운동 중 발생하는 부상을 든든하게 보장하는 스포츠활동 상해보험.</div>
              <ul>
                <li><span className="ck">✓</span>골절 진단비 보장</li>
                <li><span className="ck">✓</span>상해 입원일당</li>
                <li><span className="ck">✓</span>1만원 / 2만원 플랜 선택</li>
              </ul>
              <div className="bt">
                <b><small>월 </small>10,000원~</b>
                <Link href="/join/sports" className="btn">가입하기 →</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="three">
          <div><i>1</i><svg className="i"><use href="#i-doc" /></svg>약관 동의</div>
          <div><i>2</i><svg className="i"><use href="#i-user" /></svg>고객정보 입력</div>
          <div><i>3</i><svg className="i"><use href="#i-card" /></svg>포인트 / 카드 결제</div>
        </div>
      </div>
    </SiteFrame>
  )
}
