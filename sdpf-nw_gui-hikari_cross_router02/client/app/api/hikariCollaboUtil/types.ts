import type {
  BuildingTypes,
  ReserveDateTypes,
  AdmissionApplicationInfoTypes,
  JudgeResultListResultTypes,
  DiversionContractTypes,
  ScheduledTime,
  ExpandedScheduledTime,
} from '@/api/hikariCollaboUtil/constants'
import type { FletsType, IpoeType } from '@/api/ipoes/types'

export type BuildingType = (typeof BuildingTypes)[keyof typeof BuildingTypes]
export type ReserveDateType = (typeof ReserveDateTypes)[keyof typeof ReserveDateTypes]
export type AdmissionApplicationInfoType =
  (typeof AdmissionApplicationInfoTypes)[keyof typeof AdmissionApplicationInfoTypes]
type JudgeResultListResultType = (typeof JudgeResultListResultTypes)[keyof typeof JudgeResultListResultTypes]
export type DiversionContractType = (typeof DiversionContractTypes)[keyof typeof DiversionContractTypes]
export type TimeType = keyof typeof ScheduledTime
export type ExpandedTimeType = keyof typeof ExpandedScheduledTime

export type SearchAddressRequest = {
  buildingType: BuildingType
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
  buildingFacilityName?: string
  nextRequestNumber?: string
}
export type SearchAddressResponse = {
  buildingType: BuildingType
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
  buildingFacilityNameList?: string[]
  installationPlaceCode?: string
  addressCode?: string
  nextRequestNumber?: string
}

export type JudgeRequest = {
  installationPlaceCode: string
}
type JudgeResultListType = {
  fletsType: FletsType
  result: JudgeResultListResultType
}
export type JudgeResponse = {
  installationPlaceCode: string
  judgeResultList: JudgeResultListType[]
  fieldSurveyRequirement: boolean
}

export type AvailableTimeResponse = {
  available: boolean
}

export type SearchConstructionDateRequest = {
  type: ReserveDateType
  yearMonth?: string
  admissionApplicationInfo?: AdmissionApplicationInfoType
}

type ScheduledTimeType = {
  scheduledTime: TimeType
}
export type ConstructionDateType = {
  scheduledDate: string
  scheduledTimes?: ScheduledTimeType[]
}
export type SearchConstructionDateResponse = {
  constructionDates: ConstructionDateType[]
}

export type ReserveConstructionDateRequest = {
  type: ReserveDateType
  date: string
  time: TimeType
  admissionApplicationInfo: AdmissionApplicationInfoType
  attendanceCompanyName: string
  attendanceDepartmentName: string
  attendancePersonName: string
  attendancePersonNameKana: string
  attendancePhoneNumber: string
}

type DiversionErrorType = {
  code:
    | '001'
    | '002'
    | '003'
    | '004'
    | '005'
    | '006'
    | '007'
    | '008'
    | '009'
    | '010'
    | '011'
    | '012'
    | '013'
    | '900'
    | '901'
    | '902'
    | '903'
    | '904'
    | '905'
    | '906'
    | '907'
  reason: string
}

export type DiversionContractInfoType = {
  contractType: DiversionContractType
  contractorName: string
  contractorNameKana: string
}
export type HikariCollaboDiversionJudgeRequest = Omit<HikariCollaboDiversionRequest, 'diversionDate'>
export type HikariCollaboDiversionJudgeResponse = {
  diversionNumber: string
  contractInfo: DiversionContractInfoType
  diversionCheckResult: {
    result: boolean
    errors?: DiversionErrorType[]
    diversionShortestDate?: string // YYYY-MM-DD
  }
  customerNote: string
  fletsType: FletsType
  ipoeType: IpoeType
  appControl: boolean
  onSiteRepairOption: boolean
  installationPlace: {
    postalCode: string
    address: string
  }
}
export type HikariCollaboDiversionRequest = {
  diversionNumber: string
  contractInfo: DiversionContractInfoType
  diversionDate: string
}
