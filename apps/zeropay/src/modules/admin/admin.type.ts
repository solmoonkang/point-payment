// 가맹점이 실패를 제대로 다루는지 보려고 일부러 일으키는 실패 — 켜 두면 다음 한 번만 일어나고 꺼짐
export interface Settings {
  dropNextUseResponse: boolean // 사용 요청을 처리하되 응답하지 않음
  failNextCancel: boolean // 사용 취소를 처리하지 않고 일시 장애로 응답
}

export type SettingName = keyof Settings
