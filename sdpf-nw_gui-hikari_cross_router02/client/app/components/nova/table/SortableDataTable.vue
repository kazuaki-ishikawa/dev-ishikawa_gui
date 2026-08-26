<script setup lang="ts" generic="T">
import { SortDirectionTypes } from '@/api/constants'
import type { DataTableServerProps, SortableTableSortByType } from './types'

type PropType = {
  headers: DataTableServerProps['headers']
  items: Array<T>
  itemsLength: number
  singleSelect?: boolean
  height?: string | number
}
const props = withDefaults(defineProps<PropType>(), {
  singleSelect: false,
  height: '60vh',
})
const sortBy = defineModel<SortableTableSortByType>('sortBy')
const selectedItems = defineModel<Array<T>>('selectedItems')

const translationSortBy = computed(() => {
  if (!sortBy.value) {
    return undefined
  }
  return [{ key: sortBy.value.sortKey, order: sortBy.value.direction }]
})
const handleSortBy = (newSortBy: DataTableServerProps['sortBy']) => {
  const sortKey = newSortBy?.[0]?.key
  const direction = newSortBy?.[0]?.order
  if (sortKey) {
    sortBy.value = {
      sortKey,
      direction: typeof direction === 'boolean' || !direction ? SortDirectionTypes.Asc : direction,
    }
  } else {
    sortBy.value = undefined
  }
}
const showSelect = computed(() => selectedItems.value !== undefined)
const selectStrategy = computed(() => (showSelect.value && props.singleSelect ? 'single' : undefined))
const hasNestedHeaders = computed(() => props.headers?.some(header => !!header.children?.length))
</script>

<template>
  <v-data-table-server
    v-model="selectedItems"
    :items-per-page="-1"
    :headers="headers"
    :items="items"
    :items-length="itemsLength"
    :sort-by="translationSortBy"
    sort-icon="nova:sort-arrows"
    sort-asc-icon="nova:sort-arrows-asc"
    sort-desc-icon="nova:sort-arrows-desc"
    hide-default-footer
    :header-props="{ class: 'text-pre-wrap' }"
    fixed-header
    :height="height"
    :style="hasNestedHeaders ? { '--v-table-header-height': '35px' } : undefined"
    :show-select="showSelect"
    return-object
    :select-strategy="selectStrategy"
    @update:sort-by="handleSortBy"
  >
    <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
      <slot :name="name" v-bind="slotData" />
    </template>
  </v-data-table-server>
</template>

<style lang="scss" scoped>
$border-color: rgb(var(--v-theme-info-lighten-3));
$icon-color: rgb(var(--v-theme-info-lighten-1));

:deep(.v-table__wrapper) {
  max-height: fit-content;
  overflow-x: auto;
  table {
    table-layout: fixed;
  }
  td {
    white-space: nowrap !important;
  }
  th {
    white-space: pre-wrap !important;
    background-color: rgb(var(--v-theme-light-info));
    border-block: 1px solid $border-color;
    &:first-of-type {
      border-inline-start: 1px solid $border-color;
    }
    &:last-of-type {
      border-inline-end: 1px solid $border-color;
    }
    .v-data-table-header__sort-icon {
      font-size: 0.95rem;
      color: $icon-color;
    }
  }

  thead tr:nth-child(2) th {
    &:first-of-type {
      border-inline-start: 0;
    }
    &:last-of-type {
      border-inline-end: 0;
    }
  }
}
</style>
