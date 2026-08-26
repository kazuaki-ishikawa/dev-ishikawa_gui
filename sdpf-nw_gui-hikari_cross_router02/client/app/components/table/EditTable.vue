<script lang="ts" setup generic="T">
import { cloneDeep } from 'es-toolkit'
import { nanoid } from 'nanoid'
import { IconTypes } from '@/components/icons/constants'

export type InputTableHeaderType = {
  text: string
  key: string
  help?: string
  helpContentWidth?: number
  width?: number
}

type PropItemWithIdType = T & { id: string }

type PropType = {
  headers: InputTableHeaderType[]
  disabled?: boolean
  orderable?: boolean
  editable?: boolean
  maxItems?: number
}
const items = defineModel<Array<T>>('items', { required: true })
const props = withDefaults(defineProps<PropType>(), {
  disabled: false,
  orderable: false,
  editable: false,
  maxItems: undefined,
})

type Emits = {
  (e: 'click:add'): void
  (e: 'click:edit', index: number): void
}
const emits = defineEmits<Emits>()
const itemsWithId = ref<PropItemWithIdType[]>([]) as Ref<PropItemWithIdType[]>

const buttonsWidth = computed(() => {
  const defaultWidth = 55
  const orderWidth = props.orderable ? 75 : 0
  const editableWidth = props.editable ? 45 : 0
  if (props.disabled) {
    return `${defaultWidth}px`
  } else {
    return `${defaultWidth + orderWidth + editableWidth}px`
  }
})
const gridcolumns = computed(() => {
  const list = props.headers.map(h => (h?.width ? `${h.width + 40}px` : '1fr'))
  return [...list, buttonsWidth.value].join(' ')
})
const slotNames = computed(() => props.headers.map(h => h.key))
const addDisabled = computed(() => props.maxItems !== undefined && items.value.length >= props.maxItems)
const showOrderButton = computed(() => !props.disabled && props.orderable)
const editableIcon = computed(() => (props.disabled ? 'search' : 'edit'))

const handleTrushClick = (index: number) => {
  const newData = cloneDeep(items.value)
  newData.splice(index, 1)
  items.value = newData
}
const handleUpClick = (index: number) => {
  const newData = cloneDeep(items.value)
  const current = newData[index]
  const previous = newData[index - 1]
  if (!current || !previous) {
    return
  }
  newData.splice(index - 1, 2, current, previous)
  items.value = newData
}
const handleDownClick = (index: number) => {
  const newData = cloneDeep(items.value)
  const current = newData[index]
  const next = newData[index + 1]
  if (!current || !next) {
    return
  }
  newData.splice(index, 2, next, current)
  items.value = newData
}

const resetItemsWithKey = () => {
  itemsWithId.value = items.value.map(v => ({ ...v, id: nanoid() }))
}
watch(() => items.value, resetItemsWithKey)
onBeforeMount(resetItemsWithKey)
</script>

<template>
  <div class="edit-table-container">
    <div class="edit-table">
      <div class="header">
        <div v-for="header in props.headers" :key="header.key" class="cell">
          <div>{{ header.text }}</div>
          <HelpTooltip
            v-if="header?.help || $slots[`help-${header.key}`]"
            class="ml-2"
            :content-width="header.helpContentWidth"
          >
            <slot :name="`help-${header.key}`">{{ header.help }}</slot>
          </HelpTooltip>
        </div>
        <div class="buttons" />
      </div>
      <div class="body">
        <div v-for="(row, index) in itemsWithId" :key="row.id" class="row">
          <div v-for="name in slotNames" :key="`row-${row.id}-${name}`" class="cell">
            <slot :name="name" :row="row" :data="row[name as keyof PropItemWithIdType]" :index="index">
              {{ row[name as keyof PropItemWithIdType] }}
            </slot>
          </div>
          <div class="buttons flex-space-between-center">
            <IconButton
              v-if="showOrderButton"
              :type="IconTypes.ArrowUp"
              :disabled="0 === index"
              color="primary"
              @click="() => handleUpClick(index)"
            />
            <IconButton
              v-if="showOrderButton"
              :type="IconTypes.ArrowDown"
              :disabled="index + 1 === items.length"
              color="primary"
              @click="() => handleDownClick(index)"
            />
            <CircleButton
              v-if="editable"
              :icon="editableIcon"
              :class="`edit-table-${editableIcon}-button`"
              @click="emits('click:edit', index)"
            />
            <CircleButton
              v-if="!disabled"
              icon="trush"
              color="info"
              class="edit-table-trush-button"
              @click="() => handleTrushClick(index)"
            />
          </div>
        </div>
      </div>
    </div>
    <div v-if="!disabled" class="d-flex justify-end pa-3">
      <CircleButton icon="plus" :disabled="addDisabled" class="edit-table-add-button" @click="emits('click:add')" />
    </div>
  </div>
</template>

<style scoped lang="scss">
$grid-columns: v-bind(gridcolumns);
$light-secondary-color: rgb(var(--v-theme-light-secondary));

.edit-table-container {
  padding-top: 1rem;

  .edit-table {
    overflow-x: auto;
    display: block;
    background-color: #fff;
  }

  .header {
    display: grid;
    grid-template-columns: $grid-columns;
    font-size: 0.8rem;
    line-height: 1rem;
    .cell {
      display: flex;
      align-items: center;
      padding: 0.25rem 0 0.25rem 0.5rem;
      &:first-of-type::before {
        border-left: none;
      }
      &:before {
        content: '';
        border-left: v.$split-bold-border;
        padding-right: 0.5rem;
        height: 80%;
      }
    }
  }
  .body {
    min-width: fit-content;
    .row:nth-child(odd) {
      background-color: $light-secondary-color;
      .buttons {
        background-color: $light-secondary-color;
      }
    }
    .row:nth-child(even) {
      background-color: #fff;
      .buttons {
        background-color: #fff;
      }
    }
    .row {
      display: grid;
      grid-template-columns: $grid-columns;
    }
    .cell {
      word-break: break-all;
      padding: 0.5rem 0 0.5rem 1rem;
    }
  }

  .buttons {
    position: sticky;
    top: 0px;
    right: 0px;
    z-index: 1;
    background: #fff;
    padding: 0 0.75rem;
    border-left: v.$split-bold-border;
  }
}
</style>
