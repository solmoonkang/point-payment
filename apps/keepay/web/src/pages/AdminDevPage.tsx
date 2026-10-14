// 제안서에 없음 · 개발용 설정 (킵페이 저장소의 /admin/dev 와 같은 자리)
import { adminApi, useLoad } from '../api'
import { AdminFrame } from '../components/AdminFrame'

export function AdminDevPage() {
  const dev = useLoad(adminApi.dev, [])

  const toggle = async (pgFailNext: boolean) => {
    await adminApi.updateDev({ pgFailNext })
    dev.reload()
  }

  return (
    <AdminFrame current="/admin/dev" crumb={['개발용 설정', 'PG']}>
      <label className="toggle">
        <input type="checkbox" checked={dev.data?.pgFailNext ?? false} onChange={(event) => void toggle(event.target.checked)} />
        <span>
          다음 PG 결제를 실패시킴
          <small>상품권을 먼저 쓴 결제라면 킵페이가 제로페이에 사용 취소를 보내 복원하는지 확인. 한 번 일어나면 저절로 꺼짐</small>
        </span>
      </label>
    </AdminFrame>
  )
}
