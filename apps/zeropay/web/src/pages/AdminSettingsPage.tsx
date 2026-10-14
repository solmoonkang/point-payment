// 제안서에 없음 · 오류 상황 설정
import { adminApi, useLoad, type Settings } from '../api'
import { AdminFrame } from '../components/AdminFrame'

const ITEMS: { name: keyof Settings; title: string; detail: string }[] = [
  { name: 'dropNextUseResponse', title: '다음 사용 요청에 응답하지 않음', detail: '처리는 하고 연결을 끊음. 킵페이가 같은 주문 번호로 다시 보내 한 번만 차감되는지 확인' },
  { name: 'failNextCancel', title: '다음 사용 취소를 실패로 응답', detail: '복원하지 않고 일시 장애로 응답. 킵페이가 「취소 미완료」로 남기고 다시 시도하는지 확인' },
]

export function AdminSettingsPage() {
  const settings = useLoad(adminApi.settings, [])

  const toggle = async (name: keyof Settings, value: boolean) => {
    await adminApi.updateSettings({ [name]: value })
    settings.reload()
  }

  return (
    <AdminFrame current="/admin/settings" crumb="오류 상황 설정">
      {ITEMS.map((item) => (
        <label key={item.name} className="toggle">
          <input type="checkbox" checked={settings.data?.[item.name] ?? false} onChange={(event) => void toggle(item.name, event.target.checked)} />
          <span>
            {item.title}
            <small>{item.detail}</small>
          </span>
        </label>
      ))}
      <p className="hint">켜 두면 다음 한 번만 일어나고 저절로 꺼집니다.</p>
    </AdminFrame>
  )
}
