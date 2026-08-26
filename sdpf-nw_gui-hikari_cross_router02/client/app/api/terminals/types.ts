import type {
  ResourceStatusType,
  OrderStatusType,
  CommonQuery,
  TerminalType,
  TerminalDeviceType,
  TrafficReportFlowAnalyzerType,
  TerminalFlowCollectorResponseType,
  TerminalFlowCollectorRequestType,
  TerminalThreatDetectionType,
  TerminalFlowCollectorPlanType,
  TerminalBehaviorDetectionType,
} from '@/api/types'
import type { CircuitTypes, SecurityOptionTypes, ProtocolTypes } from '@/api/constants'
import type {
  TERMINAL_PUT_PARAMETERS_WITHOUT_MOBILE,
  MOBILE_DOCUMENT_FILES,
  ContractIdentificationDocumentTypes,
  CorporateVerificationMethodTypes,
  PicIdentificationDocumentTypes,
  AuxiliaryIdentificationDocumentTypes,
  EmploymentDocumentTypes,
  CallDetailBreakdownSettingTypes,
  NetworkTypes,
  ActionTypes,
  LansTypes,
  LansPortNumberList,
  NatTypes,
  LanTypes,
  OperationTypes,
  OperationStatusTypes,
  FirmwareVersionTypes,
  TerminalUtilOptionCountOptionTypes,
  initialMobileInputData,
  initialTerminalInputData,
  initialFiltersInputData,
  initialAccessControlInputData,
  initialLanStaticRoutesInputData,
  initialLansInputData,
  initialVpnNatsInputData,
  initialTerminalValid,
  initialMobileValid,
  initialEditBulkTerminalInputData,
  initialRemovalInputData,
  initialDhcpServerInputData,
} from '@/api/terminals/constants'
import type { BehaviorDetectionPlanTypes } from '@/api/behaviorDetection/constants'

export type TerminalInputDataType = typeof initialTerminalInputData
export type TerminalMobileInputDataType = typeof initialMobileInputData
export type TerminalFiltersInputType = typeof initialFiltersInputData
export type TerminalAccessControlInputData = typeof initialAccessControlInputData
export type TerminalLanStaticRoutesInputType = typeof initialLanStaticRoutesInputData
export type TerminalLansInputType = typeof initialLansInputData
export type TerminalVpnNatsInputType = typeof initialVpnNatsInputData
export type InitialEditBulkTerminalInputDataType = typeof initialEditBulkTerminalInputData
export type InitialRemovalInputDataType = typeof initialRemovalInputData
export type InitialDhcpServerInputDataType = typeof initialDhcpServerInputData

export type TerminalInputValidType = typeof initialTerminalValid
export type TerminalMobileValidType = typeof initialMobileValid

export type PrimaryCircuitType = (typeof CircuitTypes)[keyof typeof CircuitTypes]
export type SecondaryCircuitType = Exclude<PrimaryCircuitType, typeof CircuitTypes.Guarantee>

export type CorporateVerificationMethodType =
  (typeof CorporateVerificationMethodTypes)[keyof typeof CorporateVerificationMethodTypes]
export type ContractIdentificationDocumentType =
  (typeof ContractIdentificationDocumentTypes)[keyof typeof ContractIdentificationDocumentTypes]
export type PicIdentificationDocumentType =
  (typeof PicIdentificationDocumentTypes)[keyof typeof PicIdentificationDocumentTypes]
export type AuxiliaryIdentificationDocumentType =
  (typeof AuxiliaryIdentificationDocumentTypes)[keyof typeof AuxiliaryIdentificationDocumentTypes]
export type EmploymentDocumentType = (typeof EmploymentDocumentTypes)[keyof typeof EmploymentDocumentTypes]
export type CallDetailBreakdownSettingType =
  (typeof CallDetailBreakdownSettingTypes)[keyof typeof CallDetailBreakdownSettingTypes]
