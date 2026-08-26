import type { TermsOfServiceBasePath } from '@/api/termsOfService/constants'

export type TermsOfServiceBasePathType = (typeof TermsOfServiceBasePath)[keyof typeof TermsOfServiceBasePath]

export type TermsOfServiceAcceptedResponse = {
  termsOfServiceAccepted: boolean
}

export type TermsOfServiceResponse = {
  agreementCode: string
  termsOfService: { [key: string]: string }
}

export type TermsOfServiceAgreePostRequest = {
  agreementCode: string
}

export type ConvertedTermsOfServiceResponse = {
  agreementCode: string
  termsOfService: Array<{ name: string; uuid: string }>
}
