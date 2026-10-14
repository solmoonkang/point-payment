import type { Gym, Product } from './product.type.js'

export interface ProductRepository {
  products(): Product[]
  gyms(): Gym[]
}

// 값은 제안서 예시 1 · 2 · 5 그대로 (스포츠활동 보험의 플랜별 보장 차이는 제안서에 없어 같게 둠)
const PRODUCTS: Product[] = [
  {
    id: 'gym',
    name: '헬스장 휴폐업 보험',
    needsGym: true,
    plans: [{ id: 'closure', name: '휴폐업 보장', price: 15000, coverages: ['헬스장 폐업 시 잔여 이용료 보상 (최대 100만원)', '30일 이상 휴업 시 보상', '보장기간 1년'] }],
  },
  {
    id: 'sports',
    name: '스포츠활동 보험',
    needsGym: false,
    plans: [
      { id: 'plan10', name: '1만원 플랜', price: 10000, coverages: ['골절 진단비 보장', '상해 입원일당'] },
      { id: 'plan20', name: '2만원 플랜', price: 20000, coverages: ['골절 진단비 보장', '상해 입원일당'] },
    ],
  },
]

const GYMS: Gym[] = [
  { id: 'gym-1', name: '바디핏 휘트니스 강남점', address: '서울 강남구 테헤란로 152', tag: '헬스' },
  { id: 'gym-2', name: '스포애니 역삼점', address: '서울 강남구 역삼로 180', tag: '헬스' },
  { id: 'gym-3', name: '에이블짐 홍대점', address: '서울 마포구 양화로 160', tag: '헬스·PT' },
  { id: 'gym-4', name: '고릴라짐 판교점', address: '경기 성남시 분당구 판교역로 235', tag: '헬스' },
]

export function createFixedProductRepository(): ProductRepository {
  return {
    products: () => PRODUCTS,
    gyms: () => GYMS,
  }
}
