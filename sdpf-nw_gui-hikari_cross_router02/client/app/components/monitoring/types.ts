import type { ServiceTypes } from './constants'
import type { TerminalType } from '@/api/types'
import type { HealthStatusResponse } from '@/api/healthStatus/types'

export type ServiceType = (typeof ServiceTypes)[number]
export type QueryType = {
  service?: ServiceType | ServiceType[]
  keyword: string
}

export type MixedHealthStatusResponse = HealthStatusResponse & {
  terminal: {
    terminalType: TerminalType
    isSwitchover: boolean
  }
}
