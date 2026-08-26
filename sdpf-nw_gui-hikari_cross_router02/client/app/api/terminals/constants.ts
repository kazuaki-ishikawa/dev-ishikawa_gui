import { BehaviorDetectionOptionTypes, SecurityOptionTypes, TerminalDeviceTypes } from '../constants'
import type {
  TerminalDeviceType,
  TerminalFlowCollectorPlanType,
  TerminalThreatDetectionPlanType,
  TerminalBehaviorDetectionPlanType,
  TrafficReportFlowAnalyzerPlanType,
} from '../types'

export const TERMINAL_MAX_LIMIT = 1000
export const TERMINAL_MAX_SELECTABLE_LIMIT = 100
export const TERMINAL_LINK = {
  TICKET: 'https://sdpf.ntt.com/services/docs/rink/tutorials/inquiry.html',
  BASE: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/function/terminal.html#router-choice',
  CIRCUIT_TYPE: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/function/terminal.html#menu-choice',
  RESOURCE_SETTINGS_IPOE:
    'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/function/terminal.html#resourcesetting',
  RESOURCE_SETTINGS_GUARANTEE:
    'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/function/terminal.html#resourcesetting-iwan',
  MOBILE: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/function/terminal.html#application',
  DETAIL_SETTING: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/function/terminal.html#detailsetting',
  DELIVERY: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/function/terminal.html#delivery',
  CONTRACTOR: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/initial_setting/contractinformation.html',
  DELIVERY_DATE: 'https://sdpf.ntt.com/faq/rink0071/',
  CHANGE_IWAN: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/change/change_iwan.html',
  PRICE: 'https://sdpf.ntt.com/services/rink/pricing/#ntt_price_list',
  WAN_SECURITY_TOP: 'https://sdpf.ntt.com/services/wan-security/',
  WAN_SECURITY_PRICE: 'https://sdpf.ntt.com/services/wan-security/pricing/#price_list',
  TRAFFIC_REPORT_FLOW_ANALYZER_TOP:
    'https://sdpf.ntt.com/services/docs/rink/service-descriptions/menu/option_detail/traffic_report.html',
  FIRMWARE_VERSION: 'https://sdpf.ntt.com/services/docs/rink/service-descriptions/menu/rink_menu/router.html#id3',
  FIRST_MOBILE: 'https://sdpf.ntt.com/services/rink/pricing/#docomo_cost_confirm',
  CHANGE_ROUTER: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/change/change_router.html',
  BASE_SETTING: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/function/terminal.html#basesetting',
  NETWORK_SETTING: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/function/terminal.html#networksetting',
  IPOE: 'https://sdpf.ntt.com/services/docs/rink/tutorials/portal/application_information/ipoe.html',
  RINK_0143: 'https://sdpf.ntt.com/faq/rink0143/',
  RINK_0153: 'https://sdpf.ntt.com/faq/rink0153/',
  INTERFACE: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/change/change_router.html#lan',
} as const

export const TERMINAL_PUT_PARAMETERS_WITHOUT_MOBILE = [
  'customerNote',
  'breakOut',
  'interceptDnsServers',
  'installationPostalCode',
  'installationAddress',
  'primaryCircuitType',
  'secondaryCircuitType',
  'guarantee',
  'ipoeId',
  'vpnId',
  'loopbackIpv4Address',
  'lanType',
  'lans',
  'lanStaticRoutes',
  'defaultGateway',
  'wanStaticRoutes',
  'dhcpRelayServers',
  'vpnInFilters',
  'vpnOutFilters',
  'inet4OutFilters',
  'trafficReportFlowAnalyzer',
  'threatDetection',
  'flowCollector',
  'behaviorDetection',
] as const

export const TERMINAL_EDIT_BULK_KEYS = [
  'vpnId',
  'breakOut',
  'interceptDnsServers',
  'nexthopNetwork',
  'wanStaticRoutes',
  'vpnInFilters',
  'vpnOutFilters',
  'inet4OutFilters',
  'dhcp',
  'trafficReportFlowAnalyzerPlan',
  'trafficReportFlowAnalyzerAlert',
  'threatDetectionPlan',
  'flowCollectorPlan',
  'behaviorDetectionPlan',
] as const

