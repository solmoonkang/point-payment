// 문구는 튼튼몰 로그인 화면 그대로
import { useState, type FormEvent } from 'react'
import { ApiFailure, memberApi } from '../api'

export function LoginForm({ onDone }: { onDone: () => void }) {
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await memberApi.login(loginId, password)
      onDone()
    } catch (failure) {
      setError(failure instanceof ApiFailure ? failure.message : '로그인에 실패했습니다')
    }
  }

  return (
    <form className="pad fieldset" onSubmit={submit}>
      <h1 className="hello">
        안녕하세요.
        <br />
        제로페이몰입니다.
      </h1>
      <p className="info">ⓘ 제로페이몰 바우처 포인트를 배부받은 고객만 가입 가능합니다.</p>
      <label>아이디</label>
      <input value={loginId} onChange={(event) => setLoginId(event.target.value)} placeholder="아이디 입력" autoFocus />
      <label>비밀번호</label>
      <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호 입력" />
      {error && <p className="err">{error}</p>}
      <button className="primary" disabled={!loginId || !password}>
        로그인
      </button>
      <p className="hint">모의 계정: hong / 1234 · kim / 1234</p>
    </form>
  )
}
