<script setup lang="ts">
import type { SizeType } from './types'

type PropType = {
  minutesSpan: 1 | 5 | 15 | 30 | 60
  required?: boolean
  minDate?: string
  maxDate?: string
  startDate?: string
  size?: [SizeType, SizeType]
  clearable?: boolean
  disabled?: boolean
  showDatePicker?: boolean
  disabledDates?: (value: Date) => boolean
}
const props = withDefaults(defineProps<PropType>(), {
  size: () => ['small', 'xSmall'],
  clearable: false,
  showDatePicker: true,
})
const model = defineModel<{ date: string; hours: string; minutes: string }>({ required: true })
type Emits = {
  (e: 'valid', valid: boolean): void
}
const emits = defineEmits<Emits>()

const HourOptions = Array.from({ length: 24 }, (_, i) => ({
  value: i.toString().padStart(2, '0'),
  text: i.toString().padStart(2, '0'),
}))
const MinuteOptions = computed(() => {
  const length = 60 / props.minutesSpan
  return Array.from({ length: length }, (_, i) => ({
    value: (i * props.minutesSpan).toString().padStart(2, '0'),
    text: (i * props.minutesSpan).toString().padStart(2, '0'),
  }))
})

const handleModelChange = (key: 'date' | 'hours' | 'minutes', value: string) => {
  // model を computed 記述したときに 入力コンポーネントの v-model が正常に動作しなかったので関数を作成
  model.value = { ...model.value, [key]: value }
}
</script>

<template>
  <div class="ga-2 flex-center-start">
    <DatePicker
      v-if="showDatePicker"
      :model-value="model.date"
      :required="required"
      :size="size[0]"
      :min-date="minDate"
      :max-date="maxDate"
      :start-date="startDate"
      :disabled-dates="disabledDates"
      :disabled="disabled"
      :clearable="clearable"
      data-cy="date-time-picker-date"
      @update:model-value="(value: string) => handleModelChange('date', value)"
      @valid="(valid: boolean) => emits('valid', valid)"
    />
    <SelectForm
      :model-value="model.hours"
      required
      :size="size[1]"
      :options="HourOptions"
      :disabled="disabled"
      data-cy="date-time-picker-hours"
      @update:model-value="(value: string) => handleModelChange('hours', value)"
    />
    <span class="mt-1">:</span>
    <SelectForm
      :model-value="model.minutes"
      required
      :size="size[1]"
      :options="MinuteOptions"
      :disabled="disabled"
      data-cy="date-time-picker-minutes"
      @update:model-value="(value: string) => handleModelChange('minutes', value)"
    />
  </div>
</template>
