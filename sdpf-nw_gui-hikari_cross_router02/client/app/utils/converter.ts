import { type BandwidthUnitTypes, TerminalTypes } from '@/api/constants'
import type { ResourceSummaryTerminalListResponse } from '@/api/terminals/types'

type BandwidthUnitType = (typeof BandwidthUnitTypes)[keyof typeof BandwidthUnitTypes]
type UsageUnit = 'GB' | 'MB'
type RoundMode = 'ceil' | 'floor'

// NOTE: アロー関数で export すると Nuxt の自動インポートスキャナーがパラメータ名を誤ってエクスポートとして認識するため function 宣言を使用
export function convertTerminalDetailPath(terminalList: ResourceSummaryTerminalListResponse, terminalId: string) {
  const terminal = terminalList.terminals.find(t => t.terminalId === terminalId)
  switch (terminal?.terminalType) {
    case TerminalTypes.Rental:
      return `/tenants/${terminal.tenantId}/terminals/${terminalId}`
    case TerminalTypes.Self:
      return `/tenants/${terminal.tenantId}/self-terminals/${terminalId}`
    default:
      return undefined
  }
}

// Windowsの全角ハイフンをMacの全角ハイフンに変換
export const convertHyphen = (str: string) => str.replace(/\uFF0D/g, '\u2212')

export const convertByteToString = (byte: number, decimalPlaces = 0) => {
  if (byte < 1024) {
    return `${byte}B`
  }

  const kB = byte / 1024
  if (kB < 1024) {
    return `${kB.toFixed(decimalPlaces)}KB`
  }
  const mB = kB / 1024
  if (mB < 1024) {
    return `${mB.toFixed(decimalPlaces)}MB`
  }
  const gB = mB / 1024
  if (gB < 1024) {
    return `${gB.toFixed(decimalPlaces)}GB`
  }
  const tB = gB / 1024
  return `${tB.toFixed(decimalPlaces)}TB`
}

// 帯域の単位を変換するための関数
const getUnitMultiplier = (unit?: string) => {
  switch (unit) {
    case 'K':
    case 'KB':
      return 1000
    case 'M':
    case 'MB':
      return 1000 ** 2
    case 'G':
    case 'GB':
      return 1000 ** 3
    default:
      return 1
  }
}

// 通信量の単位を変換するための関数
const getUsageUnitMultiplier = (unit: UsageUnit) => (unit === 'GB' ? 1024 ** 3 : 1024 ** 2)

export const convertByteToUsageUnit = (byte: number, unit: UsageUnit, roundMode: RoundMode) => {
  const value = byte / getUsageUnitMultiplier(unit)
  const factor = 100
  const rounded = roundMode === 'ceil' ? Math.ceil(value * factor) / factor : Math.floor(value * factor) / factor
  return `${rounded.toFixed(2)}${unit}`
}

export const convertByteToUnitValue = (byte: number, unit: UsageUnit) => {
  return byte / getUsageUnitMultiplier(unit)
}

export const convertByteToMBWithGB = (byte: number, roundMode: RoundMode): string => {
  const mb = convertByteToUsageUnit(byte, 'MB', roundMode)
  const gb = convertByteToUsageUnit(byte, 'GB', roundMode)
  return `${mb} (${gb})`
}

// NOTE: アロー関数で export すると Nuxt の自動インポートスキャナーがパラメータ名を誤ってエクスポートとして認識するため function 宣言を使用
export function convertBandwidthToUnit(bandwidth: string, targetUnit?: BandwidthUnitType) {
  const trimmed = bandwidth.trim().toUpperCase()
  const match = trimmed.match(/^(\d+(?:\.\d+)?)([A-Z]+)$/)
  if (!match) {
    return 0
  }

  const value = parseFloat(match[1] || '0')
  const unit = match[2]
  return (value * getUnitMultiplier(unit)) / getUnitMultiplier(targetUnit)
}
