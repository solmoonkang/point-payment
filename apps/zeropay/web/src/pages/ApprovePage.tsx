// 제안서에 없음 · 결제 승인
import { useState, type FormEvent } from 'react'
import { useParams } from 'wouter'
import { ApiFailure, approvalApi, useLoad, won } from '../api'
import { LoginForm } from '../components/LoginForm'
import { MallFrame } from '../components/MallFrame'

const STATUS_TEXT = { approved: '승인 완료', cancelled: '취소된 결제', pending: '승인 대기' } as const
const REJECT_TEXT = { insufficient: '잔액이 부족합니다', expired: '상품권이 만료되었습니다', declined: '결제를 거절했습니다' } as const

export function ApprovePage() {
  const { usageId = '' } = useParams<{ usageId: string }>()
  const view = useLoad(() => approvalApi.view(usageId), [usageId])
  const [payPassword, setPayPassword] = useState('')
  const [error, setError] = useState('')

  if (view.error?.name === 'MEMBER_LOGIN_REQUIRED') {
    return (
      <MallFrame>
        <LoginForm onDone={view.reload} />
      </MallFrame>
    )
  }
  if (!view.data) return <MallFrame>{view.error ? <p className="pad err">{view.error.message}</p> : <p className="pad">불러오는 중…</p>}</MallFrame>

  const decide = async (action: 'approve' | 'decline') => {
    try {
      const result = action === 'approve' ? await approvalApi.approve(usageId, payPassword) : await approvalApi.decline(usageId)
      window.location.href = result.returnUrl
    } catch (failure) {
      setError(failure instanceof ApiFailure ? failure.message : '처리에 실패했습니다')
    }
  }
  const submit = (event: FormEvent) => {
    event.preventDefault()
    void decide('approve')
  }

  const { merchant, amount, balance, status, rejectReason, memberName, returnUrl } = view.data
  return (
    <MallFrame>
      <form className="pad fieldset" onSubmit={submit}>
        <p className="hello">결제 승인</p>
        <p className="info">{memberName} 님의 스포츠상품권으로 결제합니다.</p>
        <div className="amount">
          <span>가맹점</span>
          <b>{merchant}</b>
        </div>
        <div className="amount">
          <span>결제 금액</span>
          <b>{won(amount)}원</b>
        </div>
        <div className="amount">
          <span>상품권 잔액</span>
          <b>{won(balance)}P</b>
        </div>

        {status === 'pending' ? (
          <>
            <label>결제 비밀번호 (6자리)</label>
            <input type="password" inputMode="numeric" maxLength={6} value={payPassword} onChange={(event) => setPayPassword(event.target.value)} autoFocus />
            {error && <p className="err">{error}</p>}
            <button className="primary" disabled={payPassword.length !== 6}>
              {won(amount)}원 승인
            </button>
            <button type="button" className="ghost" onClick={() => void decide('decline')}>
              거절
            </button>
            <p className="hint">모의 결제 비밀번호: 123456</p>
          </>
        ) : (
          <>
            <p className="status">{status === 'rejected' ? REJECT_TEXT[rejectReason ?? 'declined'] : STATUS_TEXT[status]}</p>
            <button type="button" className="primary" onClick={() => (window.location.href = returnUrl)}>
              {merchant}로 돌아가기
            </button>
          </>
        )}
      </form>
    </MallFrame>
  )
}
