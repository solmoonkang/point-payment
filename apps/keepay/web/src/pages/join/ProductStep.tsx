// 예시 2 가입 1단계 - 상품 확인
import { won, type Product } from '../../api'

export function ProductStep({ product, selected, onSelect, onNext }: { product: Product; selected: string; onSelect: (planId: string) => void; onNext: () => void }) {
  return (
    <div className="panel">
      <h5>상품 확인</h5>
      {product.plans.map((plan) => (
        <button type="button" key={plan.id} className={`opt ${plan.id === selected ? 'sel' : ''}`} onClick={() => onSelect(plan.id)} aria-pressed={plan.id === selected}>
          <i className="radio" />
          <b>{plan.name}</b>
          <div className="pr">
            {won(plan.price)}
            <small>원</small>
          </div>
          <ul>
            {plan.coverages.map((coverage) => (
              <li key={coverage}>
                <svg className="i">
                  <use href="#i-shield" />
                </svg>
                {coverage}
              </li>
            ))}
          </ul>
        </button>
      ))}
      <button className="btn" style={{ marginTop: 18 }} onClick={onNext}>
        다음
      </button>
    </div>
  )
}
