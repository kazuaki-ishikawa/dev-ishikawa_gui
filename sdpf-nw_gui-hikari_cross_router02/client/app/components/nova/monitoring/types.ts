import type { TerminalType } from '@/api/types'
import type { HealthStatusResponse } from '@/api/healthStatus/types'

export type MixedHealthStatusResponse = HealthStatusResponse & {
  terminal: {
    terminalType: TerminalType
    isSwitchover: boolean
  }
}
