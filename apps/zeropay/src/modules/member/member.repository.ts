import type { LinkCode, Member } from './member.type.js'

export interface MemberRepository {
  findById(id: string): Member | undefined
  findByLoginId(loginId: string): Member | undefined
  list(): Member[]
  saveLinkCode(linkCode: LinkCode): void
  findLinkCode(code: string): LinkCode | undefined
  markLinkCodeUsed(code: string): void
}

// 회원가입 화면은 만들지 않아 처음부터 둘을 넣어 둠
const SEED_MEMBERS: Member[] = [
  { id: 'zm_hong0001', loginId: 'hong', password: '1234', payPassword: '123456', name: '홍길동', birth: '19910712', phone: '01012345678' },
  { id: 'zm_kim0002', loginId: 'kim', password: '1234', payPassword: '123456', name: '김영희', birth: '19880203', phone: '01098765432' },
]

export function createMemoryMemberRepository(): MemberRepository {
  // ponytail: 메모리 보관이라 서버를 다시 켜면 처음 상태로, 오래 남겨야 하면 파일 · DB 로
  const members = new Map(SEED_MEMBERS.map((member) => [member.id, { ...member }]))
  const linkCodes = new Map<string, LinkCode>()

  return {
    findById: (id) => members.get(id),
    findByLoginId: (loginId) => [...members.values()].find((member) => member.loginId === loginId),
    list: () => [...members.values()],
    saveLinkCode: (linkCode) => void linkCodes.set(linkCode.code, { ...linkCode }),
    findLinkCode: (code) => linkCodes.get(code),
    markLinkCodeUsed(code) {
      const linkCode = linkCodes.get(code)
      if (linkCode) linkCode.used = true
    },
  }
}
