// 예시 3 의 네 줄 (앞 셋이 [필수])
export interface Agreements {
  terms: boolean
  privacy: boolean
  thirdParty: boolean
  marketing: boolean
}

export interface Member {
  id: string
  zeropayMemberId: string | null // 일치하는 제로페이 회원이 없으면 null (카드 결제만 가능)
  name: string
  birth: string // YYYYMMDD
  phone: string
  email: string
  agreements: Agreements
  createdAt: string
}