export type NetworkType = (typeof NetworkTypes)[keyof typeof NetworkTypes]
export type ProtocolType = (typeof ProtocolTypes)[keyof typeof ProtocolTypes]
type ActionType = (typeof ActionTypes)[keyof typeof ActionTypes]
export type LansType = (typeof LansTypes)[keyof typeof LansTypes]
export type LansPortNumberType = (typeof LansPortNumberList)[number]
export type NatType = (typeof NatTypes)[keyof typeof NatTypes]
export type LanType = (typeof LanTypes)[keyof typeof LanTypes]

export type OperationType = (typeof OperationTypes)[keyof typeof OperationTypes]
export type OperationStatusType = (typeof OperationStatusTypes)[keyof typeof OperationStatusTypes]
export type TerminalUtilOptionCountOptionType =
  (typeof TerminalUtilOptionCountOptionTypes)[keyof typeof TerminalUtilOptionCountOptionTypes]

export type MobileRatType = 'auto' | 'lte'

export type DocumentFileKey = (typeof MOBILE_DOCUMENT_FILES)[number]

type TerminalLanVpnNatType = {
  type: NatType
  innerIpv4Prefix: string
  outerIpv4Prefix: string
}

export type TerminalLansType = {
  type: LansType
  portNumber?: LansPortNumberType
  ipv4Address: string
  ipv4PrefixLength: string
  vpnRouting: boolean
  vpnNats?: TerminalLanVpnNatType[]
  dhcpServer?: TerminalDhcpServerType | null
  lanInFilters?: TerminalUserFilter | null
}

type TerminalDefaultGatewayType = {
  nexthopNetwork: NetworkType
  nexthopIpv4Address?: string
  vpnRouting?: boolean
}

type TerminalAccessControlList = {
  sourceIpv4Prefix: string
  destinationIpv4Prefix: string
  sourcePort: string
  destinationPort: string
  protocol: ProtocolType
  action: ActionType
}
export type TerminalUserFilter = {
  defaultPolicy: ActionType
  accessControlList: TerminalAccessControlList[] | null
}

export type TerminalLanStaticType = {
  destinationIpv4Prefix: string
  nexthopIpv4Address: string
  vpnRouting: boolean
  vpnNats?: TerminalLanVpnNatType[]
}
export type TerminalWanStaticType = {
  destinationIpv4Prefix: string
  nexthopNetwork: Exclude<NetworkType, typeof NetworkTypes.Lan>
}
export type TerminalDhcpServerType = {
  ipv4AddressRanges: Array<{ start: string; end: string }>
  domain?: string
  primaryDnsServer?: string
  secondaryDnsServer?: string
  primaryWinsServer?: string
  secondaryWinsServer?: string
}
export type TerminalDhcpRelayServerType = {
  serverIpv4Address: string
}

export type TerminalGuaranteeRequestType = {
  guaranteeId: string
  vpn?: {
    act?: {
      connectedIpv4Prefix: string | null
    }
    sby?: {
      connectedIpv4Prefix: string | null
    }
  }
}

export type TerminalMobilePostRequest = {
  rat: MobileRatType
  japanCorporateNumber: string
  contractIdentificationDocumentType?: ContractIdentificationDocumentType
  contractIdentificationDocumentId?: string
  picName: string
  picNameKana: string
  picPostalCode: string
  picAddress: string
  picAddressKana: string
  picPhoneNumber: string
  picDateOfBirth: string
  picIdentificationDocumentType?: PicIdentificationDocumentType
  picIdentificationNumber?: string
  picIdentificationFrontDocumentId?: string
  picIdentificationBackDocumentId?: string
  picIdentificationAdditionalDocumentId?: string
  picAuxiliaryIdentificationDocumentType?: AuxiliaryIdentificationDocumentType
  picAuxiliaryIdentificationDocumentId?: string
  picEmployeeCode?: string
  picEmploymentDocumentType: EmploymentDocumentType
  picEmploymentDocumentId: string
  networkPinCode: string
  customerReceiptRequired: boolean
  callDetailDesired: boolean
  callDetailBreakdownSetting?: CallDetailBreakdownSettingType
  callDetailDestinationNumberSetting?: CallDetailBreakdownSettingType
  jpkiRequestId?: string
}
export type TerminalMobilePutRequest = { rat: MobileRatType }

