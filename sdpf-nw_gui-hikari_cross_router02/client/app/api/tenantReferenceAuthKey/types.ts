import type { TenantReferenceAuthKeyCategoryTypes } from '@/api/tenantReferenceAuthKey/constants'

type TenantReferenceAuthKeyCategoryType =
  (typeof TenantReferenceAuthKeyCategoryTypes)[keyof typeof TenantReferenceAuthKeyCategoryTypes]

export type TenantReferenceAuthKeyRequest = {
  category: TenantReferenceAuthKeyCategoryType
  mailAddress: string[]
}
export type TenantReferenceAuthKeyResponse = {
  key: string
  expirationTime: string
}
export type TenantReferenceAuthKeySearchRequest = {
  key: string
}
export type TenantReferenceAuthKeySearchResponse = {
  tenantId: string
  contractorName: string
  category: TenantReferenceAuthKeyCategoryType
}
