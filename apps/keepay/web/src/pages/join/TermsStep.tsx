// 예시 3 가입 2단계 - 약관 동의
import type { KeyboardEvent } from 'react'
import type { Agreements } from '../../api'

const ITEMS: { key: keyof Agreements; required: boolean; label: string }[] = [
  { key: 'terms', required: true, label: '보험약관 및 상품설명서 확인' },
  { key: 'privacy', required: true, label: '개인(신용)정보 수집·이용 동의' },
  { key: 'thirdParty', required: true, label: '개인(신용)정보 제3자 제공 동의' },
  { key: 'marketing', required: false, label: '마케팅 정보 수신 동의' },
]

// 그림의 줄(div)을 키보드로도 누를 수 있게 (Space · Enter)
const pressable = (checked: boolean, onToggle: () => void) => ({
  role: 'checkbox',
  'aria-checked': checked,
  tabIndex: 0,
  onClick: onToggle,
  onKeyDown: (event: KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      onToggle()
    }
  },
})

export function TermsStep({ agreements, onChange, onNext }: { agreements: Agreements; onChange: (next: Agreements) => void; onNext: () => void }) {
  const all = ITEMS.every((item) => agreements[item.key])
  const requiredDone = ITEMS.filter((item) => item.required).every((item) => agreements[item.key])
  const setAll = (value: boolean) => onChange({ terms: value, privacy: value, thirdParty: value, marketing: value })

  return (
    <div className="panel">
      <h5>약관 동의</h5>
      <div className={`all ${all ? 'sel' : ''}`} {...pressable(all, () => setAll(!all))}>
        <span className={`dot ${all ? '' : 'off'}`}>✓</span>전체 동의하기
      </div>
      <div className="terms">
        {ITEMS.map((item) => (
          <div key={item.key} {...pressable(agreements[item.key], () => onChange({ ...agreements, [item.key]: !agreements[item.key] }))}>
            <span className={`dot ${agreements[item.key] ? '' : 'off'}`}>✓</span>
            <span className={item.required ? 'req' : 'optn'}>{item.required ? '[필수]' : '[선택]'}</span>
            {item.label}
            <span className="chev">⌄</span>
          </div>
        ))}
      </div>
      <button className="btn" style={{ marginTop: 18 }} disabled={!requiredDone} onClick={onNext}>
        다음
      </button>
    </div>
  )
}
