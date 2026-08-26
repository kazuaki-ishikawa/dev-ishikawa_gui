import type { NovaIconType } from '@/components/icons/constants'

export type SideBarItemType = {
  title: string
  value: string // 基本は RouteName
  external?: boolean
}
export type SideBarGroupType = {
  title: string
  value: string
  icon?: NovaIconType
  items?: SideBarItemType[]
}
export type SideBarSectionType = {
  title: string
  groups: SideBarGroupType[]
}

export type SideBarSecuredWanGroupType = SideBarGroupType & {
  groups?: SideBarGroupType[]
}
