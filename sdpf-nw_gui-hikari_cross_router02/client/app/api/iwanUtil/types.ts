import type { SearchDateTypes, initialRegistrationAddressInputData } from '@/api/iwanUtil/constants'
import type { TimeType } from '@/api/hikariCollaboUtil/types'
import type { OrderStatusType } from '@/api/types'

export type InitialRegistrationAddressInputDataType = typeof initialRegistrationAddressInputData

export type SearchDateType = (typeof SearchDateTypes)[keyof typeof SearchDateTypes]

export type SearchAddressRequest = {
  postalCode: string
  prefecture?: string
  municipality?: string
  largerSection?: string
  section?: string | null
  houseNumber1?: string | null
  houseNumber2?: string | null
  houseNumber3?: string | null
  buildingName1?: string | null
  buildingName2?: string | null
  buildingName3?: string | null
  nextRequestNumber?: string
}
export type SearchAddressResponse = {
  postalCode: string
  prefecture?: string
  municipalityList?: string[]
  largerSectionList?: string[]
  sectionList?: string[]
  houseNumber1List?: string[]
  houseNumber2List?: string[]
  houseNumber3List?: string[]
  buildingName1List?: string[]
  buildingName2List?: string[]
  buildingName3List?: string[]
  installationPlaceCode?: string
  nextRequestNumber?: string
}

export type JudgeRequest = {
  installationPlaceCode: string
}
export type JudgeResponse = {
  serviceAvailable: boolean
  installationPlaceCode: string
}

export type SearchDateRequest = {
  yearMonth?: string
  type: SearchDateType
  installationPlaceCode: string
  admissionApplicationRequired?: boolean
  fieldSurveyLess?: boolean
  fieldSurveyDate?: string
}

type ScheduledTimeType = {
  scheduledTime: TimeType
}
export type ConstructionDateType = {
  scheduledDate: string
  scheduledTimes?: ScheduledTimeType[]
}

export type SearchDateResponse = {
  constructionDates: ConstructionDateType[]
}

export type RegistrationAddressPostRequest = {
  postalCode: string
  prefecture: string
  municipality: string
  largerSection?: string
  section?: string
  houseNumber1?: string
  houseNumber2?: string
  houseNumber3?: string
  buildingName1?: string
  buildingName2?: string
  buildingName3?: string
  latitude: string
  longitude: string
  mapDocumentId: string
  companyName?: string
  personName?: string
  phoneNumber?: string
}

export type RegistrationAddressResponse = {
  tenantId: string
  orderId?: string
  orderStatus?: OrderStatusType
  updateTime?: string
  serviceStartTime?: string
  postalCode: string
  prefecture: string
  municipality: string
  largerSection?: string
  section?: string
  houseNumber1?: string
  houseNumber2?: string
  houseNumber3?: string
  buildingName1?: string
  buildingName2?: string
  buildingName3?: string
  latitude: string
  longitude: string
  companyName?: string
  personName?: string
  phoneNumber?: string
}
