import type { PeriodTypes } from '@/components/search/constants'

export type PeriodType = (typeof PeriodTypes)[keyof typeof PeriodTypes]