export const MOBILE_INFORMATION_KEYS = [
  'rat',
  'corporateVerificationMethod',
  'japanCorporateNumber',
  'contractIdentificationDocumentType',
  'contractIdentificationDocumentId',
  'picEmploymentDocumentType',
  'picEmploymentDocumentId',
  'networkPinCode',
  'customerReceiptRequired',
  'callDetailDesired',
  'callDetailBreakdownSetting',
  'callDetailDestinationNumberSetting',
] as const
export const MOBILE_PIC_INFORMATION_KEYS = [
  'picName',
  'picNameKana',
  'picPostalCode',
  'picAddress',
  'picAddressKana',
  'picPhoneNumber',
  'picDateOfBirth',
  'picIdentificationDocumentType',
  'picIdentificationNumber',
  'picIdentificationFrontDocumentId',
  'picIdentificationBackDocumentId',
  'picIdentificationAdditionalDocumentId',
  'picAuxiliaryIdentificationDocumentType',
  'picAuxiliaryIdentificationDocumentId',
  'jpkiRequestId',
] as const

export const MOBILE_DOCUMENT_FILES = [
  'contractIdentificationDocumentId',
  'picIdentificationFrontDocumentId',
  'picIdentificationBackDocumentId',
  'picIdentificationAdditionalDocumentId',
  'picAuxiliaryIdentificationDocumentId',
  'picEmploymentDocumentId',
] as const

export const PIC_REMOVE_MOBILE_RESPONSES = ['picName', 'picNameKana', 'picPhoneNumber'] as const
export const REMOVE_MOBILE_PARAMETERS = [
  'japanCorporateNumber',
  'picName',
  'picNameKana',
  'picPostalCode',
  'picAddress',
  'picAddressKana',
  'picPhoneNumber',
  'picDateOfBirth',
  'contractIdentificationDocumentType',
  'picIdentificationNumber',
  'contractIdentificationDocumentId',
  'picIdentificationDocumentType',
  'picIdentificationFrontDocumentId',
  'picIdentificationBackDocumentId',
  'picIdentificationAdditionalDocumentId',
  'picAuxiliaryIdentificationDocumentType',
  'picAuxiliaryIdentificationDocumentId',
  'picEmploymentDocumentType',
  'picEmployeeCode',
  'picEmploymentDocumentId',
] as const
export const BULK_CSV_MOBILE_COLUMN = [
  'japanCorporateNumber',
  'contractIdentificationDocumentType',
  'picName',
  'picNameKana',
  'picPostalCode',
  'picAddress',
  'picAddressKana',
  'picPhoneNumber',
  'picDateOfBirth',
  'picIdentificationDocumentType',
  'picIdentificationNumber',
  'picAuxiliaryIdentificationDocumentType',
  'picEmployeeCode',
  'picEmploymentDocumentType',
  'networkPinCode',
  'customerReceiptRequired',
  'callDetailDesired',
  'callDetailBreakdownSetting',
  'callDetailDestinationNumberSetting',
  'rat',
] as const
export const BULK_CSV_TERMINAL_COLUMN = [
  'customerNote',
  'breakOut',
  'interceptDnsServers',
  'deliveryName',
  'deliveryCompanyName',
  'deliveryDepartmentName',
  'deliveryPostalCode',
  'deliveryAddress',
  'deliveryPhoneNumber',
  'deliveryAddressKana',
  'deliveryDate',
  'installationPostalCode',
  'installationAddress',
  'ipoeId',
  'vpnId',
  'loopbackIpv4Address',
  'lanType',
  'lanIpv4AddressPrefixLength', // lans.ipv4Address/lans.ipv4PrefixLength
  'defaultGatewayNexthopNetwork',
  'defaultGatewayNexthopIpv4Address',
  'defaultGatewayVpnRouting',
  'dhcpServerIpv4AddressRangesStart',
  'dhcpServerIpv4AddressRangesEnd',
  'dhcpServerDomain',
  'dhcpServerPrimaryDnsServer',
  'dhcpServerSecondaryDnsServer',
  'dhcpRelayServersServerIpv4Address',
  'guaranteeId',
  'vpnActConnectedIpv4Prefix',
  'vpnSbyConnectedIpv4Prefix',
  'trafficReportFlowAnalyzerPlan',
  'trafficReportFlowAnalyzerAlert',
  'threatDetectionPlan',
  'flowCollectorPlan',
  'behaviorDetectionPlan',
] as const

