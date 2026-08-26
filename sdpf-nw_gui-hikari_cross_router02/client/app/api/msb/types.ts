import type { CustomerTypes } from '@/api/msb/constants'

export type CustomerType = (typeof CustomerTypes)[keyof typeof CustomerTypes]

export type MsbResponse = {
  resourceId: string
  tenantId: string
}

export type MsbLicensePackType = {
  '1licensePacks': number
  '10licensePacks': number
  '100licensePacks': number
  '1000licensePacks': number
  '10000licensePacks': number
}

export type MsbPostRequest = {
  emailAddress: string
  departmentName: string
  customerType: CustomerType
  customerSpecialNote: string | null
  licensePacks: MsbLicensePackType
}
export type MsbPostResponse = MsbPostRequest & {
  orderId: string
  resourceId: string
  tenantId: string
}
export type MsbPatchRequest = Pick<MsbPostRequest, 'emailAddress'> &
  Partial<Pick<MsbPostRequest, 'customerSpecialNote'>> & {
    licensePacks: MsbLicensePackType
  }
export type MsbPatchResponse = Omit<MsbPostResponse, 'customerType' | 'departmentName'>

export type MsbDeleteResponse = MsbResponse & {
  orderId: string
}

export type MsbDeleteRequest = {
  reason: string
  emailAddress: string
  customerSpecialNote: string | null
}

export type MsbLicensesResponse = {
  resourceId: string
  licensePacks: MsbLicensePackType
  tenantId: string
}

export type MsbThreatNoticeResponse = {
  threatExists: boolean
  message: string
  tenantId: string
}
