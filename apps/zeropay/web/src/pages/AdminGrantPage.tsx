// 제안서에 없음 · 상품권 지급 (튼튼머니를 상품권으로 바꿔 둔 상태를 흉내)
import { useState, type FormEvent } from 'react'
import { ApiFailure, adminApi, useLoad, won } from '../api'
import { AdminFrame } from '../components/AdminFrame'

export function AdminGrantPage() {
  const members = useLoad(adminApi.members, [])
  // 만료일 기본값은 튼튼머니 전환 기간이 끝나는 날
  const [form, setForm] = useState({ memberId: '', amount: '35000', expiresOn: '2026-12-20', memo: '튼튼머니 전환' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage('')
    setError('')
    try {
      const memberId = form.memberId || members.data?.members[0]?.id || ''
      await adminApi.grant({ memberId, amount: Number(form.amount), expiresOn: form.expiresOn, memo: form.memo })
      const name = members.data?.members.find((member) => member.id === memberId)?.name
      setMessage(`${name} 님에게 ${won(Number(form.amount))}P 를 지급했습니다`)
    } catch (failure) {
      setError(failure instanceof ApiFailure ? failure.message : '지급에 실패했습니다')
    }
  }

  return (
    <AdminFrame current="/admin/grant" crumb="상품권 지급">
      <form className="form" onSubmit={submit}>
        <label>회원</label>
        <select value={form.memberId || members.data?.members[0]?.id || ''} onChange={(event) => setForm({ ...form, memberId: event.target.value })}>
          {members.data?.members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name} ({member.phone}) · {member.id}
            </option>
          ))}
        </select>
        <label>금액 (P)</label>
        <input type="number" min={1} value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
        <label>만료일</label>
        <input type="date" value={form.expiresOn} onChange={(event) => setForm({ ...form, expiresOn: event.target.value })} />
        <label>메모</label>
        <input value={form.memo} onChange={(event) => setForm({ ...form, memo: event.target.value })} />
        <button className="go">지급</button>
        {message && <p className="done">{message}</p>}
        {error && <p className="err">{error}</p>}
      </form>
    </AdminFrame>
  )
}
