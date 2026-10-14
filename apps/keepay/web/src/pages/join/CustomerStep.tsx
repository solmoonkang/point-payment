// 예시 4 가입 3단계 - 고객정보. 「다음」에서 킵페이 회원으로 저장 (제로페이 회원 번호는 서버가 세션에서 붙임)
import { useState, type FormEvent } from 'react'
import { ApiFailure, memberApi, messageOf, type Agreements, type Customer } from '../../api'

export function CustomerStep({ customer, agreements, onChange, onPrev, onNext }: { customer: Customer; agreements: Agreements; onChange: (next: Customer) => void; onPrev: () => void; onNext: () => void }) {
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const field = (key: keyof Customer) => ({
    value: customer[key],
    'aria-invalid': Boolean(fieldErrors[key]),
    'aria-describedby': fieldErrors[key] ? `${key}-error` : undefined,
    onChange: (event: { target: { value: string } }) => {
      onChange({ ...customer, [key]: event.target.value })
      setFieldErrors({ ...fieldErrors, [key]: '' })
    },
  })
  const fieldError = (key: keyof Customer) => fieldErrors[key] && <p id={`${key}-error`} className="err">{fieldErrors[key]}</p>

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setFieldErrors({})
    try {
      await memberApi.signUp({ ...customer, agreements })
      onNext()
    } catch (failure) {
      const fields = failure instanceof ApiFailure ? failure.fields : {}
      if (Object.keys(fields).length > 0) setFieldErrors(fields)
      else setError(messageOf(failure))
      setBusy(false)
    }
  }

  return (
    <form className="panel fld" onSubmit={submit} noValidate>
      <h5 style={{ marginBottom: 0 }}>고객정보</h5>
      <label htmlFor="name">이름</label>
      <input id="name" autoComplete="name" placeholder="홍길동" {...field('name')} />
      {fieldError('name')}
      <label htmlFor="birth">생년월일 (8자리)</label>
      <input id="birth" inputMode="numeric" maxLength={8} placeholder="19910712" {...field('birth')} />
      {fieldError('birth')}
      <label htmlFor="phone">휴대폰번호</label>
      <input id="phone" inputMode="numeric" maxLength={11} placeholder="01012345678" autoComplete="tel" {...field('phone')} />
      {fieldError('phone')}
      <label htmlFor="email">이메일</label>
      <input id="email" type="email" autoComplete="email" {...field('email')} />
      {fieldError('email')}
      {error && <p className="err">{error}</p>}
      <div className="row2">
        <button type="button" className="btn ghost" style={{ border: 0 }} onClick={onPrev}>
          이전
        </button>
        <button className="btn" style={{ border: 0 }} disabled={busy}>
          다음
        </button>
      </div>
    </form>
  )
}
