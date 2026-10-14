import { ErrorCode } from '../../utils/error-code.js'
import { AppError } from '../../utils/error.js'
import type { SettingName, Settings } from './admin.type.js'

export interface AdminService {
  login(adminId: string, password: string): void
  settings(): Settings
  updateSettings(patch: Partial<Settings>): Settings
  consume(name: SettingName): boolean // 켜져 있으면 끄고 true
}

export function createAdminService(dependencies: { adminId: string; adminPassword: string }): AdminService {
  // 실행 중에만 바뀌는 설정이라 저장소 없이 여기 둠
  let settings: Settings = { dropNextUseResponse: false, failNextCancel: false }

  return {
    login(adminId, password) {
      validateAccount(adminId, password)
    },

    settings: () => ({ ...settings }),

    updateSettings(patch) {
      settings = { ...settings, ...patch }
      return { ...settings }
    },

    consume(name) {
      if (!settings[name]) return false
      settings = { ...settings, [name]: false }
      return true
    },
  }

  function validateAccount(adminId: string, password: string): void {
    if (adminId !== dependencies.adminId || password !== dependencies.adminPassword) throw new AppError(ErrorCode.LOGIN_FAILED)
  }
}
