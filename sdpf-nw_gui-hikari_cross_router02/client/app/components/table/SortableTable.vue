<script lang="ts" setup generic="T">
import { SortDirectionTypes } from '@/api/constants'
import { IconTypes } from '@/components/icons/constants'
import type { TableHeaderType, SortOption } from '@/components/table/types'

const CELL_MIN_WIDTH = 155 as const

type PropType = {
  headers: TableHeaderType[]
  items: Array<T>
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
  const list = props.headers.map(h => (h?.width ? `${h.width}px` : `minmax(${CELL_MIN_WIDTH}px, 1fr)`))
  return list.join(' ')
})
const slotNames = computed(() => props.headers.map(h => h.key))

const handleAscClick = (sortKey: string) => {
  const clear = props.sort?.direction === SortDirectionTypes.Asc && props.sort?.sortKey === sortKey
  const option = clear ? undefined : { sortKey, direction: SortDirectionTypes.Asc }
  emits('sort', option)
}
const handleDescClick = (sortKey: string) => {
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
</script>

<template>
  <div class="overflow-x-auto">
    <div class="header bg-white text-no-wrap">
      <div v-for="header in headers" :key="header.key" class="header-cell d-flex align-center my-3 px-3">
        <slot :name="`header-${header.key}`" :data="header.text">
          <div class="flex-grow-1" :class="header.class">{{ header.text }}</div>
          <IconButton
            v-if="!unsortableKeys?.includes(header.key)"
            :type="IconTypes.ArrowUp"
            :color="sort?.direction !== SortDirectionTypes.Asc || sort?.sortKey !== header.key ? 'info' : 'primary'"
            size="small"
            class="mr-1"
            @click="handleAscClick(header.key)"
          />
          <IconButton
            v-if="!unsortableKeys?.includes(header.key)"
            :type="IconTypes.ArrowDown"
            :color="sort?.direction !== SortDirectionTypes.Desc || sort?.sortKey !== header.key ? 'info' : 'primary'"
            size="small"
            @click="handleDescClick(header.key)"
          />
        </slot>
      </div>
    </div>

    <div class="body">
      <div v-for="(row, index) in items" :key="getKeyItem(row, index)" class="row">
        <div
          v-for="name in slotNames"
          :key="`row-${getKeyItem(row, index)}-${name}`"
          class="body-cell flex-flex-start-center px-3"
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

.header {
  display: grid;
  grid-template-columns: $grid-columns;
}
.header-cell {
  height: 1.25rem;
  border-left: solid 1px $light-primary-color;
  &:first-of-type {
    border-left: none;
  }
}
.row {
  display: grid;
  grid-template-columns: $grid-columns;

  .body-cell {
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
