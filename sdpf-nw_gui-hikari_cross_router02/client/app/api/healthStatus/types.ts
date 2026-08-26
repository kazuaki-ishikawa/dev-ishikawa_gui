import type { CommonQuery } from '@/api/types'
import type { Situation, HealthStatus, BgpSessionStatus } from '@/api/healthStatus/constants'

type SituationType = (typeof Situation)[keyof typeof Situation]
type FicHealthStatusType = (typeof HealthStatus)[keyof typeof HealthStatus]
export type HealthStatusType = Exclude<FicHealthStatusType, typeof HealthStatus.Warning>
type BgpSessionStatusType = (typeof BgpSessionStatus)[keyof typeof BgpSessionStatus]

export type BgpPingHealthStatusType = {
  act: HealthStatusType | null
  sby: HealthStatusType | null
}

export type HealthStatusQuery = CommonQuery & {
  terminalId?: string
  customerNote?: string
}
export type HealthStatusResponse = {
  terminal: {
    terminalId: string
    customerNote?: string
    terminalStatus: HealthStatusType
  }
  mobile?: {
    mobileId: string
    mobileSituation: SituationType
    mobileStatus: HealthStatusType
  }
  ipoe?: {
    ipoeId: string
    ipoeSituation: SituationType
    ipoeStatus: HealthStatusType
  }
  vpn?: {
    vpnId: string
    vpnStatus: HealthStatusType
    ipsecStatus: HealthStatusType | null
  }
  guarantee?: {
    guaranteeId: string
    guaranteeSituation: SituationType
    guaranteeStatus: HealthStatusType
  }
  guaranteeBgp?: {
    guaranteeId: string
    internetBgpStatus?: BgpPingHealthStatusType
    vpnBgpStatus?: BgpPingHealthStatusType
  }
  guaranteePing?: {
    guaranteeId: string
    internetPingStatus?: BgpPingHealthStatusType
  }
  guaranteeOnu?: {
    guaranteeId: string
    onuUniStatus: HealthStatusType
    onuRinhStatus: HealthStatusType
    onuAccessStatus: HealthStatusType
  }
}
export type HealthStatusListResponse = {
  total: number
  offset: number
  healthStatuses: HealthStatusResponse[]
}

export type FicHealthStatusResponse = {
  ficId: string
  ficStatus: FicHealthStatusType
  vpnId?: string
}
export type FicHealthStatusListResponse = {
  ficHealthStatuses: FicHealthStatusResponse[]
}
export type FicConnectionBgpSessionResponse = {
  status?: BgpSessionStatusType
  requestTime?: string
  operation?: 'reset'
  ficConnectionId: string
}

export type FicRoutesResponse = {
  requestId: string
  completed: boolean
  requestTime: string
}
type RouterReceiveRoutesType = {
  prefix: string
  nextHop: string
  asPath: string
  med: string
}
export type FicRoutesRequestsResponse = {
  requestid: string
  completed: boolean
  requestTime: string
  completedTime?: string
  responseBody?: {
    ficId: string
    activeRouterReceiveRoutes: RouterReceiveRoutesType[]
    standbyRouterReceiveRoutes: RouterReceiveRoutesType[]
  }
}

export type HealthStatusCountResponse = {
  total: number
  ok: number
  ng: number
}
