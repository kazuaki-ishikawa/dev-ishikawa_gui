export const GUARANTEE_MAX_LIMIT = 100
export const RESOURCE_SUMMARY_GUARANTEE_MAX_LIMIT = 1000

export const GUARANTEE_LINK = {
  STEP_VPN: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/function/vpn.html#stepvpn',
  CHANGE_LBO: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/change/change_lbo.html',
  TERMINAL: 'https://sdpf.ntt.com/services/docs/rink/tutorials/portal/application_information/terminal.html',
  CANCEL_VPN: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/cancellation/cancel_vpn.html#unlock',
  CHANGE_LBO_ID10: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/change/change_lbo.html#id10',
  TERMINAL_ID5: 'https://sdpf.ntt.com/services/docs/rink/tutorials/portal/application_information/terminal.html#id5',
  IWAN_APPLICATION: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/function/iwan.html#iwan-application',
  BASIC_INFORMATION: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/function/iwan.html#basic-information',
  INTERNET: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/function/iwan.html#internet',
  VPN: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/function/iwan.html#vpn',
  DESIRED_DATE: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/function/iwan.html#desired-date',
  TICKET_USE: 'https://sdpf.ntt.com/services/docs/rink/tutorials/inquiry.html#ticket-use',
  LOCAL_DETAILS: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/function/iwan.html#local-details',
  HOUSE_DETAILS: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/function/iwan.html#house-details',
} as const

export const PhysicalBandwidthTypes = ['100M', '1G'] as const
export const UserInterfaceTypes100 = ['100BASE-TX'] as const
export const UserInterfaceTypes1000 = ['1000BASE-LX', '1000BASE-SX', '1000BASE-T'] as const
export const UserInterfaceTypes = [...UserInterfaceTypes100, ...UserInterfaceTypes1000] as const

export const VpnRateLimitTypes = [
  '10M',
  '20M',
  '30M',
  '40M',
  '50M',
  '60M',
  '70M',
  '80M',
  '90M',
  '100M',
  '200M',
  '300M',
  '400M',
  '500M',
  '600M',
  '700M',
  '800M',
  '900M',
  '1G',
] as const
export const InternetRateLimitTypes = [...VpnRateLimitTypes] as const

export const ConstructionTypes = {
  ToMDFtag: 'toMDFtag',
  ToMDFjumper: 'toMDFjumper',
  ToIDFtag: 'toIDFtag',
  ToTerminal: 'toTerminal',
} as const
export const WiringTypes = {
  Rental: 'rental',
  SelfDevice: 'selfDevice',
} as const
export const ConnectionTypes = {
  Internet: 'internet',
  Vpn: 'vpn',
} as const
export const ThresholdTypes = ['50', '60', '70', '80', '90'] as const
export const DurationTypes = {
  Duration5Minutes: '5min',
  Duration15Minutes: '15min',
  Duration1Hour: '1hour',
} as const
export const NotificationIntervalTypes = { Interval1Day: '1day' } as const
export const CommunicationModeTypes = {
  AutoNego: 'auto-nego',
  FullDuplex: 'full-duplex',
} as const

export const ReserveStatusTypes = {
  Processing: 'processing',
  Approved: 'approved',
  Rejected: 'rejected',
} as const
export const FieldSurveyResultTypes = {
  OK: 'ok',
  NG: 'ng',
} as const
export const FieldSurveyLessResultSurveyLessTypes = {
  OK: true,
  NG: false,
} as const
export const FieldSurveyLessResultDrawingResendRequestTypes = {
  Required: true,
  NotRequired: false,
} as const

export const BgpSessionStatusTypes = {
  Processing: 'processing',
  Completed: 'completed',
  Failed: 'failed',
} as const
export const BgpSessionOperationTypes = {
  Reset: 'reset',
} as const

export const initialGuaranteeInputData = {
  terminalType: '',
  customerNote: '',
  userInterfaceType: '',
  physicalBandwidth: '',
  internetRateLimit: '',
  internetThreshold: '',
  internetDuration: '',
  internetNotificationInterval: '',
  vpnRateLimit: '',
  vpnThreshold: '',
  vpnDuration: '',
  vpnNotificationInterval: '',
  installationPlaceCode: '',
  communicationMode: '',
  fieldSurveyLess: '',
  fieldSurveyLessFileId: '',
}

export const initialGuaranteeFieldSurveyAndConstructionDateInputData = {
  fieldSurvey: {
    date: '',
    time: '',
    admissionApplicationRequired: '',
  },
  construction: {
    date: '',
    time: '',
    admissionApplicationRequired: '',
  },
}

export const initialGuaranteeFieldSurveyAndConstructionInputData = {
  fieldSurvey: {
    operationAdjustment: '',
    preContactCompanyName: '',
    preContactPersonName: '',
    preContactPhoneNumber: '',
    attendanceCompanyName: '',
    attendancePersonName: '',
    attendancePhoneNumber: '',
  },
  construction: {
    operationAdjustment: '',
    preContactCompanyName: '',
    preContactPersonName: '',
    preContactPhoneNumber: '',
    attendanceCompanyName: '',
    attendancePersonName: '',
    attendancePhoneNumber: '',
  },
}

export const initialGuaranteeIwanInputData = {
  operationAdjustment: '',
  date: '',
  time: '',
  preContactCompanyName: '',
  preContactPersonName: '',
  preContactPhoneNumber: '',
  attendanceCompanyName: '',
  attendancePersonName: '',
  attendancePhoneNumber: '',
  admissionApplicationRequired: '',
}

export const initialGuaranteeValid = {
  terminalType: false,
  customerNote: false,
  physicalBandwidth: false,
  userInterfaceType: false,
  internetRateLimit: true,
  internetThreshold: true,
  internetDuration: true,
  internetNotificationInterval: true,
  vpnRateLimit: true,
  vpnThreshold: true,
  vpnDuration: true,
  vpnNotificationInterval: true,
  communicationMode: false,
  fieldSurveyLess: true,
  fieldSurveyLessFileId: true,
}

export const initialGuaranteeFieldSurveyAndConstructionDateValid = {
  fieldSurvey: {
    date: false,
    time: false,
    admissionApplicationRequired: false,
  },
  construction: {
    date: false,
    time: false,
    admissionApplicationRequired: false,
  },
}

export const initialGuaranteeFieldSurveyAndConstructionValid = {
  fieldSurvey: {
    preContactCompanyName: false,
    preContactPersonName: false,
    preContactPhoneNumber: false,
    attendanceCompanyName: false,
    attendancePersonName: false,
    attendancePhoneNumber: false,
  },
  construction: {
    preContactCompanyName: false,
    preContactPersonName: false,
    preContactPhoneNumber: false,
    attendanceCompanyName: false,
    attendancePersonName: false,
    attendancePhoneNumber: false,
  },
}

export const initialGuaranteeIwanValid = {
  date: false,
  time: false,
  preContactCompanyName: false,
  preContactPersonName: false,
  preContactPhoneNumber: false,
  attendanceCompanyName: false,
  attendancePersonName: false,
  attendancePhoneNumber: false,
  admissionApplicationRequired: false,
}