export type TerminalMobileDeleteRequest = {
  japanCorporateNumber: string
  contractIdentificationDocumentType: ContractIdentificationDocumentType
  contractIdentificationDocumentId: string
  picName: string
  picNameKana: string
  picPostalCode: string
  picAddress: string
  picAddressKana: string
  picPhoneNumber: string
  picDateOfBirth: string
  picIdentificationDocumentType: PicIdentificationDocumentType
  picIdentificationNumber?: string
  picIdentificationFrontDocumentId: string
  picIdentificationBackDocumentId?: string
  picIdentificationAdditionalDocumentId?: string
  picAuxiliaryIdentificationDocumentType?: AuxiliaryIdentificationDocumentType
  picAuxiliaryIdentificationDocumentId?: string
  picEmployeeCode?: string
  picEmploymentDocumentType: EmploymentDocumentType
  picEmploymentDocumentId: string
}

export type TerminalPostRequest = {
  customerNote: string
  terminalDeviceType: TerminalDeviceType
  breakOut?: string[]
  interceptDnsServers?: string[]
  deliveryName: string
  deliveryCompanyName?: string
  deliveryDepartmentName: string
  deliveryPostalCode: string
  deliveryPhoneNumber: string
  deliveryAddress: string
  deliveryAddressKana: string
  deliveryDate: string
  installationPostalCode: string
  installationAddress: string
  primaryCircuitType: PrimaryCircuitType
  secondaryCircuitType?: SecondaryCircuitType
  guarantee?: TerminalGuaranteeRequestType
  ipoeId?: string
  vpnId?: string
  mobile?: TerminalMobilePostRequest
  loopbackIpv4Address: string
  lanType: LanType
  defaultGateway: TerminalDefaultGatewayType
  lans: TerminalLansType[]
  lanStaticRoutes?: TerminalLanStaticType[]
  wanStaticRoutes?: TerminalWanStaticType[]
  inet4OutFilters: TerminalUserFilter | null
  vpnInFilters: TerminalUserFilter | null
  vpnOutFilters: TerminalUserFilter | null
  dhcpRelayServers?: TerminalDhcpRelayServerType[]
  trafficReportFlowAnalyzer: TrafficReportFlowAnalyzerType
  threatDetection: TerminalThreatDetectionType
  flowCollector: TerminalFlowCollectorRequestType
  behaviorDetection: TerminalBehaviorDetectionType
}
type Nullable<T> = { [K in keyof T]: T[K] | null }
export type TerminalPutKeysWithoutMobile = (typeof TERMINAL_PUT_PARAMETERS_WITHOUT_MOBILE)[number]
export type TerminalPutRequest = Nullable<
  Partial<Omit<Pick<TerminalPostRequest, TerminalPutKeysWithoutMobile>, 'trafficReportFlowAnalyzer'>>
> & {
  mobile?: TerminalMobilePutRequest
  trafficReportFlowAnalyzer?: Partial<TrafficReportFlowAnalyzerType>
}
export type TerminalDeleteRequest = {
  removalName: string
  removalCompanyName?: string
  removalDepartmentName: string
  removalPostalCode: string
  removalAddress: string
  removalAddressKana: string
  removalPhoneNumber: string
  mobile?: TerminalMobileDeleteRequest
}
export type TerminalBulkUnitParameter = Omit<
  TerminalPostRequest,
  'inet4OutFilters' | 'lanStaticRoutes' | 'vpnInFilters' | 'vpnOutFilters' | 'wanStaticRoutes' | 'terminalDeviceType'
>
export type TerminalBulkPostRequest = {
  mobile: TerminalMobilePostRequest
  terminals: Omit<TerminalBulkUnitParameter, 'mobile'>[]
}

