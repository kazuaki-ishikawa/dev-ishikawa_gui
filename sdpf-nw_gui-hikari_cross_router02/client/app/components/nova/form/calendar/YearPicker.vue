<script lang="ts" setup generic="R extends boolean">
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import type { YearPickerPropType, VueDatePickerModelValueType, YearProps } from '@/components/nova/form/calendar/types'

const props = withDefaults(defineProps<YearPickerPropType<R>>(), {
  required: false,
  disabled: false,
})

const model = defineModel<YearProps<R>['modelValue']>({ required: true })

const { t } = useI18n()
const isRange = computed(() => props.range === '' || props.range === true)
const normalizedRange = computed(() => isRange.value as R)

const maxDayjs = computed(() => (props.max ? dayjs().year(props.max) : undefined))
const minDayjs = computed(() => (props.min ? dayjs().year(props.min) : undefined))

const isYearValue = (value: unknown): value is number => {
  return value !== null && typeof value === 'number'
}

const rules = (inputValue: YearPickerPropType<R>['modelValue']) => {
  if (Array.isArray(inputValue)) {
    const isCompleteRange = inputValue.length === 2 && inputValue.every(isYearValue)

    if (props.required && !isCompleteRange) {
      return t('invalid.required')
    }
    if (inputValue.length > 0 && !isCompleteRange) {
      return t('invalid.invalidDate')
    }
    if (isCompleteRange && inputValue[0] > inputValue[1]) {
      return t('invalid.invalidDate')
    }
    const max = props.max
    if (max && inputValue.some(value => max < value)) {
      return t('invalid.maxDate', { date: max })
    }
    const min = props.min
    if (min && inputValue.some(value => min > value)) {
      return t('invalid.minDate', { date: min })
    }
  } else {
    if (props.required && inputValue === null) {
      return t('invalid.required')
    }
    if (isYearValue(inputValue) && props.max && props.max < inputValue) {
      return t('invalid.maxDate', { date: props.max })
    }
    if (isYearValue(inputValue) && props.min && props.min > inputValue) {
      return t('invalid.minDate', { date: props.min })
    }
  }

  return true
}

const handleUpdateSelectedDate = (value: VueDatePickerModelValueType<R>) => {
  if (Array.isArray(value)) {
    model.value = value.filter(isYearValue) as YearProps<R>['modelValue']
  } else if (isYearValue(value)) {
    model.value = value as YearProps<R>['modelValue']
  } else if (!value) {
    model.value = (isRange.value ? [] : null) as YearProps<R>['modelValue']
  }
}
</script>

<template>
  <NovaValidationInput :value="model" :rules="[rules]">
    <template #default="{ invalid }">
      <NovaCustomVueDatePicker
        type="year"
        :model-value="model"
        :range="normalizedRange"
        :max-dayjs="maxDayjs"
        :min-dayjs="minDayjs"
        :disabled="disabled"
        :width="width"
        :invalid="invalid"
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
