export const TenantPages = {
  Monitoring: 'monitoring',
  SecurityContracts: 'security-contracts',
  Idaas: 'idaas',
  Msb: 'msb',
  News: 'news',
  Terminals: 'terminals',
  SelfTerminals: 'self-terminals',
  BreakOutLists: 'break-out-lists',
  FirmwareUpdateBulk: 'terminals-firmware',
  Guarantees: 'guarantees',
  Ipoes: 'ipoes',
  Vpns: 'vpns',
  Fic: 'fic-connections',
  Supports: 'supports',
  Contracts: 'contracts',
  Orders: 'orders',
  QuickSetup: 'quick-setup',
  RinkMobile: 'rink-mobile',
} as const

export const MonitoringPages = {
  Summary: 'summary',
  OperationStatus: 'operation-status',
  AlertDetails: 'alert-details',
  TrafficDetails: 'traffic-details',
  GuaranteeMaintenance: 'guarantee-maintenance',
} as const

export const SecurityContractsPages = {
  Summary: 'summary',
  ThreatDetections: 'threat-detections',
  ThreatDetectionFilters: 'threat-detection-filters',
  FlowCollectors: 'flow-collectors',
  ThreatDetectionSharedThreatDetections: 'threat-detection-shared-threat-detections',
  ThreatDetectionShared: 'threat-detection-shared',
  SecurityHelpDesk: 'security-help-desk',
} as const

export const ContractsPages = {
  Contractor: 'contractor',
  Mobile: 'mobile',
  TrafficMonitoring: 'traffic-monitoring',
  GuaranteeTermsOfService: 'guarantee-terms-of-service',
  SecurityTrafficReportFlowAnalyzer: 'security-traffic-report-flow-analyzer',
} as const

export const GuaranteePages = {
  Circuits: 'circuits',
  AddressRegistrationRequest: 'address-registration-request',
} as const

export const SupportPages = {
  PhoneTicketingSupport: 'phone-ticketing-support',
  PaidManagedService: 'paid-managed-service',
} as const

export const RinkMobilePages = {
  Contracts: 'contracts',
  Connections: 'connections',
  Lines: 'lines',
  LineGroups: 'line-groups',
  Devices: 'devices',
} as const

export const IdaasPages = {
  AuthenticationRiskReports: 'authentication-risk-reports',
  APIKey: 'api-key',
} as const
