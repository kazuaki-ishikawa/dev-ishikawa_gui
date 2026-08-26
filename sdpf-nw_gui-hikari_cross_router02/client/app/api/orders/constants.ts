export const OrderResourceTypes = {
  Fic: 'fic-connection',
  Guarantee: 'guarantee',
  Ipoe: 'ipoe',
  Terminal: 'terminal',
  SelfTerminal: 'self-terminal',
  Vpn: 'vpn',
  UnoConnection: 'uno-connection',
  Contractor: 'contractor-setting',
  Mobile: 'mobile-setting',
  RegistrationAddress: 'registration-address',
  PhoneTicketingSupport: 'phone-ticketing-support',
  BreakOutList: 'break-out-list',
  SecurityHelpDesk: 'security-help-desk',
  RinkMobile: 'rink-mobile',
  Msb: 'edr-lite',
} as const

export const OrderRequestTypes = {
  Create: 'create',
  Update: 'update',
  Delete: 'delete',
} as const

export const RinkMobileOrderTypes = {
  // Rink Connection
  RinkConnectionCreate: 'create-network-rinkConnection',
  RinkConnectionUpdateConnectionType: 'change-network-connectionType',
  RinkConnectionUpdateDnsServer: 'change-network-dnsIpAddress',
  RinkConnectionUpdateLocalBreakOut: 'change-network-localBreakOut',
  RinkConnectionUpdateVpnConnectionPrefix: 'change-network-vpnConnectionPrefix',
  RinkConnectionDelete: 'delete-network-rinkConnection',
  // Rink Line
  RinkLineCreate: 'create-line-lines',
  RinkLineUpdatePlan: 'change-line-plan',
  RinkLineUpdateAuthentication: 'change-line-authentication',
  RinkLineUpdateLinePrefix: 'change-line-rinkIpAddress',
  RinkLineUpdateAdditionalLimit: 'change-line-additionalLimit',
  RinkLineUpdateReissue: 'change-line-reissue',
  RinkLineUpdateDeactivate: 'change-line-deactivate',
  RinkLineUpdateReactivate: 'change-line-reactivate',
  RinkLineDelete: 'delete-line-lines',
  // Rink Line Group
  RinkLineGroupCreate: 'create-line-lineGroup',
  RinkLineGroupUpdateAdd: 'change-line-lineGroupMemberAdd',
  RinkLineGroupUpdateRemove: 'change-line-lineGroupMemberDelete',
  RinkLineGroupDelete: 'delete-line-lineGroup',
  // Rink Device
  RinkDeviceCreate: 'create-line-devices',
} as const
