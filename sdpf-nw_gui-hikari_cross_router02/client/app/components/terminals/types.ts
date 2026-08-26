import type { HikariPlanType } from '@/api/ipoes/types'
import type { OptionType } from '@/components/input/types'

export type IpoeListOptionType = OptionType<string> & {
  hikariPlan?: HikariPlanType
}
