import type { Member } from './member.type.js'

export interface MemberRepository {
  save(member: Member): void
  findById(id: string): Member | undefined
  findByZeropayMemberId(zeropayMemberId: string): Member | undefined
}

export function createMemoryMemberRepository(): MemberRepository {
  // ponytail: 메모리 보관이라 서버를 다시 켜면 비워짐, 오래 남겨야 하면 파일 · DB 로
  const members = new Map<string, Member>()

  return {
    save: (member) => void members.set(member.id, { ...member }),
    findById: (id) => {
      const member = members.get(id)
      return member && { ...member }
    },
    findByZeropayMemberId: (zeropayMemberId) => {
      const member = [...members.values()].find((item) => item.zeropayMemberId === zeropayMemberId)
      return member && { ...member }
    },
  }
}
