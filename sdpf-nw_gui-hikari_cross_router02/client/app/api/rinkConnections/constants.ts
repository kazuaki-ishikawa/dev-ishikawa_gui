import type { RinkConnectionVpnFilterPatternType } from './types'
import type { BreakOutType } from '../types'

export const MAX_BREAKOUT_COUNT = 8

export const RINK_MOBILE_ERROR_TEXT = {
  RECEPTION_IS_CLOSED: 'Reception is currently closed',
  INCOMPATIBLE_DEVICE_AND_ACCESS_TYPE: 'This Device and Access type cannot be ordered together.',
  INVALID_IP_ADDRESS:
    'This IP address(es) cannot be configured. Required fields are missing, or the IP address(es) matches the current one.',
} as const

export const RinkConnectionTypes = {
  InternetOnly: 'internet-only',
  VpnOnly: 'vpn-only',
  InternetVpn: 'internet-vpn',
  VpnBreakOut: 'vpn-breakout',
} as const

export const RinkConnectionCustomLocalBreakOutNameList = [
  'custom1',
  'custom2',
  'custom3',
  'custom4',
  'custom5',
  'custom6',
  'custom7',
  'custom8',
] as const

export const RinkConnectionVpnFilterPatternTypes = {
  WhiteList: 'whiteList',
  BlackList: 'blackList',
} as const

export const ScheduleNetworkOrderTypes = {
  CreateNetworkRinkConnection: 'create-network-rinkConnection',
  DeleteNetworkRinkConnection: 'delete-network-rinkConnection',
  Other: 'other',
} as const

export const RinkConnectionEditTypes = {
  ConnectionType: 'connection-type',
  LocalBreakOut: 'local-breakout-list',
  VpnConnectionPrefix: 'vpn-connection-prefix',
  DnsServer: 'dns-server',
} as const

export const RinkConnectionDeleteColumnsTypes = {
  DnsIpAddressPrimary: 'dnsIpAddressPrimary',
  DnsIpAddressSecondary: 'dnsIpAddressSecondary',
} as const

export const initialRinkConnectionVpnFilterInputData = {
  id: '',
  pattern: RinkConnectionVpnFilterPatternTypes.WhiteList as RinkConnectionVpnFilterPatternType,
  prefixList: [] as string[],
}
export const initialRinkConnectionCustomLocalBreakOutInputData = {
  id: '',
  name: RinkConnectionCustomLocalBreakOutNameList[0] as (typeof RinkConnectionCustomLocalBreakOutNameList)[number],
  nameAlias: '',
  dstPrefixList: [] as string[],
  fqdnList: [] as string[],
}
export const initialRinkConnectionInputData = {
  connectionType: '',
  vpnId: '',
  poiRedundancy: false,
  vpnConnectionPrefix: [] as string[],
  lineActPrefix: '',
  lineSbyPrefix: '',
  useDnsServer: true,
  dnsIpAddressPrimary: '202.234.232.6/32',
  dnsIpAddressSecondary: '221.113.139.250/32',
  vpnNetworkPrefix: '',
  customLocalBreakOutList: [] as Array<typeof initialRinkConnectionCustomLocalBreakOutInputData>,
  breakOutList: [] as BreakOutType[],
  timeFrame: '',
}
export const initialRinkConnectionValid = {
  connectionType: false,
  vpnId: false,
  poiRedundancy: true,
  vpnConnectionPrefix: true,
  lineActPrefix: false,
  lineSbyPrefix: true,
  useDnsServer: true,
  dnsIpAddressPrimary: true,
  dnsIpAddressSecondary: true,
  vpnNetworkPrefix: false,
  customLocalBreakOutList: true,
  breakOutList: false,
  timeFrame: false,
}
