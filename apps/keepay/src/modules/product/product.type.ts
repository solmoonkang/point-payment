export interface Plan {
  id: string
  name: string
  price: number
  coverages: string[]
}

export interface Product {
  id: 'gym' | 'sports'
  name: string
  needsGym: boolean // 가입 단계에 헬스장 검색이 있는지
  plans: Plan[]
}

export interface Gym {
  id: string
  name: string
  address: string
  tag: string
}
