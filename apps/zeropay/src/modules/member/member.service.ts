import { LINK_CODE_PARAM, LINK_CODE_TTL_MS, type LinkExchangeResponse } from '@point-payment/contract'
import { ErrorCode } from '../../utils/error-code.js'
import { AppError } from '../../utils/error.js'
import { newCode } from '../../utils/id.js'
import type { MemberRepository } from './member.repository.js'
import type { LinkCode, Member, MemberView } from './member.type.js'

export interface MemberService {
  login(loginId: string, password: string): MemberView
  get(memberId: string): MemberView
  list(): MemberView[]
  issueLinkUrl(memberId: string): string // 일회용 값을 붙인 킵페이 첫 화면 주소
  exchange(code: string): LinkExchangeResponse
}

export function createMemberService(dependencies: { members: MemberRepository; keepayUrl: string; now?: () => number }): MemberService {
  const { members, keepayUrl, now = Date.now } = dependencies

  return {
    login(loginId, password) {
      const member = members.findByLoginId(loginId)
      validatePassword(member, password)
      return toView(member)
    },

    get: (memberId) => toView(getMember(memberId)),

    list: () => members.list().map(toView),

    issueLinkUrl(memberId) {
      const code = newCode()
      members.saveLinkCode({ code, memberId, expiresAt: now() + LINK_CODE_TTL_MS, used: false })
      const url = new URL('/', keepayUrl)
      url.searchParams.set(LINK_CODE_PARAM, code)
      return url.toString()
    },

    exchange(code) {
      const linkCode = getLinkCode(code)
      validateLinkCodeUsable(linkCode)
      members.markLinkCodeUsed(code)
      const member = getMember(linkCode.memberId)
      return { memberId: member.id, name: member.name }
    },
  }

  function getMember(memberId: string): Member {
    const member = members.findById(memberId)
    if (!member) throw new AppError(ErrorCode.MEMBER_NOT_FOUND)
    return member
  }

  function getLinkCode(code: string): LinkCode {
    const linkCode = members.findLinkCode(code)
    if (!linkCode) throw new AppError(ErrorCode.LINK_CODE_NOT_FOUND)
    return linkCode
  }

  // 아이디가 없을 때와 비밀번호가 틀릴 때 같은 오류 (어떤 아이디가 있는지 알려 주지 않음)
  function validatePassword(member: Member | undefined, password: string): asserts member is Member {
    if (!member || member.password !== password) throw new AppError(ErrorCode.LOGIN_FAILED)
  }

  function validateLinkCodeUsable(linkCode: LinkCode): void {
    if (linkCode.used) throw new AppError(ErrorCode.LINK_CODE_USED)
    if (now() > linkCode.expiresAt) throw new AppError(ErrorCode.LINK_CODE_EXPIRED)
  }
}

function toView({ id, name, birth, phone }: MemberView): MemberView {
  return { id, name, birth, phone }
}
