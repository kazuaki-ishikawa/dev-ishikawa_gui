import { NovaIconTypes } from '@/components/icons/constants'

export const ListItemMinHeight = 'fit-content'

export const NavigationGroupIconMap = {
  /**
   * Core グループの親子関係はキーの定義順によって表現されている
   * - icon が指定されているキー → 親グループ（新しい v-list-group を生成）
   * - icon が undefined のキー  → 直前の親グループの子として追加
   *
   * ⚠️ キーの並び順を変更すると securedWanGroups の親子構造が壊れるため、順序を変更するときは気を付ける
   * グループを追加・削除する場合も順序に注意する
   */
  Core: {
    securedWan: NovaIconTypes.SecuredWan,
    accessToSite: NovaIconTypes.AccessSite,
    monitoringInformation: undefined,
    circuitsApplication: undefined,
    accessToSiteResourceList: undefined,
    optionList: undefined,
    rinkMobile: NovaIconTypes.AccessMobile,
    rinkMobileContractApplication: undefined,
    rinkMobileResourceList: undefined,
    wanSecurity: NovaIconTypes.WanSecurity,
    wanSecurityMonitoring: undefined,
    wanSecurityApplication: undefined,
  },
  Extensions: {
    internetGateway: NovaIconTypes.InternetGateway,
    interconnect: NovaIconTypes.Interconnect,
    globalConnect: NovaIconTypes.GlobalConnect,
    satelliteConnect: NovaIconTypes.SatelliteConnect,
    remoteAccess: NovaIconTypes.RemoteAccess,
    idaas: NovaIconTypes.Idaas,
    edr: NovaIconTypes.Edr,
    lanSecurity: NovaIconTypes.LanSecurity,
  },
  Other: {
    support: NovaIconTypes.SupportSpeechBubble,
    news: NovaIconTypes.Notification,
    maintenanceInformation: NovaIconTypes.Maintenance,
    contract: NovaIconTypes.Contract,
  },
} as const

export const InitialOpen = [
  ...Object.keys(NavigationGroupIconMap.Core),
  ...Object.keys(NavigationGroupIconMap.Extensions),
  ...Object.keys(NavigationGroupIconMap.Other),
] as string[]
