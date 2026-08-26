import type { HikariPlanType } from './types'

export const IPOE_LINK = {
  FLETS: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/function/ipoeflets.html',
  FIBER: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/function/ipoefiber.html',
  FIBER_FIELD_SURVEY_DATE: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/function/ipoefiber.html#step10',
  FIBER_FIELD_SURVEY_CONTACT: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/function/ipoefiber.html#step12',
  FIBER_CONSTRUCTION: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/function/ipoefiber.html#step17',
  FIBER_CONSTRUCTION_DATE: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/function/ipoefiber.html#procedure15',
  BE_PLAN: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/function/ipoefiber.html#beplan',
  LOGIN: 'https://b-portal.ntt.com/login',
  TICKET: 'https://sdpf.ntt.com/services/docs/rink/tutorials/inquiry.html#ticket-use',
  PRICE: 'https://sdpf.ntt.com/services/rink/pricing/',
  PRICE_LIST: 'https://sdpf.ntt.com/services/rink/pricing/#ntt_price_list',
  WIDE_PLAN_TERMS:
    'https://sdpf.ntt.com/services/docs/rink/service-descriptions/menu/option_detail/wide_for_web.html#/',
  PRICE_LIST_01: 'https://sdpf.ntt.com/services/rink/pricing/#ntt_price_list_01',
  INQUIRY: 'https://sdpf.ntt.com/services/docs/rink/tutorials/inquiry.html',
  REGISTRATION_ADDRESS: 'https://sdpf.ntt.com/services/docs/rink/tutorials/inquiry.html#registration-address',
  CUSTOMER_INFO: 'https://sdpf.ntt.com/services/docs/rink/tutorials/flow/function/ipoeflets.html#customer-information',
}
export const MIN_BUSINESS_DAYS_UNTIL_AVAILABLE = 7

export const RequestTypes = {
  FletsSeparate: 'fletsSeparate',
  HikariCollabo: 'new',
} as const

export const FletsOrderTypes = {
  New: 'new',
  // 移行データで sdpfnw で作成されたものではないデータ。挙動としては new と同じになる
  Migrate: 'migrate',
  Diversion: 'diversion',
} as const

export const FletsTypes = {
  Family200M: 'family200M',
  Family1G: 'family1G',
  Mansion200M: 'mansion200M',
  Mansion1G: 'mansion1G',
} as const

export const HikariPlans = {
  Next: 'next',
  Cross: 'cross',
} as const

export const IpoeTypes = {
  Normal: 'normal',
  Wide: 'wide',
  // スーパーワイドは回線プランが光クロスの場合のみ選択可能
  SuperWide: 'superWide',
} as const

export const IpoeContractTypes = {
  SeparateContract: 'separate-contract',
  HikariCollabo: 'hikari-collabo',
} as const

export const RemovalCollectTypes = {
  Visit: 'visit',
  Kit: 'kit',
} as const
export const initialFletsSeparateInputData = {
  customerNote: '',
  fletsId: '',
  hikariPlan: '' as HikariPlanType | '',
  ipoeType: '',
  appControl: '',
  accessKey: '',
  ipoeApplicationDate: '',
  fletsOpen: '',
  fletsOpenDate: '',
  applicant: {
    name: '',
    nameKana: '',
    phoneNumber: '',
    mailAddress: '',
  },
  originContractor: {
    name: '',
    nameKana: '',
    phoneNumber: '',
    postalCode: '',
    mailAddress: '',
  },
  installationPlace: {
    postalCode: '',
    phoneNumber: '',
  },
}
export const initialFletsSeparateValid = {
  customerNote: false,
  fletsId: true,
  hikariPlan: true,
  ipoeType: false,
  appControl: true,
  accessKey: true,
  ipoeApplicationDate: true,
  fletsOpen: false,
  fletsOpenDate: true,
  applicant: {
    name: true,
    nameKana: true,
    phoneNumber: true,
    mailAddress: true,
  },
  originContractor: {
    name: true,
    nameKana: true,
    phoneNumber: true,
    postalCode: true,
    mailAddress: true,
  },
  installationPlace: {
    postalCode: true,
    phoneNumber: true,
  },
}

export const initialHikariCollaboInputData = {
  customerNote: '',
  ipoeType: '',
  appControl: '',
  fletsType: '',
  installationPlaceCode: '',
  onSiteRepairOption: '',
  constructionOption: {
    siteRouteSurvey: '',
    lineConfirmation: '',
    wiringRouteConstruction: '',
    constructionResultReport: '',
    photographConsent: '',
    photographConsentName: '',
    specifiedVisitDateTime: '',
  },
}
export const initialHikariCollaboValid = {
  customerNote: false,
  ipoeType: false,
  appControl: true,
  fletsType: false,
  installationPlaceCode: true,
  onSiteRepairOption: false,
  constructionOption: {
    siteRouteSurvey: false,
    lineConfirmation: true,
    wiringRouteConstruction: false,
    constructionResultReport: false,
    photographConsent: true,
    photographConsentName: true,
    specifiedVisitDateTime: false,
  },
}

export const initialRemovalInputData = {
  collectType: '',
  kitSendInstallAddressSame: '',
  kitSendAddress: {
    companyName: '',
    personName: '',
    houseNumber: '',
    buildingName: '',
  },
}
export const initialRemovalValid = {
  collectType: false,
  kitSendInstallAddressSame: true,
  kitSendAddress: {
    companyName: true,
    personName: true,
    addressCode: true,
    houseNumber: true,
    buildingName: true,
  },
}
