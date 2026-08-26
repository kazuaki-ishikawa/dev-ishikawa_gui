import type { JpkiRequestStatusTypes } from './constants'

export type JpkiRequestStatusType = (typeof JpkiRequestStatusTypes)[keyof typeof JpkiRequestStatusTypes]

export type JpkiRequestResponse = {
  url: string
  jpkiRequestId: string
}

export type JpkiRequestStatusResponse = {
  status: JpkiRequestStatusType
  errorCode?: string
  errorMessage?: string
}
