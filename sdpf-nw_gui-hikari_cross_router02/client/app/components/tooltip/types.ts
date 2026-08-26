import type { IconSize, IconType } from '@/components/icons/constants'
import type { ColorKeyList } from '@/components/constants'

export type CustomTooltipPropType = {
  contentWidth?: number
}
export type HelpTooltipPropType = CustomTooltipPropType & {
  size?: keyof typeof IconSize
  icon?: IconType
  color?: (typeof ColorKeyList)[number] | 'white'
}