export type TerminalBulkPutRequest = {
  terminalIds?: string[]
  vpnId?: string | null
  breakOut?: string[] | null
  interceptDnsServers?: string[] | null
  defaultGateway?: {
    nexthopNetwork: Exclude<NetworkType, typeof NetworkTypes.Lan>
  }
  wanStaticRoutes?: TerminalWanStaticType[] | null
  vpnInFilters?: TerminalUserFilter | null
  vpnOutFilters?: TerminalUserFilter | null
  inet4OutFilters?: TerminalUserFilter | null
  dhcpServer?: Omit<TerminalDhcpServerType, 'ipv4AddressRanges'> | null
  dhcpRelayServers?: TerminalDhcpRelayServerType[] | null
  trafficReportFlowAnalyzer?: Partial<TrafficReportFlowAnalyzerType>
  threatDetection?: TerminalThreatDetectionType
  flowCollector?: TerminalFlowCollectorRequestType
  behaviorDetection?: TerminalBehaviorDetectionType
}

type TerminalDeviceInfoType = {
  model: string
  deviceAttribute: 'active' | 'coldStandby'
  serialNumber: string
  firmwareVersion?: {
    displayName: string
    attribute: (typeof FirmwareVersionTypes)[keyof typeof FirmwareVersionTypes]
  }
}
export type TerminalPrimaryCircuitType = {
  circuitType: PrimaryCircuitType
  circuitId: string
  ref?: string
}
export type TerminalSecondaryCircuitType = {
  circuitType: SecondaryCircuitType
  circuitId: string
  ref?: string
}
type TerminalGuaranteeResponseActSbyType = {
  connectedIpv4Prefix: string
  peConnectedIPv4Address: string
  cpeConnectedIpv4Address: string
  vlan: number
}
type TerminalGuaranteeResponseType = {
  guaranteeId: string
  internet?: {
    globalIpAddress?: string
    act?: TerminalGuaranteeResponseActSbyType
    sby?: TerminalGuaranteeResponseActSbyType
  }
  vpn?: {
    act: TerminalGuaranteeResponseActSbyType
    sby: TerminalGuaranteeResponseActSbyType
  }
  routeSwitch?: {
    switchover: boolean
    lastUpdateTime: string
  }
}

