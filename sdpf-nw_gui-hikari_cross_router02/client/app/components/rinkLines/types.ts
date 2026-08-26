import type { RinkLineAccessType } from '@/api/rinkLines/types'
import type { OptionType } from '@/components/input/types'

export type PlanOptionsType = Record<RinkLineAccessType, Array<OptionType<string>>>
