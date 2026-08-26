import type { OrderStatusType, ResourceStatusType } from '@/api/types'
import type { VpnRouteResourceTypes } from '@/api/vpns/constants'

type VpnRouteResourceType = (typeof VpnRouteResourceTypes)[keyof typeof VpnRouteResourceTypes]

export type VpnListQuery = {
  resourceStatus?: ResourceStatusType[]
}

export type VpnRouteType = {
  resourceType: VpnRouteResourceType
  resourceId: string
  customerNote?: string
  routes: string[]
}

export type VpnSearchRouteType = {
  resourceType: VpnRouteResourceType
  resourceId: string
  customerNote?: string
  route: string
}

export type VpnPostRequest = {
  customerNote: string
  internalAddress: string
}
export type VpnPutRequest = {
  customerNote: string
}
export type VpnResponse = {
  tenantId: string
  vpnId: string
  ref: string
  resourceStatus: ResourceStatusType
  orderId?: string
  orderStatus?: OrderStatusType
  creationTime: string
  updateTime?: string
  serviceStartTime?: string
  customerNote: string
  internalAddress: string
  routeCount: number
  routes?: VpnRouteType[]
}

export type ResourceSummaryVpnResponse = Omit<VpnResponse, 'routeCount' | 'routes'>

export type VpnListResponse = {
  vpns: VpnResponse[]
}

export type ResourceSummaryVpnListResponse = {
  vpns: ResourceSummaryVpnResponse[]
}

export type VpnSearchRouteQuery = {
  ipv4Prefix: string
  excludeResourceId?: string
}
export type VpnSearchRouteResponse = {
  routes: VpnSearchRouteType[]
}
