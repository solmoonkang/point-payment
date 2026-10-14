import type { MemberVerifyRequest, MemberVerifyResponse } from '@point-payment/contract'
import { ErrorCode } from '../../utils/error-code.js'
import { AppError } from '../../utils/error.js'
import type { MemberRepository } from './member.repository.js'
import type { Member, MemberView } from './member.type.js'

export interface MemberService {
  login(loginId: string, password: string): MemberView
  get(memberId: string): MemberView
  list(): MemberView[]
  verify(identity: MemberVerifyRequest): MemberVerifyResponse
}

export function createMemberService(dependencies: { members: MemberRepository }): MemberService {
  const { members } = dependencies

  return {
    login(loginId, password) {
      const member = members.findByLoginId(loginId)
      validatePassword(member, password)
      return toView(member)
    },

    get: (memberId) => toView(getMember(memberId)),

    list: () => members.list().map(toView),

    verify(identity) {
      const member = members.findByIdentity(identity)
      if (!member) throw new AppError(ErrorCode.MEMBER_NOT_MATCHED)
      return { memberId: member.id }
    },
  }

  function getMember(memberId: string): Member {
    const member = members.findById(memberId)
    if (!member) throw new AppError(ErrorCode.MEMBER_NOT_FOUND)
    return member
  }

  // 아이디가 없을 때와 비밀번호가 틀릴 때 같은 오류 (어떤 아이디가 있는지 알려 주지 않음)
  function validatePassword(member: Member | undefined, password: string): asserts member is Member {
    if (!member || member.password !== password) throw new AppError(ErrorCode.LOGIN_FAILED)
  }

}

function toView({ id, name, birth, phone }: MemberView): MemberView {
  return { id, name, birth, phone }
}
