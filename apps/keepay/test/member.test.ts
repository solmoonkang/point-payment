import { describe, expect, it } from 'vitest'
import { createMemoryZeropay } from '../src/infrastructure/zeropay/memory.js'
import { createMemoryMemberRepository } from '../src/modules/member/member.repository.js'
import { createMemberService } from '../src/modules/member/member.service.js'

const agreements = { terms: true, privacy: true, thirdParty: true, marketing: false }
const kim = { name: '김영희', birth: '19880203', phone: '01098765432', email: 'kim@example.com', agreements }

function setup() {
  const zeropay = createMemoryZeropay()
  zeropay.addMember('zm_0002', { name: '김영희', birth: '19880203', phone: '01098765432' })
  return createMemberService({ members: createMemoryMemberRepository(), zeropay })
}

describe('가입 때 제로페이 회원 확인', () => {
  it('고객정보가 제로페이 회원과 맞으면 제로페이 회원 번호를 함께 저장', async () => {
    expect((await setup().signUp(kim)).zeropayMemberId).toBe('zm_0002')
  })
  it('맞는 회원이 없으면 null (카드 결제만 가능)', async () => {
    expect((await setup().signUp({ ...kim, phone: '01000000000' })).zeropayMemberId).toBeNull()
  })
})
