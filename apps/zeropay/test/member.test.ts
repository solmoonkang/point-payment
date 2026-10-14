import { describe, expect, it } from 'vitest'
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

function setup() {
  return { member: createMemberService({ members: createMemoryMemberRepository() }) }
}

describe('회원 확인', () => {
  it('이름 · 생년월일 · 휴대폰번호가 모두 맞으면 회원 번호', () => {
    const { member } = setup()
    expect(member.verify({ name: '홍길동', birth: '19910712', phone: '01012345678' })).toEqual({ memberId: 'zm_0001' })
  })
  it('하나라도 다르면 MEMBER_NOT_MATCHED', () => {
    const { member } = setup()
    expect(thrown(() => member.verify({ name: '홍길동', birth: '19910713', phone: '01012345678' }))).toBe('MEMBER_NOT_MATCHED')
  })
})

describe('로그인', () => {
  it('비밀번호가 틀려도 없는 아이디여도 같은 오류 (어떤 아이디가 있는지 알려 주지 않음)', () => {
    const { member } = setup()
    expect(thrown(() => member.login('customer1111', 'x'))).toBe('LOGIN_FAILED')
    expect(thrown(() => member.login('nobody', 'customer1111'))).toBe('LOGIN_FAILED')
  })
})
