export const SELECTABLE_LINE_MAX_COUNTS = 254 as const

export const RinkLineCreateCsvIndex = {
  Plan: 1,
  AccessType: 3,
  DeviceName: 5,
  AuthenticationId: 9,
  AuthenticationPassword: 10,
  ActIpAddress: 11,
  SbyIpAddress: 12,
} as const

export const RinkLineAdditionalLimitTypes = {
  '0.5GB': 536870912,
  '1GB': 1073741824,
  '2GB': 2147483648,
  '3GB': 3221225472,
  '4GB': 4294967296,
  '5GB': 5368709120,
  '6GB': 6442450944,
  '7GB': 7516192768,
  '8GB': 8589934592,
  '9GB': 9663676416,
  '10GB': 10737418240,
  '20GB': 21474836480,
  '30GB': 32212254720,
  '40GB': 42949672960,
  '50GB': 53687091200,
} as const

export const RinkLineEditMenuTypes = {
  AdditionalLimit: 'additional-limit',
  Authentication: 'authentication',
  Deactivate: 'deactivate',
  LinePrefix: 'line-prefix',
  Plan: 'plan',
  Reactivate: 'reactivate',
  Reissue: 'reissue',
} as const
export const RinkLineApplicationTypes = {
  Form: 'form',
  Csv: 'csv',
} as const

export const RinkLineAccessTypes = {
  Lte: 'LTE',
  Nsa5g: '5GNSA',
} as const

export const RinkLineAvailableDateOrderTypes = {
  CreateLineLines: 'create-line-lines',
  CreateLineDevices: 'create-line-devices',
  ChangeLineReissue: 'change-line-reissue',
  DeleteLineLines: 'delete-line-lines',
} as const

export const RinkLineStatusTypes = {
  Active: 'active',
  Suspend: 'suspend',
  Deleted: 'deleted',
} as const

export const initialRinkLineListInputData = {
  planLimitAlias: '',
  deviceNameAlias: '',
  authenticationId: '',
  authenticationPassword: '',
  actIpAddress: '',
  sbyIpAddress: '',
  accessType: RinkLineAccessTypes.Lte as (typeof RinkLineAccessTypes)[keyof typeof RinkLineAccessTypes],
}
export const initialRinkLineListValid = {
  planLimitAlias: false,
  deviceNameAlias: false,
  authenticationId: false,
  authenticationPassword: false,
  actIpAddress: false,
  sbyIpAddress: true,
  accessType: true,
}

export const initialShippingInfoInputData = {
  requestDate: '',
  shippingPostalCode: '',
  shippingPrefecture: '',
  shippingCity: '',
  shippingCityAdditionalInfo: '',
  shippingAddressBlock: '',
  shippingAddressNumber: '',
  shippingBuilding: '',
  packageRecipient: '',
  phoneNumber: '',
}
export const initialShippingInfoValid = {
  requestDate: false,
  shippingPostalCode: false,
  shippingPrefecture: false,
  shippingCity: false,
  shippingCityAdditionalInfo: true,
  shippingAddressBlock: false,
  shippingAddressNumber: false,
  shippingBuilding: true,
  packageRecipient: false,
  phoneNumber: false,
}

export const initialRinkLineEditInputData = {
  additionalLimit: '',
  authenticationId: '',
  authenticationPassword: '',
  actIpAddress: '',
  sbyIpAddress: '',
  planLimitAlias: '',
}
export const initialRinkLineEditValid = {
  additionalLimit: false,
  authenticationId: false,
  authenticationPassword: false,
  actIpAddress: false,
  sbyIpAddress: true,
  planLimitAlias: false,
}
