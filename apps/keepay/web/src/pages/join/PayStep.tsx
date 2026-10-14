// 예시 6 가입 5단계 - 결제. 포인트 + 카드로 나눠 내는 한 줄은 그림에 없음 (추가)
// 요청 번호는 이 화면에서 한 번 만들어 다시 눌러도 같은 값을 보냄 (주문 하나), 실패하면 새로 만듦
import { useRef, useState } from 'react'
import { useLocation } from 'wouter'
import { messageOf, orderApi, useLoad, won, type Gym, type PayMethod, type Plan, type Product } from '../../api'

export function PayStep({ product, plan, gym, customerName, zeropayLinked, onPrev }: { product: Product; plan: Plan; gym: Gym | null; customerName: string; zeropayLinked: boolean; onPrev: () => void }) {
  const [, navigate] = useLocation()
  const [method, setMethod] = useState<PayMethod>(zeropayLinked ? 'point' : 'card')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const requestId = useRef(crypto.randomUUID())

  const quote = useLoad(() => (zeropayLinked ? orderApi.quote(product.id, plan.id, 'point') : Promise.resolve(null)), [product.id, plan.id, zeropayLinked])
  const pointAmount = method === 'point' ? (quote.data?.pointAmount ?? 0) : 0
  const pgAmount = plan.price - pointAmount

  const pay = async () => {
    setBusy(true)
    setError('')
    try {
      const result = await orderApi.pay({ requestId: requestId.current, productId: product.id, planId: plan.id, gymId: gym?.id ?? null, method })
      navigate(`/pay/result/${result.order.id}`)
    } catch (failure) {
      setError(messageOf(failure))
      requestId.current = crypto.randomUUID()
      quote.reload()
      setBusy(false)
    }
  }

  return (
    <div className="panel">
      <h5>결제</h5>
      <div className="sum">
        <div><span>상품</span><b>{product.name} · {plan.name}</b></div>
        <div><span>가입자</span><b>{customerName}</b></div>
        {gym && <div><span>헬스장</span><b>{gym.name}</b></div>}
        <div className="tot"><span>결제금액</span><b>{won(plan.price)}원</b></div>
      </div>
      <p style={{ fontSize: 13, fontWeight: 700, margin: '16px 0 6px' }}>결제수단</p>
      <div className="methods">
        <button type="button" className={`method ${method === 'point' ? 'sel' : ''}`} disabled={!zeropayLinked} onClick={() => setMethod('point')} aria-pressed={method === 'point'}>
          <span className="ic"><svg className="i"><use href="#i-coins" /></svg></span>
          <span>
            <b>튼튼머니 스포츠활동 포인트</b>
            <small>{zeropayLinked ? `보유 ${won(quote.data?.balance ?? 0)}P` : '일치하는 제로페이 회원 없음'}</small>
          </span>
        </button>
        <button type="button" className={`method ${method === 'card' ? 'sel' : ''}`} onClick={() => setMethod('card')} aria-pressed={method === 'card'}>
          <span className="ic"><svg className="i"><use href="#i-card" /></svg></span>
          <span>
            <b>카드 / 간편결제 (PG)</b>
            <small>신용·체크카드, 간편결제</small>
          </span>
        </button>
      </div>
      {method === 'point' && quote.data && pgAmount > 0 && (
        <p className="split">
          포인트 {won(pointAmount)}P + 카드 {won(pgAmount)}원으로 나눠 결제합니다
        </p>
      )}
      {error && <p className="err">{error}</p>}
      <div className="row2">
        <button type="button" className="btn ghost" onClick={onPrev}>
          이전
        </button>
        <button type="button" className="btn" disabled={busy} onClick={pay}>
          {won(plan.price)}원 결제하기
        </button>
      </div>
    </div>
  )
}
