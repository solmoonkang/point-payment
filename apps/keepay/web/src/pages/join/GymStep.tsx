// 예시 5 가입 4단계 - 헬스장 검색
import { useState } from 'react'
import { productApi, useLoad, type Gym } from '../../api'

export function GymStep({ selected, onSelect, onPrev, onNext }: { selected: Gym | null; onSelect: (gym: Gym) => void; onPrev: () => void; onNext: () => void }) {
  const [query, setQuery] = useState('')
  const gyms = useLoad(() => productApi.gyms(query), [query])

  return (
    <div className="panel">
      <h5>헬스장 검색</h5>
      <p className="hint">이용료를 결제한 헬스장을 검색해 선택해주세요.</p>
      <label className="search">
        <svg className="i">
          <use href="#i-search" />
        </svg>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="헬스장 이름 또는 지역 검색 (예: 강남, 부산)" aria-label="헬스장 검색" />
      </label>
      <div className="gyms">
        {gyms.data?.gyms.map((gym) => (
          <button type="button" key={gym.id} className={`gym ${selected?.id === gym.id ? 'sel' : ''}`} onClick={() => onSelect(gym)} aria-pressed={selected?.id === gym.id}>
            <span className="ic">
              <svg className="i">
                <use href="#i-building" />
              </svg>
            </span>
            <span>
              <b>{gym.name}</b>
              <small>{gym.address}</small>
            </span>
            <span className="bd">{gym.tag}</span>
          </button>
        ))}
        {gyms.data?.gyms.length === 0 && <p className="hint">검색 결과가 없습니다</p>}
      </div>
      <div className="row2" style={{ marginTop: 8 }}>
        <button type="button" className="btn ghost" onClick={onPrev}>
          이전
        </button>
        <button type="button" className="btn" disabled={!selected} onClick={onNext}>
          선택 완료
        </button>
      </div>
    </div>
  )
}