export const TerminalCreationSteps = {
  TerminalAndMobileInformation: 1,
  PicInformation: 2,
  Confirmation: 3,
} as const

export const CorporateVerificationMethodTypes = {
  CorporateNumberVerification: 'corporateNumberVerification',
  InPersonVerification: 'inPersonVerification',
} as const

export const PicVerificationMethodTypes = {
  MyNumberCard: 'myNumberCard',
  InPersonVerification: 'inPersonVerification',
} as const

export const ContractIdentificationDocumentTypes = {
  SealCertificate: 'sealCertificate',
  CertificateOfPresentMatters: 'certificateOfPresentMatters',
  CertifiedCopyOfRegister: 'certifiedCopyOfRegister',
} as const

export const PicIdentificationDocumentTypes = {
  IndivisualNumberCard: 'indivisualNumberCard',
  DriversLisence: 'driversLisence',
  DrivingHistoryCertificate: 'drivingHistoryCertificate',
  PhysicalDisabilityCertificate: 'physicalDisabilityCertificate',
  MedicalRehabilitationHandbook: 'medicalRehabilitationHandbook',
  MentalDisabilityCertificate: 'mentalDisabilityCertificate',
  BasicResidentRegistrationCard: 'basicResidentRegistrationCard',
  AlienRegistrationCard: 'alienRegistrationCard',
  ResidenceCardAndPassport: 'residenceCardAndPassport',
} as const
export const AuxiliaryIdentificationDocumentTypes = {
  UtilityBillReceipt: 'utilityBillReceipt',
  ResidentCertificate: 'residentCertificate',
} as const
export const EmploymentDocumentTypes = {
  EmployeeIdCard: 'employeeIdCard',
  BusinessCard: 'businessCard',
  PowerOfAttorney: 'powerOfAttorney',
} as const

export const CallDetailBreakdownSettingTypes = {
  ShowAll: 'showAll',
  HideLast4Digits: 'hideLast4Digits',
} as const

export const NetworkTypes = {
  Internet: 'internet',
  Vpn: 'vpn',
  Lan: 'lan',
} as const
export const ActionTypes = {
  Accept: 'accept',
  Discard: 'discard',
} as const
export const LansTypes = {
  Primary: 'primary',
  Secondary: 'secondary',
} as const
export const LansPortNumberList = [1, 2, 3] as const

export const NatTypes = {
  Nat: 'nat',
  PartialNat: 'partialNat',
} as const
export const NatTypesText = {
  [NatTypes.Nat]: 'NAT',
  [NatTypes.PartialNat]: 'Partial NAT',
}
export const LanTypes = {
  SwitchPort: 'switchPort',
  RoutedPort: 'routedPort',
} as const

export const DhcpTypes = {
  None: 'none',
  Server: 'server',
  Relay: 'relay',
} as const

export const FirmwareVersionTypes = {
  Latest: 'latest',
  FirmwareUpdateRecommended: 'firmwareUpdateRecommended',
  FirmwareUpdateRequired: 'firmwareUpdateRequired',
} as const

export const OperationTypes = {
  Reboot: 'reboot',
  FirmwareUpdate: 'firmwareUpdate',
  FirmwareUpdateNoReboot: 'firmwareUpdateNoReboot',
  BreakOutListUpdate: 'breakOutListUpdate',
  Switchover: 'switchover',
  Switchback: 'switchback',
} as const
export const OperationStatusTypes = {
  Processing: 'processing',
  Completed: 'completed',
  Failed: 'failed',
  Waiting: 'waiting',
  Cancelled: 'cancelled',
} as const

export const TerminalUtilOptionCountOptionTypes = {
  FlowCollector: 'flowCollector',
  ThreatDetection: 'threatDetection',
  BehaviorDetection: 'behaviorDetection',
} as const

