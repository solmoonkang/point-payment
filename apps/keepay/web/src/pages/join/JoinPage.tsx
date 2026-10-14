// 예시 2~6 가입 단계. 스포츠활동 보험은 그림이 없어 같은 단계에서 헬스장 검색만 뺌
import { useEffect, useState } from 'react'
import { Link, useParams } from 'wouter'
import { productApi, sessionApi, useLoad, type Agreements, type Customer, type Gym } from '../../api'
import { SiteFrame } from '../../components/SiteFrame'
import { CustomerStep } from './CustomerStep'
import { GymStep } from './GymStep'
import { PayStep } from './PayStep'
import { ProductStep } from './ProductStep'
import { TermsStep } from './TermsStep'

export function JoinPage() {
  const { productId = '' } = useParams<{ productId: string }>()
  const product = useLoad(() => productApi.get(productId), [productId])
  const session = useLoad(sessionApi.get, [])
  const [step, setStep] = useState(0)
  const [planId, setPlanId] = useState('')
  const [agreements, setAgreements] = useState<Agreements>({ terms: false, privacy: false, thirdParty: false, marketing: false })
  const [customer, setCustomer] = useState<Customer>({ name: '', birth: '', phone: '', email: '' })
  const [gym, setGym] = useState<Gym | null>(null)

  useEffect(() => setStep(0), [productId])

  useEffect(() => {
    const member = session.data?.member
    if (member) setCustomer({ name: member.name, birth: member.birth, phone: member.phone, email: member.email })
  }, [session.data])

  if (!product.data) return <SiteFrame><div className="body"><div className="col">{product.error ? <p className="err">{product.error.message}</p> : null}</div></div></SiteFrame>

  const current = product.data
  const plan = current.plans.find((item) => item.id === planId) ?? current.plans[0]!
  const steps = ['상품 확인', '약관 동의', '고객정보', ...(current.needsGym ? ['헬스장 검색'] : []), '결제']
  const next = () => setStep(step + 1)
  const prev = () => setStep(step - 1)

  return (
    <SiteFrame>
      <div className="body" style={{ paddingBottom: 44 }}>
        <div className="col">
          <Link href="/" className="back">← 보험 선택으로</Link>
          <h4>{current.name} 가입</h4>
          <div className="steps">
            {steps.map((name, index) => (
              <span key={name} className={index < step ? 'done' : index === step ? 'now' : ''}>
                <b>{index + 1}</b>
                {name}
              </span>
            ))}
          </div>
          {steps[step] === '상품 확인' && <ProductStep product={current} selected={plan.id} onSelect={setPlanId} onNext={next} />}
          {steps[step] === '약관 동의' && <TermsStep agreements={agreements} onChange={setAgreements} onNext={next} />}
          {steps[step] === '고객정보' && <CustomerStep customer={customer} agreements={agreements} onChange={setCustomer} onPrev={prev} onNext={() => (session.reload(), next())} />}
          {steps[step] === '헬스장 검색' && <GymStep selected={gym} onSelect={setGym} onPrev={prev} onNext={next} />}
          {steps[step] === '결제' && <PayStep product={current} plan={plan} gym={current.needsGym ? gym : null} customerName={customer.name} zeropayLinked={session.data?.zeropayLinked ?? false} onPrev={prev} />}
        </div>
      </div>
    </SiteFrame>
  )
}
