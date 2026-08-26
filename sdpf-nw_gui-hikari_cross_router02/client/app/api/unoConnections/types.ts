import type { OrderStatusType, ResourceStatusType } from '@/api/types'

export type UnoConnectionListQuery = {
  resourceStatus?: ResourceStatusType[]
}

export type UnoConnectionResponse = {
  unoConnectionId: string
  tenantId: string
  vpnId: string
  resourceStatus: ResourceStatusType
  orderId?: string
  orderStatus?: OrderStatusType
  creationTime: string
  updateTime?: string
  serviceStartTime?: string
  customerNote: string
  unoContractNumber: string
  unoVpnId: string
  unoInternalAddress: string
  unoConnectivityAddress?: string
  rinkConnectivityAddress?: string
  unoApplicationDate: string
}

export type UnoConnectionListResponse = {
  unoConnections: UnoConnectionResponse[]
}

export type UnoConnectionPostRequest = {
  customerNote: string
  vpnId: string
  unoContractNumber: string
  unoVpnId: string
  unoApplicationDate: string
}