export const initialMobileInputData = {
  rat: 'auto',
  japanCorporateNumber: '',
  contractIdentificationDocumentType: '',
  contractIdentificationDocumentId: '',
  picName: '',
  picNameKana: '',
  picPostalCode: '',
  picAddress: '',
  picAddressKana: '',
  picPhoneNumber: '',
  picDateOfBirth: '',
  picIdentificationDocumentType: '',
  picIdentificationNumber: '',
  picIdentificationFrontDocumentId: '',
  picIdentificationBackDocumentId: '',
  picIdentificationAdditionalDocumentId: '',
  picAuxiliaryIdentificationDocumentType: '',
  picAuxiliaryIdentificationDocumentId: '',
  picEmploymentDocumentType: '',
  picEmployeeCode: '',
  picEmploymentDocumentId: '',
  networkPinCode: '',
  customerReceiptRequired: '',
  callDetailDesired: '',
  callDetailBreakdownSetting: '',
  callDetailDestinationNumberSetting: '',
  corporateVerificationMethod: '',
  jpkiRequestId: '',
}
export const initialMobileValid = {
  rat: true,
  japanCorporateNumber: false,
  contractIdentificationDocumentType: false,
  contractIdentificationDocumentId: false,
  picName: false,
  picNameKana: false,
  picPostalCode: false,
  picAddress: false,
  picAddressKana: false,
  picPhoneNumber: false,
  picDateOfBirth: false,
  picIdentificationDocumentType: false,
  picIdentificationNumber: false,
  picIdentificationFrontDocumentId: false,
  picIdentificationBackDocumentId: false,
  picIdentificationAdditionalDocumentId: true,
  picAuxiliaryIdentificationDocumentType: true,
  picAuxiliaryIdentificationDocumentId: true,
  picEmploymentDocumentType: false,
  picEmployeeCode: true,
  picEmploymentDocumentId: false,
  networkPinCode: false,
  customerReceiptRequired: false,
  callDetailDesired: false,
  callDetailBreakdownSetting: true,
  callDetailDestinationNumberSetting: true,
  corporateVerificationMethod: true,
  jpkiRequestId: true,
}

export const initialTerminalGuaranteeInputData = {
  guaranteeId: '',
  vpnActConnectedIpv4Prefix: '',
  vpnSbyConnectedIpv4Prefix: '',
}
export const initialTerminalGuaranteeInputValid = {
  guaranteeId: false,
  vpnActConnectedIpv4Prefix: true,
  vpnSbyConnectedIpv4Prefix: true,
}

export const initialDhcpServerInputData = {
  ipv4AddressRanges: [] as Array<[string, string]>,
  domain: '',
  primaryDnsServer: '',
  secondaryDnsServer: '',
  primaryWinsServer: '',
  secondaryWinsServer: '',
}
export const initialDhcpServerValid = {
  ipv4AddressRanges: true,
  domain: true,
  primaryDnsServer: true,
  secondaryDnsServer: true,
  primaryWinsServer: true,
  secondaryWinsServer: true,
}

const initialDefaultGatewayInputData = {
  nexthopNetwork: '',
  nexthopIpv4Address: '',
  vpnRouting: '',
}
const initialDefaultGatewayValid = {
  nexthopNetwork: false,
  nexthopIpv4Address: true,
  vpnRouting: true,
}
export const initialVpnNatsInputData = {
  type: '',
  innerIpv4Prefix: '',
  outerIpv4Prefix: '',
}
export const initialVpnNatsValid = {
  type: false,
  innerIpv4Prefix: false,
  outerIpv4Prefix: false,
}

export const initialFiltersInputData = {
  defaultPolicy: '',
  accessControlList: [] as (typeof initialAccessControlInputData)[],
}

export const initialLansInputData = {
  type: '',
  portNumber: '',
  ipv4Address: '',
  ipv4PrefixLength: '',
  vpnRouting: '',
  vpnNats: [] as (typeof initialVpnNatsInputData)[],
  dhcpServer: { ...initialDhcpServerInputData },
  lanInFilters: { ...initialFiltersInputData },
}
export const initialLansValid = {
  type: false,
  portNumber: true,
  ipv4Address: false,
  ipv4PrefixLength: false,
  vpnRouting: false,
  vpnNats: true,
  dhcpServer: { ...initialDhcpServerValid },
  lanInFilters: true,
}

