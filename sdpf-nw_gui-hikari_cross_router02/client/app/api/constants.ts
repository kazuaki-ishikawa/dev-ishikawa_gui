export const SortDirectionTypes = {
  Asc: 'asc',
  Desc: 'desc',
} as const

export const BreakOutTypes = {
  Teams: 'teams',
  Zoom: 'zoom',
  Webex: 'webex',
  WindowsUpdate: 'windowsUpdate',
  GoogleMeet: 'googleMeet',
  Microsoft365NotTeams: 'microsoft365NotTeams',
  Microsoft365: 'microsoft365',
  Box: 'box',
} as const

export const OrderStatusTypes = {
  Applied: 'applied',
  Processing: 'processing',
  Completed: 'completed',
  Canceled: 'canceled',
  Rejected: 'rejected',
  Aborted: 'aborted',
} as const

export const ResourceStatusTypes = {
  Inactive: 'inactive',
  Active: 'active',
  Terminated: 'terminated',
} as const
export const ResourceStatusOptions = Object.values(ResourceStatusTypes).map(value => ({ text: value, value }))

export const AddressFamilyTypes = {
  Ipv4: 'IPv4',
  Ipv6: 'IPv6',
} as const
export const AddressFamilyOptions = Object.values(AddressFamilyTypes).map(value => ({ text: value, value }))

export const CircuitTypes = {
  Guarantee: 'guarantee',
  Ipoe: 'ipoe',
  Mobile: 'mobile',
} as const

export const TerminalTypes = {
  Rental: 'rentalTerminal',
  Self: 'selfTerminal',
} as const
export const TerminalDeviceTypes = {
  Router01: 'router01',
  Router02: 'router02',
} as const
export const TrafficReportFlowAnalyzerPlanTypes = {
  NoSubscription: 'noSubscription',
  FreePlan: '5GB',
  PaidPlan: ['10GB', '20GB', '30GB', '40GB', '50GB', '70GB', '100GB', '200GB', '500GB'],
} as const
export const SecurityOptionTypes = {
  NoSubscription: 'noSubscription',
  Plan3Months: '3months',
  Plan6Months: '6months',
  Plan12Months: '12months',
} as const
export const BehaviorDetectionOptionTypes = {
  NoSubscription: 'noSubscription',
  Subscription: 'subscription',
} as const
export const DocumentTypes = {
  IdentificationDocument: 'identificationDocument',
  FieldSurveyLessFile: 'fieldSurveyLessFile',
  MapDocument: 'mapDocument',
} as const
export const DocumentServiceTypes = {
  Guarantee: 'guarantee',
  Mobile: 'mobile',
} as const
export const GuaranteeDocumentTypes = {
  FieldSurveyReport: 'fieldSurveyReport',
} as const
export const EncodingTypes = {
  Base64: 'base64',
} as const
export const BandwidthUnitTypes = {
  B: 'B',
  KB: 'KB',
  MB: 'MB',
  GB: 'GB',
} as const

export const IpTypes = {
  Any: '0.0.0.0/0',
} as const

export const PortTypes = {
  Any: 'any',
} as const

export const ProtocolTypes = {
  Any: 'any',
  Tcp: 'tcp',
  Udp: 'udp',
  Icmp: 'icmp',
} as const

export const DocumentExtensions = {
  Csv: 'csv',
  Jpg: 'jpg',
  Jpeg: 'jpeg',
  Png: 'png',
  Pdf: 'pdf',
  Xls: 'xls',
  Xlsx: 'xlsx',
  Zip: 'zip',
} as const
export const DocumentFileTypes: Record<(typeof DocumentExtensions)[keyof typeof DocumentExtensions], string[]> = {
  csv: ['text/csv', 'application/vnd.ms-excel'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
  pdf: ['application/pdf'],
  xls: ['application/vnd.ms-excel'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  zip: ['application/zip', 'application/x-zip-compressed'],
} as const

export const Prefectures = [
  { code: '01', name: '北海道' },
  { code: '02', name: '青森県' },
  { code: '03', name: '岩手県' },
  { code: '04', name: '宮城県' },
  { code: '05', name: '秋田県' },
  { code: '06', name: '山形県' },
  { code: '07', name: '福島県' },
  { code: '08', name: '茨城県' },
  { code: '09', name: '栃木県' },
  { code: '10', name: '群馬県' },
  { code: '11', name: '埼玉県' },
  { code: '12', name: '千葉県' },
  { code: '13', name: '東京都' },
  { code: '14', name: '神奈川県' },
  { code: '15', name: '新潟県' },
  { code: '16', name: '富山県' },
  { code: '17', name: '石川県' },
  { code: '18', name: '福井県' },
  { code: '19', name: '山梨県' },
  { code: '20', name: '長野県' },
  { code: '21', name: '岐阜県' },
  { code: '22', name: '静岡県' },
  { code: '23', name: '愛知県' },
  { code: '24', name: '三重県' },
  { code: '25', name: '滋賀県' },
  { code: '26', name: '京都府' },
  { code: '27', name: '大阪府' },
  { code: '28', name: '兵庫県' },
  { code: '29', name: '奈良県' },
  { code: '30', name: '和歌山県' },
  { code: '31', name: '鳥取県' },
  { code: '32', name: '島根県' },
  { code: '33', name: '岡山県' },
  { code: '34', name: '広島県' },
  { code: '35', name: '山口県' },
  { code: '36', name: '徳島県' },
  { code: '37', name: '香川県' },
  { code: '38', name: '愛媛県' },
  { code: '39', name: '高知県' },
  { code: '40', name: '福岡県' },
  { code: '41', name: '佐賀県' },
  { code: '42', name: '長崎県' },
  { code: '43', name: '熊本県' },
  { code: '44', name: '大分県' },
  { code: '45', name: '宮崎県' },
  { code: '46', name: '鹿児島県' },
  { code: '47', name: '沖縄県' },
] as const
