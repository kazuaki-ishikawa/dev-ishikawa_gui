export const BuildingTypes = {
  House: 'house',
  Apartment: 'apartment',
} as const

export const ReserveDateTypes = {
  FieldSurvey: 'fieldSurvey',
  Construction: 'construction',
  Removal: 'removal',
} as const

export const AdmissionApplicationInfoTypes = {
  NoApplication: 'noApplication',
  CompanyInfo: 'companyInfo',
  CompanyInfoAndWorkCandidateName: 'companyInfoAndWorkCandidateName',
} as const
export const JudgeResultListResultTypes = {
  ConstructionPossible: 'constructionPossible',
  FieldSurveyPossible: 'fieldSurveyPossible',
  FacilityConfirmationRequired: 'facilityConfirmationRequired',
  NotAvailable: 'notAvailable',
} as const

export const DiversionContractTypes = {
  Individual: 'individual',
  Corporation: 'corporation',
} as const

export const ScheduledTime = {
  '9-12': '09:00-12:00',
  '9-10': '09:00-10:00',
  '10-12': '10:00-12:00',
  '13-17': '13:00-17:00',
  '13-14': '13:00-14:00',
  '13-15': '13:00-15:00',
  '15-17': '15:00-17:00',
} as const

export const ExpandedScheduledTime = {
  ...ScheduledTime,
  '9-17': '09:00-17:00',
  '0-0': '00:00',
  '1-1': '01:00',
  '2-2': '02:00',
  '3-3': '03:00',
  '4-4': '04:00',
  '5-5': '05:00',
  '6-6': '06:00',
  '7-7': '07:00',
  '8-8': '08:00',
  '9-9': '09:00',
  '10-10': '10:00',
  '11-11': '11:00',
  '12-12': '12:00',
  '13-13': '13:00',
  '14-14': '14:00',
  '15-15': '15:00',
  '16-16': '16:00',
  '17-17': '17:00',
  '18-18': '18:00',
  '19-19': '19:00',
  '20-20': '20:00',
  '21-21': '21:00',
  '22-22': '22:00',
  '23-23': '23:00',
} as const

export const initialSearchAddressInputData = {
  buildingType: '',
  postalCode: '',
  municipality: '',
  largerSection: '',
  section: '',
  houseNumber1: '',
  houseNumber2: '',
  houseNumber3: '',
  buildingName1: '',
  buildingName2: '',
  buildingName3: '',
  buildingFacilityName: '',
}
export const initialSearchAddressValid = {
  buildingType: false,
  postalCode: false,
}

export const initialReserveAttendances = {
  admissionApplicationInfo: '',
  attendanceCompanyName: '',
  attendanceDepartmentName: '',
  attendancePersonName: '',
  attendancePersonNameKana: '',
  attendancePhoneNumber: '',
}
export const initialReserveDates = {
  date: '',
  time: '',
}
export const initialReserveConstructionDateValid = {
  date: false,
  time: false,
  admissionApplicationInfo: false,
  attendanceCompanyName: false,
  attendanceDepartmentName: false,
  attendancePersonName: false,
  attendancePersonNameKana: false,
  attendancePhoneNumber: false,
}

export const initialDiversionInputData = {
  diversionNumber: '',
  contractType: '',
  contractorName: '',
  contractorNameKana: '',
  diversionDate: '',
}
export const initialDiversionValid = {
  diversionNumber: false,
  contractType: false,
  contractorName: false,
  contractorNameKana: false,
  diversionDate: false,
}
