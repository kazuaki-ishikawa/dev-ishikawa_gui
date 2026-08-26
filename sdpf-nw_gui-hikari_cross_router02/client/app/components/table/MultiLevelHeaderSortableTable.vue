<script lang="ts" setup generic="T">
import { SortDirectionTypes } from '@/api/constants'
import type { SortDirectionType } from '@/api/types'
import { IconTypes } from '@/components/icons/constants'
import type { MultiLevelHeaderType, SortOption } from '@/components/table/types'

const CELL_MIN_WIDTH = 155 as const
type HeaderColumnType = {
  width?: number
  key: string
}

type PropType = {
  multiLevelHeaders: MultiLevelHeaderType[][]
  columnWidths: HeaderColumnType[]
  items: Array<T>
  slotNames: string[]
  sort: Partial<SortOption>
  keyItems?: Array<string>
  unsortableKeys?: Array<string>
}
const props = defineProps<PropType>()

type Emits = {
  (e: 'sort', sort?: SortOption): void
}
const emits = defineEmits<Emits>()

const gridColumns = computed(() => {
  const list = props.columnWidths.map(c => (c.width ? `${c.width}px` : `minmax(${CELL_MIN_WIDTH}px, 1fr)`))
  return list.join(' ')
})

const handleAscClick = (sortKey: string | undefined) => {
  if (!sortKey) {
    return
  }
  const clear = props.sort?.direction === SortDirectionTypes.Asc && props.sort?.sortKey === sortKey
  const option = clear ? undefined : { sortKey, direction: SortDirectionTypes.Asc }
  emits('sort', option)
}
const handleDescClick = (sortKey: string | undefined) => {
  if (!sortKey) {
    return
  }
  const clear = props.sort?.direction === SortDirectionTypes.Desc && props.sort?.sortKey === sortKey
  const option = clear ? undefined : { sortKey, direction: SortDirectionTypes.Desc }
  emits('sort', option)
}

const getKeyItem = (row: T, index: number): string => {
  if (props.keyItems) {
    return props.keyItems.map(keyItem => row[keyItem as keyof T]).join('-')
  } else {
    return `${index}`
  }
}

// ヘッダーセルのクラス計算を分離
const getHeaderCellClasses = (headerRow: MultiLevelHeaderType[], header: MultiLevelHeaderType, colIndex: number) => {
  return {
    'border-bottom': !header.bottom,
    'border-left': colIndex > 0 && (headerRow[colIndex - 1]?.rowSpan ?? 1) <= (header.rowSpan ?? 1),
    'border-right':
      colIndex !== headerRow.length - 1 && (headerRow[colIndex + 1]?.rowSpan ?? 1) < (header.rowSpan ?? 1),
    [`grid-col-${header.colSpan ?? 1}`]: true,
    [`grid-row-${header.rowSpan ?? 1}`]: true,
    [`justify-${header.key ? 'start' : 'center'}`]: true,
  }
}

// ソートボタンの表示判定
const isSortable = (header: MultiLevelHeaderType) => {
  return header.bottom && !props.unsortableKeys?.includes(header.key ?? '')
}

// ソートボタンの色判定
const getSortButtonColor = (header: MultiLevelHeaderType, direction: SortDirectionType) => {
  return props.sort?.direction !== direction || props.sort?.sortKey !== header.key ? 'info' : 'primary'
}
</script>

<template>
  <div class="overflow-x-auto">
    <div class="multi-level-header bg-white text-no-wrap">
      <template v-for="(headerRow, rowIndex) in multiLevelHeaders" :key="`header-row-${rowIndex}`">
        <template v-for="(header, colIndex) in headerRow" :key="header.key">
          <div
            class="px-2 py-1 d-flex align-center bg-white"
            :class="getHeaderCellClasses(headerRow, header, colIndex)"
          >
            <slot :name="`header-${header.key}`" :data="header.text">
              <div :class="header?.class">{{ header.text }}</div>
              <IconButton
                v-if="isSortable(header)"
                :type="IconTypes.ArrowUp"
                :color="getSortButtonColor(header, SortDirectionTypes.Asc)"
                size="small"
                class="mr-1"
                @click="handleAscClick(header.key)"
              />
              <IconButton
                v-if="isSortable(header)"
                :type="IconTypes.ArrowDown"
                :color="getSortButtonColor(header, SortDirectionTypes.Desc)"
                size="small"
                @click="handleDescClick(header.key)"
              />
            </slot>
          </div>
        </template>
      </template>
    </div>
    <div class="body">
      <div v-for="(row, index) in items" :key="getKeyItem(row, index)" class="row">
        <div
          v-for="name in slotNames"
          :key="`row-${getKeyItem(row, index)}-${name}`"
          class="body-cell min-h-10 flex-flex-start-center px-3"
        >
          <slot :name="name" :row="row" :data="row[name as keyof T]" :index="index">
            {{ row[name as keyof T] }}
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
$grid-columns: v-bind(gridColumns);
$light-primary-color: rgb(var(--v-theme-light-primary));
$light-secondary-color: rgb(var(--v-theme-light-secondary));
$max-grid-span: 12;

@for $size from 1 through $max-grid-span {
  .grid-col-#{$size} {
    grid-column: span $size;
  }
  .grid-row-#{$size} {
    grid-row: span $size;
  }
}

.multi-level-header {
  display: grid;
  grid-template-columns: $grid-columns;

  .border-bottom {
    border-bottom: solid 1px $light-primary-color;
  }
  .border-left {
    border-left: solid 1px $light-primary-color;
  }
  .border-right {
    border-right: solid 1px $light-primary-color;
  }
}
.row {
  display: grid;
  grid-template-columns: $grid-columns;

  .min-h-10 {
    min-height: 2.5rem;
  }

  &:nth-child(odd) {
    .body-cell {
      background-color: $light-secondary-color;
    }
  }
  &:nth-child(even) {
    .body-cell {
      background-color: #fff;
    }
  }
}
</style>