const initialLanStaticRoutesCommonInputData = {
  destinationIpv4Prefix: '',
  nexthopIpv4Address: '',
  vpnRouting: '',
}
export const initialLanStaticRoutesInputData = {
  ...initialLanStaticRoutesCommonInputData,
  vpnNats: [] as (typeof initialVpnNatsInputData)[],
}
export const initialLanStaticRoutesValid = {
  destinationIpv4Prefix: false,
  nexthopIpv4Address: false,
  vpnRouting: false,
  vpnNats: true,
}
export const initialWanStaticRoutesInputData = {
  destinationIpv4Prefix: '',
  nexthopNetwork: '',
}
export const initialWanStaticRoutesValid = {
  destinationIpv4Prefix: false,
  nexthopNetwork: false,
}

export const initialAccessControlInputData = {
  protocol: '',
  sourcePort: '',
  destinationPort: '',
  sourceIpv4Prefix: '',
  destinationIpv4Prefix: '',
  action: '',
}
export const initialAccessControlValid = {
  protocol: false,
  sourcePort: true,
  destinationPort: true,
  sourceIpv4Prefix: false,
  destinationIpv4Prefix: false,
  action: false,
}

export const initialRemovalInputData = {
  removalName: '',
  removalCompanyName: '',
  removalDepartmentName: '',
  removalPostalCode: '',
  removalAddress: '',
  removalAddressKana: '',
  removalPhoneNumber: '',
}

export const initialRemovalValid = {
  removalName: false,
  removalCompanyName: true,
  removalDepartmentName: false,
  removalPostalCode: false,
  removalAddress: false,
  removalAddressKana: false,
  removalPhoneNumber: false,
}

export const initialTerminalInputData = {
  customerNote: '',
  terminalDeviceType: TerminalDeviceTypes.Router01 as TerminalDeviceType,
  breakOut: [] as string[],
  interceptDnsServers: [] as string[],
  deliveryName: '',
  deliveryCompanyName: '',
  deliveryDepartmentName: '',
  deliveryPhoneNumber: '',
  deliveryPostalCode: '',
  deliveryAddress: '',
  deliveryAddressKana: '',
  deliveryDate: '',
  installationPostalCode: '',
  installationAddress: '',
  primaryCircuitType: '',
  secondaryCircuitType: '',
  guarantee: { ...initialTerminalGuaranteeInputData },
  ipoeId: '',
  vpnId: '',
  loopbackIpv4Address: '',
  lanType: '',
  lans: [] as (typeof initialLansInputData)[],
  lanStaticRoutes: [] as (typeof initialLanStaticRoutesInputData)[],
  wanStaticRoutes: [] as (typeof initialWanStaticRoutesInputData)[],
  defaultGateway: { ...initialDefaultGatewayInputData },
  vpnInFilters: { ...initialFiltersInputData },
  vpnOutFilters: { ...initialFiltersInputData },
  inet4OutFilters: { ...initialFiltersInputData },
  dhcpRelayServers: [] as string[],
  trafficReportFlowAnalyzer: { trafficReportFlowAnalyzerPlan: '', trafficReportFlowAnalyzerAlert: '' },
  threatDetection: { threatDetectionPlan: SecurityOptionTypes.Plan3Months as TerminalThreatDetectionPlanType },
  flowCollector: { flowCollectorPlan: SecurityOptionTypes.Plan3Months as TerminalFlowCollectorPlanType },
  behaviorDetection: {
    behaviorDetectionPlan: BehaviorDetectionOptionTypes.NoSubscription as TerminalBehaviorDetectionPlanType,
  },
}
export const initialTerminalValid = {
  customerNote: false,
  terminalDeviceType: true,
  breakOut: true,
  interceptDnsServers: true,
  deliveryName: false,
  deliveryCompanyName: true,
  deliveryDepartmentName: false,
  deliveryPhoneNumber: false,
  deliveryPostalCode: false,
  deliveryAddress: false,
  deliveryAddressKana: false,
  deliveryDate: false,
  installationPostalCode: false,
  installationAddress: false,
  primaryCircuitType: false,
  secondaryCircuitType: true,
  guarantee: { ...initialTerminalGuaranteeInputValid },
  ipoeId: true,
  vpnId: false,
  loopbackIpv4Address: false,
  lanType: false,
  lans: false,
  lanStaticRoutes: true,
  wanStaticRoutes: true,
  defaultGateway: { ...initialDefaultGatewayValid },
  vpnInFilters: true,
  vpnOutFilters: true,
  inet4OutFilters: true,
  dhcpRelayServers: true,
  trafficReportFlowAnalyzer: { trafficReportFlowAnalyzerPlan: true, trafficReportFlowAnalyzerAlert: true },
  threatDetection: { threatDetectionPlan: true },
  flowCollector: { flowCollectorPlan: true },
  behaviorDetection: { behaviorDetectionPlan: true },
}

