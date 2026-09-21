import type { TelegramWebApp } from './types'

export class TelegramClient {
  private webApp: TelegramWebApp | null = null

  constructor() {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      this.webApp = window.Telegram.WebApp
      this.webApp.ready()
    }
  }

  isTelegramWebApp(): boolean {
    return this.webApp !== null
  }

  getInitData(): string {
    if (!this.webApp) {
      throw new Error('Not running in Telegram WebApp environment')
    }
    return this.webApp.initData
  }

  getInitDataUnsafe() {
    if (!this.webApp) {
      throw new Error('Not running in Telegram WebApp environment')
    }
    return this.webApp.initDataUnsafe
  }

  expandWebApp(): void {
    this.webApp?.expand()
  }

  closeWebApp(): void {
    this.webApp?.close()
  }

  getVersion(): string {
    return this.webApp?.version || 'unknown'
  }

  getPlatform(): string {
    return this.webApp?.platform || 'unknown'
  }

  isExpanded(): boolean {
    return this.webApp?.isExpanded || false
  }

  enableClosingConfirmation(): void {
    this.webApp?.enableClosingConfirmation()
  }

  disableClosingConfirmation(): void {
    this.webApp?.disableClosingConfirmation()
  }
}

export const telegramClient = new TelegramClient()
