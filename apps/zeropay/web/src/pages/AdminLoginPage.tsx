// 제안서에 없음 · 운영자 로그인
import { useState, type FormEvent } from 'react'
import { ApiFailure, adminApi } from '../api'

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
      setError(failure instanceof ApiFailure ? failure.message : '로그인에 실패했습니다')
    }
  }

  return (
    <form className="login-box fieldset" onSubmit={submit}>
      <h1>제로페이 운영자</h1>
      <p className="hint">상품권 지급 · 내역 · 오류 상황 설정</p>
      <label>아이디</label>
      <input value={adminId} onChange={(event) => setAdminId(event.target.value)} autoFocus />
      <label>비밀번호</label>
      <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      {error && <p className="err">{error}</p>}
      <button className="primary" disabled={!adminId || !password}>
        로그인
      </button>
    </form>
  )
}
