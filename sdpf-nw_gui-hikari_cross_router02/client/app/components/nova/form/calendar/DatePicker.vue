<script lang="ts" setup generic="R extends boolean">
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import type { DateProps, DatePickerPropType, VueDatePickerModelValueType } from '@/components/nova/form/calendar/types'

const props = withDefaults(defineProps<DatePickerPropType<R>>(), {
  required: false,
  disabled: false,
})

const model = defineModel<DateProps<R>['modelValue']>({ required: true })
const { t } = useI18n()
const isRange = computed(() => props.range === '' || props.range === true)
const normalizedRange = computed(() => isRange.value as R)

const maxDayjs = computed(() => (props.maxDate ? dayjs(props.maxDate) : undefined))
const minDayjs = computed(() => (props.minDate ? dayjs(props.minDate) : undefined))

const isDisabledDate = (date: string) => {
  return props.disabledDates && props.disabledDates(new Date(date))
}
const isInvalidDate = (date: string) => {
  return !!date && !/^\d{4}(\/|-)\d{1,2}(\/|-)\d{1,2}$/.test(date)
}
const rules = (inputValue: DateProps<R>['modelValue']) => {
  if (Array.isArray(inputValue)) {
    const isCompleteRange = inputValue.length === 2 && inputValue.every(date => !!date && !isInvalidDate(date))

    if (props.required && !isCompleteRange) {
      return t('invalid.required')
    }
    if (inputValue.length > 0 && !isCompleteRange) {
      return t('invalid.invalidDate')
    }
    if (isCompleteRange && (dayjs(inputValue[0]).isAfter(inputValue[1], 'date') || inputValue.some(isDisabledDate))) {
      return t('invalid.invalidDate')
    }
    const max = maxDayjs.value
    if (max && inputValue.some(date => max.isBefore(date, 'date'))) {
      return t('invalid.maxDate', { date: max.format('YYYY/MM/DD') })
    }
    const min = minDayjs.value
    if (min && inputValue.some(date => min.isAfter(date, 'date'))) {
      return t('invalid.minDate', { date: min.format('YYYY/MM/DD') })
    }
  }
  if (typeof inputValue === 'string') {
    if (isInvalidDate(inputValue) || isDisabledDate(inputValue)) {
      return t('invalid.invalidDate')
    }
    if (props.required && !inputValue) {
      return t('invalid.required')
    }
    if (maxDayjs.value && maxDayjs.value.isBefore(inputValue, 'date')) {
      return t('invalid.maxDate', { date: maxDayjs.value.format('YYYY/MM/DD') })
    }
    if (minDayjs.value && minDayjs.value.isAfter(inputValue, 'date')) {
      return t('invalid.minDate', { date: minDayjs.value.format('YYYY/MM/DD') })
    }
  }

  return true
}

const getDateString = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
const handleUpdateSelectedDate = (value: VueDatePickerModelValueType<R>) => {
  // VueDatePicker の内部は Date 型で管理されているため、Date 型前提で実装する
  if (value instanceof Date) {
    model.value = getDateString(value) as DateProps<R>['modelValue']
  } else if (Array.isArray(value)) {
    model.value = value.map(date => (date instanceof Date ? getDateString(date) : '')) as DateProps<R>['modelValue']
  } else if (!value) {
    model.value = (isRange.value ? [] : '') as DateProps<R>['modelValue']
  }
}
</script>

<template>
  <NovaValidationInput :value="model" :rules="disabled ? [] : [rules]">
    <template #default="{ invalid }">
      <NovaCustomVueDatePicker
        type="date"
        :model-value="model"
        :range="normalizedRange"
        :max-dayjs="maxDayjs"
        :min-dayjs="minDayjs"
        :start-date="startDate"
        :disabled="disabled"
        :disabled-dates="disabledDates"
        :width="width"
        :invalid="invalid"
        :color="color"
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
