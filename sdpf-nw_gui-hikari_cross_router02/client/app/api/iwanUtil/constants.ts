export const SearchDateTypes = {
  FieldSurvey: 'fieldSurvey',
  Construction: 'construction',
  Removal: 'removal',
} as const

// 表示順に関係するのでリストの順番は固定
export const SearchAddressResponseListKeys = {
  municipalityList: 1,
  largerSectionList: 2,
  sectionList: 3,
  houseNumber1List: 4,
  houseNumber2List: 5,
  houseNumber3List: 6,
  buildingName1List: 7,
  buildingName2List: 8,
  buildingName3List: 9,
} as const

export const initialIwanUtilSearchAddressInputData = {
  postalCode: '',
  prefecture: '',
  municipality: '',
  largerSection: '',
  section: '',
  houseNumber1: '',
  houseNumber2: '',
  houseNumber3: '',
  buildingName1: '',
  buildingName2: '',
  buildingName3: '',
}

export const initialRegistrationAddressInputData = {
  ...initialIwanUtilSearchAddressInputData,
  latitude: '',
  longitude: '',
  mapDocumentId: '',
  companyName: '',
  personName: '',
  phoneNumber: '',
}
export const initialRegistrationAddressValid = {
  postalCode: false,
  prefecture: false,
  municipality: false,
  largerSection: true,
  section: true,
  houseNumber1: true,
  houseNumber2: true,
  houseNumber3: true,
  buildingName1: true,
  buildingName2: true,
  buildingName3: true,
  latitude: false,
  longitude: false,
  mapDocumentId: false,
  companyName: false,
  personName: false,
  phoneNumber: false,
}
