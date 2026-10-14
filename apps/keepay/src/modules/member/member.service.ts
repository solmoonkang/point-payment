import { randomUUID } from 'node:crypto'
import type { ZeropayClient } from '../../infrastructure/zeropay/index.js'
import { ErrorCode } from '../../utils/error-code.js'
import { AppError } from '../../utils/error.js'
import type { MemberRepository } from './member.repository.js'
import type { Agreements, Member } from './member.type.js'

export interface SignUpInput {
  name: string
  birth: string
  phone: string
  email: string
  agreements: Agreements
}

export interface MemberService {
  signUp(input: SignUpInput): Promise<Member> // 제로페이 회원이 아니면 zeropayMemberId 가 null (카드 결제만 가능)
  get(memberId: string): Member
}

export function createMemberService(dependencies: { members: MemberRepository; zeropay: ZeropayClient; now?: () => Date }): MemberService {
  const { members, zeropay, now = () => new Date() } = dependencies

  return {
    async signUp(input) {
      validateRequiredAgreements(input.agreements)
      const zeropayMemberId = await zeropay.verifyMember({ name: input.name, birth: input.birth, phone: input.phone })
      const member = toMember({ ...input, zeropayMemberId }, findPrevious(zeropayMemberId))
      members.save(member)
      return member
    },

    get(memberId) {
      const member = members.findById(memberId)
      if (!member) throw new AppError(ErrorCode.MEMBER_NOT_FOUND)
      return member
    },
  }

  function validateRequiredAgreements(agreements: Agreements): void {
    if (!agreements.terms || !agreements.privacy || !agreements.thirdParty) throw new AppError(ErrorCode.REQUIRED_TERMS_NOT_AGREED)
  }

  // 제로페이 회원 하나 = 킵페이 회원 하나 (같은 제로페이 회원이 다시 가입하면 새로 만들지 않고 정보만 고침)
  function findPrevious(zeropayMemberId: string | null): Member | undefined {
    return zeropayMemberId ? members.findByZeropayMemberId(zeropayMemberId) : undefined
  }

  function toMember(input: SignUpInput & { zeropayMemberId: string | null }, previous: Member | undefined): Member {
    return { ...input, id: previous?.id ?? `km_${randomUUID().slice(0, 8)}`, createdAt: previous?.createdAt ?? now().toISOString() }
  }
}
