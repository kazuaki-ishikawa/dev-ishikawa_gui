import type { CommonQuery } from '@/api/types'
import type { AlertResourceTypes, AlertNameTypes } from '@/api/alerts/constants'

export type AlertResourceType = (typeof AlertResourceTypes)[keyof typeof AlertResourceTypes]
export type AlertNameType = (typeof AlertNameTypes)[keyof typeof AlertNameTypes]

export type AlertListQuery = CommonQuery & {
  resourceType?: AlertResourceType[]
  resolved?: 'true' | 'false'
  terminalId?: string
  customerNote?: string
}

export type AlertResponse = {
  terminalId: string
  customerNote: string
  timestamp: string
  resolvedTime?: string
  resourceType: AlertResourceType
  resourceId: string
  alertName: AlertNameType
  info?: string
  resolved: boolean
}
export type AlertListResponse = {
  total: number
  offset: number
  alerts: AlertResponse[]
}

export type AlertCountQuery = {
  startDate?: string
  endDate?: string
  terminalId?: string
}
export type AlertCountResponse = {
  dates: string[]
  notResolved: number[]
  resolved: number[]
}
