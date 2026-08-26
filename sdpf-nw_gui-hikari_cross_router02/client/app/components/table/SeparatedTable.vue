<script lang="ts" setup generic="T">
import type { TableHeaderType } from './types'

type PropType = {
  headers: TableHeaderType[]
  items: Array<T>
  keyItems?: Array<keyof T>
}
const props = withDefaults(defineProps<PropType>(), {
  keyItems: undefined,
})

const gridColumns = computed(() => {
  const list = props.headers.map(h => (h?.width ? `${h.width}px` : '1fr'))
  return list.join(' ')
})
const slotNames = computed(() => props.headers.map(h => h.key))
const tableMinWidth = computed(() => {
  const num = props.headers.reduce((width, header) => width + (header?.width ?? 0), 0)
  const fullwidth = gridColumns.value.includes('1fr')
  return fullwidth ? 'auto' : `${num}px`
})
const getKeyItem = (row: T, index: number): string => {
  if (props.keyItems) {
    return props.keyItems
      .filter(keyItem => typeof row[keyItem] === 'string')
      .map(keyItem => row[keyItem])
      .join('-')
  } else {
    return `${index}`
  }
}
</script>

<template>
  <div class="separated-table overflow-hidden">
    <div class="header pb-1">
      <div v-for="header in headers" :key="header.key" class="cell text-center py-1">
        <slot name="header" :data="header">{{ header.text }}</slot>
      </div>
    </div>
    <div class="body">
      <div v-for="(row, index) in items" :key="getKeyItem(row, index)" class="row pb-1">
        <div
          v-for="name in slotNames"
          :key="`row-${getKeyItem(row, index)}-${name}`"
          class="flex-center-center bg-white break-all"
        >
          <slot :name="name" :row="row" :data="row[name as keyof T]" :index="index">{{ row[name as keyof T] }}</slot>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
$grid-columns: v-bind(gridColumns);
$table-min-width: v-bind(tableMinWidth);
$secondary-color: rgb(var(--v-theme-secondary));
$light-primary-color: rgb(var(--v-theme-light-primary));

.separated-table {
  width: $table-min-width;
  height: fit-content;
  border-radius: v.$child-border-radius;
  .header {
    display: grid;
    column-gap: 0.25rem;
    grid-template-columns: $grid-columns;
    .cell {
      background-color: $light-primary-color;
      color: $secondary-color;
      font-size: 0.85rem;
    }
  }
  .body {
    min-width: fit-content;
    .row {
      display: grid;
      column-gap: 0.25rem;
      min-height: 3rem;
      grid-template-columns: $grid-columns;
      &:last-of-type {
        padding-bottom: 0;
      }
    }
  }
  .break-all {
    word-break: break-all;
  }
}
</style>
