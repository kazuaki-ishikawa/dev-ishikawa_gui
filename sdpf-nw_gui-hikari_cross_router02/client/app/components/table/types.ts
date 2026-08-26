import type { SortDirectionType } from '@/api/types'

type CommonTableHeaderType = {
  text: string
  class?: string
  help?: string
}
export type TableHeaderType = CommonTableHeaderType & {
  key: string
  width?: number
  minWidth?: number
}
export type MultiLevelHeaderType = CommonTableHeaderType & {
  key?: string
  colSpan?: number
  rowSpan?: number
  bottom?: boolean
}
export type SortOption = {
  sortKey: string
  direction: SortDirectionType
}
