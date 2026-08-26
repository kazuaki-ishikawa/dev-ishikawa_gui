import dayjs from 'dayjs'
import type { ErrorResponse } from '@/api/types'

// NOTE: アロー関数で export すると Nuxt の自動インポートスキャナーがパラメータ名を誤ってエクスポートとして認識するため function 宣言を使用
export function formatDateTime(datetime?: string, includeSeconds = true) {
  if (!datetime) {
    return ''
  }
  const formatString = includeSeconds ? 'YYYY/MM/DD HH:mm:ss' : 'YYYY/MM/DD HH:mm'
  return dayjs(datetime).format(formatString)
}
export const formatDate = (datetime?: string) => {
  if (!datetime) {
    return ''
  }
  return dayjs(datetime).format('YYYY/MM/DD')
}

export const errorFormat = (error?: ErrorResponse) => {
  if (!error) {
    return ''
  }

  const { errorCode, errorMessage } = error.data || {}
  const formattedError = [errorCode, errorMessage].filter(Boolean).join('\n')

  return formattedError || error.message
}

const bps = (y?: number | null, unit = 'bps') => {
  if (!y) {
    return `0${unit}`
  }
  if (y >= 1000000) {
    return `${(y / 10 ** 6).toFixed(2)}M${unit}`
  } else if (y >= 1000) {
    return `${(y / 10 ** 3).toFixed(2)}k${unit}`
  } else {
    return `${y}${unit}`
  }
}
export function highchartsUnitFormatter(unit?: string, includeTime = true) {
  return function (this: Highcharts.Point) {
    const date = this.key
      ? dayjs(this.key)
          .tz()
          .format(includeTime ? 'YYYY/MM/DD(ddd) HH:mm' : 'YYYY/MM/DD(ddd)')
      : ''
    const num = bps(this.y, unit)
    return `<span>${date}</span><br/><span style="color:${this.color}">\u25CF</span>${this.series.name}: <b>${num}</b>`
  }
}
export function highchartsFormatter(unit: string) {
  return function (this: Highcharts.Point) {
    const date = this.key ? dayjs(this.key).tz().format('YYYY/MM/DD(ddd) HH:mm') : ''
    return `<span>${date}</span><br/><span style="color:${this.color}">\u25CF</span>${this.series.name}: <b>${this.y}${unit}</b>`
  }
}

// NOTE: アロー関数で export すると Nuxt の自動インポートスキャナーがパラメータ名を誤ってエクスポートとして認識するため function 宣言を使用
export function createRandomString({ prefix = '', length = 16 }: { prefix?: string; length?: number } = {}) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const randomNumbers = Array.from(crypto.getRandomValues(new Uint32Array(length)))
  return prefix + randomNumbers.map(v => chars[v % chars.length]).join('')
}
