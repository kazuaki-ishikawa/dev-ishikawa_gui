<script setup lang="ts" generic="T">
import type { DataTableHeadersType, DataTableItemValueType } from './types'

// keyof T
type PropType = {
  headers: DataTableHeadersType
  items: Array<T>
  singleSelect?: boolean
  height?: string | number
  itemValue?: DataTableItemValueType
}
const props = withDefaults(defineProps<PropType>(), {
  singleSelect: false,
  height: '60vh',
})
const selectedItems = defineModel<Array<T>>('selectedItems')

const showSelect = computed(() => selectedItems.value !== undefined)
const selectStrategy = computed(() => (showSelect.value && props.singleSelect ? 'single' : undefined))
</script>

<template>
  <v-data-table
    v-model="selectedItems"
    :item-value="itemValue"
    :items-per-page="-1"
    :headers="headers"
    :items="items"
    sort-icon="nova:sort-arrows"
    sort-asc-icon="nova:sort-arrows-asc"
    sort-desc-icon="nova:sort-arrows-desc"
    hide-default-footer
    :header-props="{ class: 'text-pre-wrap' }"
    fixed-header
    :height="height"
    :show-select="showSelect"
    return-object
    :select-strategy="selectStrategy"
  >
    <!-- no-data スロットだけ v-for で読み込めなかったので個別 -->
    <template v-if="!!$slots.noData" #no-data>
      <slot name="noData" />
    </template>

    <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
      <slot :name="name" v-bind="slotData" />
    </template>
  </v-data-table>
</template>

<style lang="scss" scoped>
$border-color: rgb(var(--v-theme-info-lighten-3));
$icon-color: rgb(var(--v-theme-info-lighten-1));

:deep(.v-table__wrapper) {
  max-height: fit-content;
  th {
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

  td {
    padding: 0.25rem 0.5rem;
    line-height: 1.5rem;
  }
}
</style>
