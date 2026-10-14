export interface Member {
  id: string // 킵페이에 넘기는 회원 번호
  loginId: string
  password: string // ponytail: 로컬 모의라 평문 보관, 실제라면 해시
  payPassword: string // 결제 승인 때 확인하는 6자리
  name: string
  birth: string // YYYYMMDD
  phone: string
}

// 「킵페이 보험」 링크에 붙여 회원을 킵페이에 넘기는 일회용 값
export interface LinkCode {
  code: string
  memberId: string
  expiresAt: number
  used: boolean
}

export type MemberView = Pick<Member, 'id' | 'name' | 'birth' | 'phone'>
