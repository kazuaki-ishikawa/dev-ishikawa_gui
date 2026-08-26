export type ContractorResponse = {
  name: string
  nameKana: string
  picName: string
  picNameKana: string
  postalCode: string
  address: string
  houseNumber?: string
  buildingName?: string
  addressKana: string
  phoneNumber: string
  addressCode?: string
  orderId?: string
}

export type ContractorPutRequest = {
  name: string
  nameKana: string
  picName: string
  picNameKana: string
  postalCode: string
  address: string
  houseNumber?: string
  buildingName?: string | null
  addressKana: string
  phoneNumber: string
  addressCode?: string
}
