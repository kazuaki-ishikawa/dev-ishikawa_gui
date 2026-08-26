<script setup lang="ts">
import type { Dayjs } from 'dayjs'
import { useI18n } from 'vue-i18n'
import { IconTypes } from '@/components/icons/constants'

type PropType = {
  mode: 'year' | 'month'
  options: Array<{ text: string; value: number; disabled?: boolean }>
  currentYear?: number
  minDayjs?: Dayjs
  maxDayjs?: Dayjs
}
const model = defineModel<number>({ required: true })
const props = defineProps<PropType>()

type Emits = {
  (e: 'change', direction: 'prev' | 'next'): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()

const yearUnit = computed(() => t('nova.calender.unit.year'))
const prevDisabled = computed(() => {
  if (props.mode === 'month') {
    return props.minDayjs && props.currentYear ? props.currentYear <= props.minDayjs.year() : false
  }
  return false
})
const nextDisabled = computed(() => {
  if (props.mode === 'month') {
    return props.maxDayjs && props.currentYear ? props.currentYear >= props.maxDayjs.year() : false
  }
  return false
})

const yearModeHeaderText = computed(() => {
  const start = props.options[0]?.value ?? ''
  const end = props.options[props.options.length - 1]?.value ?? ''
  return `${start}${yearUnit.value} - ${end}${yearUnit.value}`
})
</script>

<template>
  <div>
    <div v-if="mode === 'year'" class="font-weight-bold text-center mt-3">
      {{ yearModeHeaderText }}
    </div>
    <div v-else-if="mode === 'month'" class="month-year-selector-header">
      <button
        type="button"
        class="month-year-selector-header-arrow-button"
        :disabled="prevDisabled"
        @click="emits('change', 'prev')"
      >
        <SvgIcon :type="IconTypes.ChevronLeft" color="info" size="small" />
      </button>
      <div class="font-weight-bold text-center">{{ currentYear }}{{ yearUnit }}</div>
      <button
        type="button"
        class="month-year-selector-header-arrow-button"
        :disabled="nextDisabled"
        @click="emits('change', 'next')"
      >
        <SvgIcon :type="IconTypes.ChevronRight" color="info" size="small" />
      </button>
    </div>
    <div class="month-year-selector-item-grid pa-3">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="month-year-selector-item px-5"
        :disabled="option.disabled"
        :class="{ selected: option.value === model }"
        :data-cy="`month-year-selector-item-${option.value}`"
        @click="model = option.value"
      >
        {{ mode === 'year' ? option.value : option.text }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$hover-bg-color: rgb(var(--v-theme-light-info));

.month-year-selector-header {
  display: grid;
  grid-template-columns: 2rem 1fr 2rem;
  align-items: center;
  width: 100%;
  padding: 6px 8px;
}
.month-year-selector-header-arrow-button {
  background: none;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  &:hover {
    background-color: $hover-bg-color;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.month-year-selector-item-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.25rem;
}
.month-year-selector-item {
  height: 40px;
  border: none;
  border-radius: 0.25rem;
  background-color: transparent;
  &:disabled {
    opacity: 0.38;
    cursor: not-allowed;
  }
  &:hover:not(:disabled) {
    background-color: $hover-bg-color;
    color: #000;
  }
  &.selected {
    background-color: #000;
    color: #fff;
  }
}
</style>
