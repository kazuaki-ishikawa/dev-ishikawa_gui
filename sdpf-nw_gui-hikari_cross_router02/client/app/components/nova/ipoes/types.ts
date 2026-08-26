import type { TabNames } from './constants'

export type TabNameType = (typeof TabNames)[keyof typeof TabNames]
