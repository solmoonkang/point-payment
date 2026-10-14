import { describe, expect, it } from 'vitest'
import { LINK_CODE_TTL_MS } from '@point-payment/contract'
import { createMemoryMemberRepository } from '../src/modules/member/member.repository.js'
import { createMemberService } from '../src/modules/member/member.service.js'

// 던진 오류의 이름 (ErrorCode 의 키)
function thrown(run: () => unknown): string | undefined {
  try {
    run()
  } catch (error) {
    return (error as Error).name
  }
  return undefined
}

// 시각을 손으로 넘길 수 있는 회원 서비스
function setup() {
  let clock = Date.parse('2026-10-14T03:00:00.000Z')
  const member = createMemberService({ members: createMemoryMemberRepository(), keepayUrl: 'http://localhost:5200', now: () => clock })
  const codeOf = (url: string) => new URL(url).searchParams.get('code') ?? ''
  return { member, codeOf, pass: (ms: number) => (clock += ms) }
}

describe('일회용 값', () => {
  it('킵페이 첫 화면 주소에 실리고, 회원 번호로 한 번 바뀜', () => {
    const { member, codeOf } = setup()
    const url = member.issueLinkUrl('zm_hong0001')
    expect(url.startsWith('http://localhost:5200/?code=')).toBe(true)
    expect(member.exchange(codeOf(url))).toEqual({ memberId: 'zm_hong0001', name: '홍길동' })
  })
  it('두 번째 교환은 expired', () => {
    const { member, codeOf } = setup()
    const code = codeOf(member.issueLinkUrl('zm_hong0001'))
    member.exchange(code)
    expect(thrown(() => member.exchange(code))).toBe('LINK_CODE_USED')
  })
  it('10분이 지나면 expired', () => {
    const { member, codeOf, pass } = setup()
    const code = codeOf(member.issueLinkUrl('zm_hong0001'))
    pass(LINK_CODE_TTL_MS + 1)
    expect(thrown(() => member.exchange(code))).toBe('LINK_CODE_EXPIRED')
  })
})

describe('로그인', () => {
  it('비밀번호가 틀려도 없는 아이디여도 같은 오류 (어떤 아이디가 있는지 알려 주지 않음)', () => {
    const { member } = setup()
    expect(thrown(() => member.login('hong', 'x'))).toBe('LOGIN_FAILED')
    expect(thrown(() => member.login('nobody', '1234'))).toBe('LOGIN_FAILED')
  })
})
