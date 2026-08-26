<script lang="ts" setup generic="R extends boolean">
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import type {
  MonthPickerPropType,
  MonthProps,
  VueDatePickerModelValueType,
  YearMonthValue,
} from '@/components/nova/form/calendar/types'

const props = withDefaults(defineProps<MonthPickerPropType<R>>(), {
  required: false,
  disabled: false,
})

const model = defineModel<MonthProps<R>['modelValue']>({ required: true })
const { t } = useI18n()
const isRange = computed(() => props.range === '' || props.range === true)
const normalizedRange = computed(() => isRange.value as R)

const maxDayjs = computed(() => (props.maxDate ? dayjs(props.maxDate) : undefined))
const minDayjs = computed(() => (props.minDate ? dayjs(props.minDate) : undefined))

const isYearMonthValue = (value: unknown): value is YearMonthValue => {
  return !!value && typeof value === 'object' && 'year' in value && 'month' in value
}

const getMonthString = (value: YearMonthValue) => {
  if (isYearMonthValue(value)) {
    return `${value.year}-${String(value.month + 1).padStart(2, '0')}-01`
  }
  return ''
}

const rules = (inputValue: MonthProps<R>['modelValue']) => {
  if (Array.isArray(inputValue)) {
    const isCompleteRange = inputValue.length === 2 && inputValue.every(isYearMonthValue)

    if (props.required && !isCompleteRange) {
      return t('invalid.required')
    }
    if (inputValue.length > 0 && !isCompleteRange) {
      return t('invalid.invalidDate')
    }
    if (isCompleteRange && dayjs(getMonthString(inputValue[0])).isAfter(getMonthString(inputValue[1]), 'month')) {
      return t('invalid.invalidDate')
    }
    const max = maxDayjs.value
    if (max && inputValue.some(value => max.isBefore(getMonthString(value), 'month'))) {
      return t('invalid.maxDate', { date: max.format('YYYY/MM') })
    }
    const min = minDayjs.value
    if (min && inputValue.some(value => min.isAfter(getMonthString(value), 'month'))) {
      return t('invalid.minDate', { date: min.format('YYYY/MM') })
    }
  } else {
    if (inputValue && !isYearMonthValue(inputValue)) {
      return t('invalid.invalidDate')
    }
    if (props.required && !inputValue) {
      return t('invalid.required')
    }
    if (inputValue && maxDayjs.value && maxDayjs.value.isBefore(getMonthString(inputValue), 'month')) {
      return t('invalid.maxDate', { date: maxDayjs.value.format('YYYY/MM') })
    }
    if (inputValue && minDayjs.value && minDayjs.value.isAfter(getMonthString(inputValue), 'month')) {
      return t('invalid.minDate', { date: minDayjs.value.format('YYYY/MM') })
    }
  }

  return true
}

const handleUpdateSelectedDate = (value: VueDatePickerModelValueType<R>) => {
  if (Array.isArray(value)) {
    model.value = value.filter(isYearMonthValue) as MonthProps<R>['modelValue']
  } else if (isYearMonthValue(value)) {
    model.value = value as MonthProps<R>['modelValue']
  } else if (!value) {
    model.value = (isRange.value ? [] : null) as MonthProps<R>['modelValue']
  }
}
</script>

<template>
  <NovaValidationInput :value="model" :rules="[rules]">
    <template #default="{ invalid }">
      <NovaCustomVueDatePicker
        type="month"
        :model-value="model"
        :range="normalizedRange"
        :max-dayjs="maxDayjs"
        :min-dayjs="minDayjs"
        :disabled="disabled"
        :width="width"
        :invalid="invalid"
        :start-date="startDate"
        @update:model-value="handleUpdateSelectedDate"
      />
    </template>

    <template v-if="$slots.prepend" #prepend>
      <slot name="prepend" />
    </template>

    <template v-if="$slots.explanation" #explanation>
      <slot name="explanation" />
    </template>
  </NovaValidationInput>
</template>
