// 제안서에 없음 · 운영자 로그인
import { useState, type FormEvent } from 'react'
import { adminApi, messageOf } from '../api'

export function AdminLoginPage({ onDone }: { onDone: () => void }) {
  const [adminId, setAdminId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await adminApi.login(adminId, password)
      onDone()
    } catch (failure) {
      setError(messageOf(failure))
    }
  }

  return (
    <form className="login-box panel fld" onSubmit={submit}>
      <img src="/images/keepay-logo.png" alt="킵페이 로고" style={{ width: 130, marginBottom: 8 }} />
      <h1>운영자 로그인</h1>
      <p className="hint">가입자 관리 · 가입 취소</p>
      <label htmlFor="admin-id">아이디</label>
      <input id="admin-id" value={adminId} onChange={(event) => setAdminId(event.target.value)} autoFocus />
      <label htmlFor="admin-password">비밀번호</label>
      <input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      {error && <p className="err">{error}</p>}
      <button className="btn" style={{ marginTop: 18 }} disabled={!adminId || !password}>
        로그인
      </button>
      <p className="hint">로컬 계정: admin / admin1234</p>
    </form>
  )
}