export type ResourceSummaryTerminalQuery = CommonQuery & {
  terminalId?: string[]
  customerNote?: string
  resourceStatus?: ResourceStatusType[]
  terminalType?: TerminalType
  primaryCircuitType?: PrimaryCircuitType
  flowCollectorPlan?: TerminalFlowCollectorPlanType
  breakOutListId?: string
}
export type ResourceSummaryTerminalResponse = {
  terminalId: string
  ref: string
  tenantId: string
  resourceStatus: ResourceStatusType
  orderId?: string
  orderStatus?: OrderStatusType
  creationTime: string
  updateTime: string
  serviceStartTime: string
  customerNote: string
  vpnId?: string
  ipoeId?: string
  mobileId?: string
  loopbackIpv4Address?: string
  primaryCircuit: TerminalPrimaryCircuitType
  secondaryCircuit?: TerminalSecondaryCircuitType
  terminalType: TerminalType
  terminalDeviceType?: TerminalDeviceType
  trafficReportFlowAnalyzer: TrafficReportFlowAnalyzerType
  flowCollector: Omit<TerminalFlowCollectorResponseType, 'flowCollectorUsage'>
  threatDetection: TerminalThreatDetectionType
  behaviorDetection: TerminalBehaviorDetectionType
  threatFilterEntry?: number
  threatFilterMaxEntry?: number
}
export type TerminalListQuery = CommonQuery & {
  terminalId?: string[]
  resourceStatus?: ResourceStatusType[]
}
export type TerminalResponse = {
  terminalId: string
  ref: string
  tenantId: string
  resourceStatus: ResourceStatusType
  orderId?: string
  orderStatus?: OrderStatusType
  creationTime: string
  updateTime: string
  serviceStartTime: string
  customerNote: string
  terminalDeviceType: TerminalDeviceType
  defaultGateway: TerminalDefaultGatewayType
  breakOut?: string[]
  breakOutDnsServers?: string[]
  interceptDnsServers?: string[]
  deliveryName: string
  deliveryCompanyName?: string
  deliveryDepartmentName: string
  deliveryPostalCode: string
  deliveryAddress: string
  deliveryAddressKana: string
  deliveryPhoneNumber: string
  deliveryDate: string
  removalName?: string
  removalCompanyName?: string
  removalDepartmentName?: string
  removalPostalCode?: string
  removalAddress?: string
  removalAddressKana?: string
  removalPhoneNumber?: string
  installationPostalCode: string
  installationAddress: string
  vpnId?: string
  ipoeId?: string
  ipoeIpv4Address?: string
  lanType: LanType
  mobileId?: string
  guarantee?: TerminalGuaranteeResponseType
  loopbackIpv4Address: string
  mobile?: {
    mobileId: string
    msisdn?: string
    picName: string
    picNameKana: string
    picPhoneNumber: string
    customerReceiptRequired: boolean
    callDetailDesired: boolean
    callDetailBreakdownSetting?: CallDetailBreakdownSettingType
    callDetailDestinationNumberSetting?: CallDetailBreakdownSettingType
    rat?: MobileRatType
    ipv4Address?: string
    assignedIpv4Addresses?: string[]
  }
  terminalDevices?: TerminalDeviceInfoType[]
  primaryCircuit: TerminalPrimaryCircuitType
  secondaryCircuit?: TerminalSecondaryCircuitType
  lans: TerminalLansType[]
  lanStaticRoutes?: TerminalLanStaticType[]
  wanStaticRoutes?: TerminalWanStaticType[]
  inet4OutFilters?: TerminalUserFilter
  vpnInFilters?: TerminalUserFilter
  vpnOutFilters?: TerminalUserFilter
  dhcpRelayServers?: TerminalDhcpRelayServerType[]
  trafficReportFlowAnalyzer: TrafficReportFlowAnalyzerType
  flowCollector: TerminalFlowCollectorResponseType
  threatDetection: TerminalThreatDetectionType
  behaviorDetection: TerminalBehaviorDetectionType
}
export type TerminalListResponse = {
  total: number
  offset: number
  terminals: TerminalResponse[]
}

export type BulkTerminalResponse = {
  bulkOrderId: string
  requestTime: string
}
export type ResourceSummaryTerminalListResponse = {
  total: number
  offset: number
  terminals: ResourceSummaryTerminalResponse[]
}

export type TerminalOperationType = {
  terminalId: string
  operation: OperationType
  status: OperationStatusType
  requestTime: string
  completedTime?: string
}
export type TerminalOperationResponse = {
  operations: TerminalOperationType[]
}

export type TerminalUtilOptionCountFlowCollectorResponse = {
  [SecurityOptionTypes.Plan3Months]: number
  [SecurityOptionTypes.Plan6Months]: number
  [SecurityOptionTypes.Plan12Months]: number
  [SecurityOptionTypes.NoSubscription]: number
  totalUsage: number
}

export type TerminalUtilOptionCountResponse = {
  total: number
  [TerminalUtilOptionCountOptionTypes.FlowCollector]?: TerminalUtilOptionCountFlowCollectorResponse
  [TerminalUtilOptionCountOptionTypes.ThreatDetection]?: {
    [SecurityOptionTypes.Plan3Months]: number
    [SecurityOptionTypes.Plan12Months]: number
    [SecurityOptionTypes.NoSubscription]: number
  }
  [TerminalUtilOptionCountOptionTypes.BehaviorDetection]?: {
    [BehaviorDetectionPlanTypes.Lite]: number
    [BehaviorDetectionPlanTypes.Standard]: number
  }
}
