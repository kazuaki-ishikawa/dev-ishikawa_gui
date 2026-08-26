import type { OrderStatusType, ResourceStatusType } from '@/api/types'
import type { FicRequestTypes, RouteAdvertisementTypes } from '@/api/ficConnections/constants'

export type RouteAdvertisementType = (typeof RouteAdvertisementTypes)[keyof typeof RouteAdvertisementTypes]

export type FicRequestType = (typeof FicRequestTypes)[keyof typeof FicRequestTypes]

export type FicConnectionListQuery = {
  resourceStatus?: ResourceStatusType[]
}
export type FicConnectionPostRequest = {
  customerNote: string
  vpnId: string
  routeAdvertisement?: RouteAdvertisementType
  ficPremium?: boolean
}
export type FicConnectionPutRequest = {
  customerNote?: string
  routeAdvertisement?: RouteAdvertisementType
}

export type FicConnectionResponse = {
  ficConnectionId: string
  tenantId: string
  vpnId: string
  resourceStatus?: ResourceStatusType
  orderId?: string
  orderStatus?: OrderStatusType
  creationTime: string
  updateTime?: string
  serviceStartTime?: string
  customerNote: string
  referenceFicConnectionId?: string
  routeAdvertisement: RouteAdvertisementType
  bandwidth: string
  publicServiceKey: string
  ficPremium: boolean
  ref: string
}

type ResourceSummaryFicConnectionResponse = FicConnectionResponse

export type FicConnectionListResponse = {
  ficConnections: ResourceSummaryFicConnectionResponse[]
}
