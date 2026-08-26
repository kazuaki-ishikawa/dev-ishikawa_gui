// 重複は不可
export const RouteName = {
  Index: 'Nova',
  Home: 'Home',
  Monitoring: {
    AlertList: 'AlertList',
    FicRoutes: 'FicRoutes',
    OperationStatus: 'OperationStatus',
    OperationStatusDetail: 'OperationStatusDetail',
    SelfCheck: 'SelfCheck',
    TrafficList: 'TrafficList',
  },
  Site: {
    List: 'SiteList',
  },
  CompositionPattern: {
    List: 'CompositionPatternList',
  },
  Guarantee: {
    List: 'GuaranteeList',
    Detail: 'GuaranteeDetail',
  },
  Ipoe: {
    List: 'IpoeList',
    Detail: 'IpoeDetail',
    Create: 'IpoeCreate',
    Delete: 'IpoeDelete',
  },
  SelfTerminal: {
    Detail: 'SelfTerminalDetail',
  },
  Terminal: {
    List: 'TerminalList',
    Detail: 'TerminalDetail',
    Create: 'TerminalCreate',
  },
  Vpn: {
    List: 'VpnList',
    Create: 'VpnCreate',
    Delete: 'VpnDelete',
    Detail: 'VpnDetail',
    Edit: 'VpnEdit',
  },
  UnoConnection: {
    List: 'UnoConnectionList',
    Create: 'UnoConnectionCreate',
    Delete: 'UnoConnectionDelete',
    Detail: 'UnoConnectionDetail',
  },
  BreakOut: {
    List: 'BreakOutList',
    Create: 'BreakOutCreate',
    Detail: 'BreakOutDetail',
    Edit: 'BreakOutEdit',
    Apply: 'BreakOutApply',
  },
  FicConnection: {
    List: 'FicConnectionList',
    Create: 'FicConnectionCreate',
    Delete: 'FicConnectionDelete',
    Detail: 'FicConnectionDetail',
    Edit: 'FicConnectionEdit',
  },
  RinkMobileContract: {
    List: 'RinkMobileContractList',
  },
  RinkMobileLine: {
    List: 'RinkMobileLineList',
  },
  RinkMobileGroup: {
    List: 'RinkMobileGroupList',
  },
  RinkMobileDevice: {
    List: 'RinkMobileDeviceList',
  },
  Threat: {
    Detections: 'ThreatDetections',
    Filters: 'ThreatDetectionFilters',
    Shared: 'ThreatDetectionShared',
    FlowCollector: 'FlowCollector',
  },
  WanSecurity: {
    List: 'WanSecurityList',
  },
  IDaaS: {
    ApiKeySetting: 'IDaaSApiKeySetting',
    AuthenticationRiskReports: 'IDaaSAuthenticationRiskReports',
  },
  EDR: {
    Light: 'EDRLight',
  },
  Support: {
    List: 'SupportList',
    SecurityHelpDesk: 'SupportSecurityHelpDesk',
  },
  News: {
    List: 'NewsList',
  },
  MaintenanceInformation: {
    Guarantee: 'MaintenanceInformationGuarantee',
  },
  Contractor: {
    Detail: 'ContractorDetail',
  },
  BillingManagement: {
    List: 'BillingManagementList',
  },
  Order: {
    List: 'OrderList',
    Detail: 'OrderDetail',
  },
  External: {
    // TODO: 後でURLにする/重複する場合はまた仕様を考える
    BehaviorDetection: 'BehaviorDetection',
    FlexibleSecureWebGateway: 'FlexibleSecureWebGateway',
    VUtm2: 'VUtm2',
    MenloProxy: 'MenloProxy',
    FlexibleInterconnectPremium: 'FlexibleInterconnectPremium',
    FlexibleInterconnect: 'FlexibleInterconnect',
    PrismaAccess: 'PrismaAccess',
    CatoNetworkAccess: 'CatoNetworkAccess',
    AmazonLeo: 'AmazonLeo',
    RemoteAccess: 'RemoteAccess',
    LanSecurity: 'LanSecurity',
    KnowledgeCenter: 'KnowledgeCenter',
    MaintenanceInformation: 'MaintenanceInformation',
  },
}