export const initialEditBulkPutKeyParams = Object.fromEntries(
  TERMINAL_EDIT_BULK_KEYS.map(key => [key, false]),
) as Record<(typeof TERMINAL_EDIT_BULK_KEYS)[number], boolean>
export const initialEditBulkTerminalInputData = {
  terminalIds: [] as string[],
  vpnId: '',
  breakOut: [] as string[],
  interceptDnsServers: [] as string[],
  defaultGateway: { ...initialDefaultGatewayInputData },
  wanStaticRoutes: [] as (typeof initialWanStaticRoutesInputData)[],
  vpnInFilters: { ...initialFiltersInputData },
  vpnOutFilters: { ...initialFiltersInputData },
  inet4OutFilters: { ...initialFiltersInputData },
  dhcpServer: {
    domain: '',
    primaryDnsServer: '',
    secondaryDnsServer: '',
    primaryWinsServer: '',
    secondaryWinsServer: '',
  },
  dhcpRelayServers: [] as string[],
  trafficReportFlowAnalyzer: {
    trafficReportFlowAnalyzerPlan: '' as TrafficReportFlowAnalyzerPlanType | '',
    trafficReportFlowAnalyzerAlert: '',
  },
  threatDetectionPlan: '' as TerminalThreatDetectionPlanType | '',
  flowCollectorPlan: '' as TerminalFlowCollectorPlanType | '',
  behaviorDetectionPlan: '' as TerminalBehaviorDetectionPlanType | '',
}
export const initialEditBulkTerminalValid = {
  terminalIds: true,
  vpnId: true,
  breakOut: true,
  interceptDnsServers: true,
  defaultGateway: { nexthopNetwork: true, nexthopIpv4Address: true, vpnRouting: true },
  wanStaticRoutes: true,
  vpnInFilters: true,
  vpnOutFilters: true,
  inet4OutFilters: true,
  dhcpServer: {
    domain: true,
    primaryDnsServer: true,
    secondaryDnsServer: true,
    primaryWinsServer: true,
    secondaryWinsServer: true,
  },
  dhcpRelayServers: true,
  trafficReportFlowAnalyzer: {
    trafficReportFlowAnalyzerPlan: true,
    trafficReportFlowAnalyzerAlert: true,
  },
  threatDetectionPlan: true,
  flowCollectorPlan: true,
  behaviorDetectionPlan: true,
}

export const initialTermsOfServiceAgreement = [
  { key: 'vpn-id' as const, value: false },
  { key: 'break-out' as const, value: false },
  { key: 'wan-security-options' as const, value: false },
  { key: 'traffic-report-flow-analyzer' as const, value: false },
]

export const initialConfirmationChecked = [
  {
    key: 'ipoe' as const,
    keypath: 'terminals.confirm.checkIpoe',
    value: false,
  },
  { key: 'vpn-id' as const, keypath: 'terminals.note.vpnId', value: false },
  {
    key: 'contractor-address' as const,
    value: false,
    keypath: 'terminals.confirm.checkContractorAddress',
    link: TERMINAL_LINK.CONTRACTOR,
  },
  {
    key: 'pic-information' as const,
    value: false,
    keypath: 'terminals.confirm.checkPicInformation',
    link: TERMINAL_LINK.BASE,
  },
  {
    key: 'loopback-ipv4-address' as const,
    value: false,
    keypath: 'terminals.confirm.checkLoopback',
    link: TERMINAL_LINK.BASE,
  },
]
