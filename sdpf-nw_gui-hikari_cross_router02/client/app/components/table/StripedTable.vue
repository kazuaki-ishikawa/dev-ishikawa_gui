<script lang="ts" setup generic="T">
import type { TableHeaderType } from './types'

type PropType = {
  headers: TableHeaderType[]
  items: Array<T>
  keyItems?: Array<keyof T>
}
const props = defineProps<PropType>()

const gridColumns = computed(() => {
  const list = props.headers.map(h => {
    if (h?.width) {
      return `${h.width}px`
    }
    const minWidth = h?.minWidth ?? 80
    return `minmax(${minWidth}px, 1fr)`
  })
  return list.join(' ')
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
const slotNames = computed(() => props.headers.map(h => h.key))
</script>

<template>
  <div class="overflow-x-auto">
    <div class="header">
      <div v-for="header in headers" :key="header.key" class="cell header-cell" :class="header.class">
        <slot :name="`header-${header.key}`" :data="header.text">
          <div>{{ header.text }}</div>
          <HelpTooltip v-if="header?.help" class="px-2 pt-1" v-bind="{ size: 'smallMiddle' }">
            {{ header.help }}
          </HelpTooltip>
        </slot>
      </div>
    </div>

    <div class="body">
      <div v-for="(row, index) in items" :key="getKeyItem(row, index)" class="row">
        <div v-for="name in slotNames" :key="`row-${getKeyItem(row, index)}-${name}`" class="cell body-cell">
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
$light-secondary-color: rgb(var(--v-theme-light-secondary));

.header {
  display: grid;
  grid-template-columns: $grid-columns;
  background-color: #fff;
  width: max-content;
  min-width: 100%;
}
.cell {
  padding: 0 12px;
  display: flex;
  align-items: center;
  word-break: break-all;
}
.header-cell {
  height: 20px;
  border-left: v.$split-border;
  margin: 10px 0;
  &:first-of-type {
    border-left: none;
  }
}
.body-cell {
  min-height: 40px;
}
.row {
  display: grid;
  grid-template-columns: $grid-columns;
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
