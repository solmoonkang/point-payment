// 제안서에 없음 · 결제 결과
import { Link, useParams } from 'wouter'
import { orderApi, useLoad, won } from '../api'
import { SiteFrame } from '../components/SiteFrame'

export function ResultPage() {
  const { orderId = '' } = useParams<{ orderId: string }>()
  const result = useLoad(() => orderApi.get(Number(orderId)), [orderId])

  const body = () => {
    if (result.error) return <p className="err">{result.error.message}</p>
    if (!result.data) return <p className="hint">결제 결과를 확인하는 중…</p>
    const { order } = result.data

    const ok = order.status === 'paid'
    return (
      <>
        <p className={`result-mark ${ok ? 'ok' : 'no'}`}>{ok ? '가입이 완료되었습니다' : '결제에 실패했습니다'}</p>
        <div className="sum">
          <div><span>가입 번호</span><b>{order.id}</b></div>
          <div><span>상품</span><b>{order.productName} · {order.planName}</b></div>
          {order.gymName && <div><span>헬스장</span><b>{order.gymName}</b></div>}
          <div><span>포인트</span><b>{won(order.pointAmount)}P</b></div>
          <div><span>카드</span><b>{won(order.pgAmount)}원</b></div>
          {order.approvalNo && <div><span>제로페이 승인 번호</span><b>{order.approvalNo}</b></div>}
          {!ok && order.failReason && <div><span>사유</span><b>{order.failReason}</b></div>}
          <div className="tot"><span>결제금액</span><b>{won(order.price)}원</b></div>
        </div>
        <div className="row2">
          <Link href="/" className="btn ghost">보험 선택으로</Link>
          {!ok && <Link href={`/join/${order.productId}`} className="btn">다시 가입하기</Link>}
        </div>
      </>
    )
  }

  return (
    <SiteFrame>
      <div className="body">
        <div className="col">
          <div className="panel">
            <h5>결제 결과</h5>
            {body()}
          </div>
        </div>
      </div>
    </SiteFrame>
  )
}
