export interface Member {
  id: string // 킵페이에 넘기는 회원 번호
  loginId: string
  password: string // ponytail: 로컬 전용이라 평문 보관, 실제라면 해시
  name: string
  birth: string // YYYYMMDD
  phone: string
}

export type MemberView = Pick<Member, 'id' | 'name' | 'birth' | 'phone'>
