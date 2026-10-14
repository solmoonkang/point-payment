import type { Member } from './member.type.js'

export interface MemberRepository {
  findById(id: string): Member | undefined
  findByLoginId(loginId: string): Member | undefined
  findByIdentity(identity: Pick<Member, 'name' | 'birth' | 'phone'>): Member | undefined
  list(): Member[]
}

// 회원가입 화면은 만들지 않아 처음부터 두 명을 넣어 둠 (아이디와 비밀번호가 같음)
const SEED_MEMBERS: Member[] = [
  { id: 'zm_0001', loginId: 'customer1111', password: 'customer1111', name: '홍길동', birth: '19910712', phone: '01012345678' },
  { id: 'zm_0002', loginId: 'customer2222', password: 'customer2222', name: '김영희', birth: '19880203', phone: '01098765432' },
]

export function createMemoryMemberRepository(): MemberRepository {
  // ponytail: 메모리 보관이라 서버를 다시 켜면 처음 상태로, 오래 남겨야 하면 파일 · DB 로
  const members = new Map(SEED_MEMBERS.map((member) => [member.id, { ...member }]))

  return {
    findById: (id) => members.get(id),
    findByLoginId: (loginId) => [...members.values()].find((member) => member.loginId === loginId),
    findByIdentity: ({ name, birth, phone }) => [...members.values()].find((member) => member.name === name && member.birth === birth && member.phone === phone),
    list: () => [...members.values()],
  }
}
