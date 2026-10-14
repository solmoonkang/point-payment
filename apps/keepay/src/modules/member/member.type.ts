// 예시 3 의 네 줄 (앞 셋이 [필수])
export interface Agreements {
  terms: boolean
  privacy: boolean
  thirdParty: boolean
  marketing: boolean
}

export interface Member {
  id: string
  zeropayMemberId: string | null // 제로페이에서 넘어오지 않았으면 null
  name: string
  birth: string // YYYYMMDD
  phone: string
  email: string
  agreements: Agreements
  createdAt: string
}
