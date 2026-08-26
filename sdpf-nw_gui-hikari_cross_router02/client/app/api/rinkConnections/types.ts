import type { BreakOutType } from '@/api/types'
import type {
  initialRinkConnectionInputData,
  RinkConnectionCustomLocalBreakOutNameList,
  RinkConnectionDeleteColumnsTypes,
  RinkConnectionEditTypes,
  RinkConnectionTypes,
  RinkConnectionVpnFilterPatternTypes,
  ScheduleNetworkOrderTypes,
} from '@/api/rinkConnections/constants'
import type { RinkMobileOrderTypes } from '@/api/orders/constants'

export type RinkConnectionEditType = (typeof RinkConnectionEditTypes)[keyof typeof RinkConnectionEditTypes]
export type RinkConnectionType = (typeof RinkConnectionTypes)[keyof typeof RinkConnectionTypes]
export type RinkConnectionVpnFilterPatternType =
  (typeof RinkConnectionVpnFilterPatternTypes)[keyof typeof RinkConnectionVpnFilterPatternTypes]
export type RinkConnectionDeleteColumnsType =
  (typeof RinkConnectionDeleteColumnsTypes)[keyof typeof RinkConnectionDeleteColumnsTypes]

export type InitialRinkConnectionInputDataType = typeof initialRinkConnectionInputData

export type ScheduleNetworkOrderType = (typeof ScheduleNetworkOrderTypes)[keyof typeof ScheduleNetworkOrderTypes]

export type RinkConnectionVpnFilterType = {
  pattern: RinkConnectionVpnFilterPatternType
  prefixList: string[]
}
export type RinkConnectionListResponse = {
  zId: string
  connectionType: RinkConnectionType
  vpnId?: string
  userNote?: string
}
export type RinkConnectionListRinkMobileIdResponse = {
  zId: string
}
export type RinkConnectionWanSecurityNumberOfLinesResponse = {
  totalWanSecurityNumberOfLines: number
}

export type RinkConnectionResponse = {
  connectionType: RinkConnectionType
  vpnId?: string
  vpnConnectionPrefix?: string[]
  dnsIpAddressPrimary: string
  dnsIpAddressSecondary?: string
  authDomainName?: string
  apn: string
  poiRedundancy: boolean
  lineActPrefix: string[]
  lineSbyPrefix?: string[]
  vpnNetworkPrefix?: string
  createdAt: string
  deletedAt: string | null
  systemLocalBreakOutList?: Array<{
    name: BreakOutType
  }>
  customLocalBreakOutList?: string[]
}
export type RinkConnectionCustomLocalBreakOutType = {
  name: (typeof RinkConnectionCustomLocalBreakOutNameList)[number]
  nameAlias: string
  dstPrefixList?: Array<{ prefix: string }>
  fqdnList?: Array<{ fqdn: string }>
}
export type RinkConnectionPostRequest = {
  connectionType: RinkConnectionType
  vpnId?: string
  poiRedundancy: boolean
  vpnConnectionPrefix?: string[]
  lineActPrefix: string[]
  lineSbyPrefix?: string[]
  dnsIpAddressPrimary?: string
  dnsIpAddressSecondary?: string
  vpnNetworkPrefix?: string
  optionLocalBreakOut?: boolean
  customLocalBreakOutList?: RinkConnectionCustomLocalBreakOutType[]
  systemLocalBreakOutList?: Array<{
    name: BreakOutType
  }>
  timeFrame: string
}
export type RinkConnectionPostResponse = {
  id: string
  zId: string
}

type RinkConnectionConnectionTypePutRequest = {
  connectionType: RinkConnectionType
  vpnId?: string
  vpnConnectionPrefix?: string[]
  dnsIpAddressPrimary?: string
  dnsIpAddressSecondary?: string
  vpnNetworkPrefix?: string
  optionLocalBreakOut?: boolean
  customLocalBreakOutList?: RinkConnectionCustomLocalBreakOutType[]
  deleteColumns?: RinkConnectionDeleteColumnsType[]
  systemLocalBreakOutList?: Array<{
    name: BreakOutType
  }>
  timeFrame: string
}
type RinkConnectionDnsServerPutRequest = {
  dnsIpAddressPrimary?: string
  dnsIpAddressSecondary?: string
  deleteColumns?: RinkConnectionDeleteColumnsType[]
  timeFrame: string
}
type RinkConnectionLocalBreakOutPutRequest = {
  systemLocalBreakOutList: Array<{
    name: BreakOutType
  }>
  customLocalBreakOutList: RinkConnectionCustomLocalBreakOutType[]
  timeFrame: string
}
type RinkConnectionVpnConnectionPrefixPutRequest = { vpnConnectionPrefix?: string[]; timeFrame: string }

export type RinkConnectionPutRequest<T extends RinkConnectionEditType> =
  T extends typeof RinkConnectionEditTypes.ConnectionType
    ? RinkConnectionConnectionTypePutRequest
    : T extends typeof RinkConnectionEditTypes.DnsServer
      ? RinkConnectionDnsServerPutRequest
      : T extends typeof RinkConnectionEditTypes.LocalBreakOut
        ? RinkConnectionLocalBreakOutPutRequest
        : T extends typeof RinkConnectionEditTypes.VpnConnectionPrefix
          ? RinkConnectionVpnConnectionPrefixPutRequest
          : never

export type RinkConnectionDeleteRequest = {
  timeFrame: string
}

export type ScheduleNetworkListQuery = {
  orderType: ScheduleNetworkOrderType
}
export type ScheduleNetworkListResponse = {
  scheduleNetworks: string[]
}

// オーダー用定義
export type OrderRinkConnectionRequest = {
  orderType:
    | typeof RinkMobileOrderTypes.RinkConnectionCreate
    | typeof RinkMobileOrderTypes.RinkConnectionUpdateConnectionType
    | typeof RinkMobileOrderTypes.RinkConnectionUpdateDnsServer
    | typeof RinkMobileOrderTypes.RinkConnectionUpdateLocalBreakOut
    | typeof RinkMobileOrderTypes.RinkConnectionUpdateVpnConnectionPrefix
    | typeof RinkMobileOrderTypes.RinkConnectionDelete
  reservedCompletionDate?: string // 希望日
  cancellationDeadline?: string
  reservedConstructionDate?: string
  connectionType?: RinkConnectionType
  vpnId?: string
  vpnConnectionPrefix?: string[]
  dnsIpAddressPrimary?: string
  dnsIpAddressSecondary?: string
  authDomainName?: string
  poiRedundancy?: boolean
  vpnNetworkPrefix?: string
  lineActPrefix?: string[]
  lineSbyPrefix?: string[]
  optionLocalBreakOut?: boolean
  systemLocalBreakOutList?: Array<{
    name: BreakOutType
  }>
  deleteColumns?: RinkConnectionDeleteColumnsType[]
  orderDetailCustomLocalBreakOutList?: Array<{
    id: string
    name: (typeof RinkConnectionCustomLocalBreakOutNameList)[number]
    nameAlias: string
    dstPrefixList?: string[]
    fqdnList?: string[]
  }>
}
