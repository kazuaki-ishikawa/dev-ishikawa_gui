import type { VDataTable, VDataTableServer } from 'vuetify/components'
import type { SortDirectionType } from '@/api/types'

type DataTableProps = VDataTable['$props']

export type DataTableHeadersType = DataTableProps['headers']
export type DataTableItemValueType = DataTableProps['itemValue']

export type DataTableServerProps = VDataTableServer['$props']
export type SortableTableSortByType = {
  sortKey: string
  direction: SortDirectionType
}
