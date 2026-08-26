<script lang="ts" setup generic="R extends boolean">
import { useI18n } from 'vue-i18n'
import { ja } from 'date-fns/locale'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import type { MonthYearOverlaySlotProps } from '@vuepic/vue-datepicker'
import type { VueDatePickerPropType, VueDatePickerModelValueType } from '@/components/nova/form/calendar/types'

const props = withDefaults(defineProps<VueDatePickerPropType<R>>(), {
  required: false,
  disabled: false,
  width: '380px',
})

const model = defineModel<VueDatePickerModelValueType<R>>({ required: true })

const { t } = useI18n()
const width = computed(() => props.width)
const isRange = computed(() => props.range === '' || props.range === true)
const multiple = computed(() => (isRange.value ? { solo: true, count: 2 } : false))

const validBgColor = computed(() => {
  if (props.color) {
    return `rgb(var(--v-theme-light-${props.color}))`
  }
  return props.disabled ? 'rgb(var(--v-theme-light-info))' : 'white'
})
const validColor = computed(() => {
  if (props.color) {
    return `rgb(var(--v-theme-${props.color}))`
  }
  return ''
})

// range時に長さが 0/2 以外の不正な配列が渡された場合、実体の VueDatePicker が例外を投げてしまうため、
// 表示直前に空配列へ丸めてクラッシュを防ぐ（不正値の混入自体はプログラム側の誤りであり、通常のUI操作では発生しない）。
const safeModel = computed(() => {
  const value = model.value
  if (isRange.value && Array.isArray(value) && value.length !== 0 && value.length !== 2) {
    return [] as VueDatePickerModelValueType<R>
  }
  return value
})

const basePlaceholder = computed(() => {
  switch (props.type) {
    case 'date':
      return `${t('nova.calender.unit.year')}/${t('nova.calender.unit.month')}/${t('nova.calender.unit.day')}`
    case 'month':
      return `${t('nova.calender.unit.year')}/${t('nova.calender.unit.month')}`
    case 'year':
      return t('nova.calender.unit.year')
    default:
      return 'yyyy/MM/dd'
  }
})
const placeholder = computed(() =>
  isRange.value ? `${basePlaceholder.value} - ${basePlaceholder.value}` : basePlaceholder.value,
)

const format = computed(() => {
  switch (props.type) {
    case 'date':
      return 'yyyy/MM/dd'
    case 'month':
      return 'yyyy/MM'
    case 'year':
      return 'yyyy'
    default:
      return undefined
  }
})

const yearsFilter = (year: { text: string; value: number }) => {
  const isMinYears = !props.minDayjs || year.value >= props.minDayjs.year()
  const isMaxYears = !props.maxDayjs || year.value <= props.maxDayjs.year()
  return isMinYears && isMaxYears
}
const getMonthDisabled = (year: number, month: number) => {
  const isMinMonth = !!props.minDayjs && year === props.minDayjs.year() && month < props.minDayjs.month()
  const isMaxMonth = !!props.maxDayjs && year === props.maxDayjs.year() && month > props.maxDayjs.month()
  return isMinMonth || isMaxMonth
}
const getMonthInRange = (year: number, month: number) => {
  if (props.minDayjs && year === props.minDayjs.year() && month < props.minDayjs.month()) {
    return props.minDayjs.month()
  }
  if (props.maxDayjs && year === props.maxDayjs.year() && month > props.maxDayjs.month()) {
    return props.maxDayjs.month()
  }
  return month
}
const handleSelectMonthYear = (data: MonthYearOverlaySlotProps, month: number, year: number) => {
  data.updateMonthYear(getMonthInRange(year, month), year)
  data.toggle()
}
const handleNextPrevMonthYear = (data: MonthYearOverlaySlotProps, direction: 'prev' | 'next') => {
  if (direction === 'prev') {
    data.updateMonthYear(data.month, data.year - 1)
  } else {
    data.updateMonthYear(data.month, data.year + 1)
  }
}
</script>

<template>
  <VueDatePicker
    :model-value="safeModel"
    class="vue-date-picker"
    :ui="{ input: 'vue-date-picker-input' }"
    :locale="ja"
    week-start="0"
    auto-apply
    :start-date="startDate || minDayjs?.toDate()"
    prevent-min-max-navigation
    :min-date="minDayjs?.toDate()"
    :max-date="maxDayjs?.toDate()"
    :disabled-dates="disabledDates"
    :formats="{ input: format, preview: format }"
    :placeholder="placeholder"
    :class="{ valid: !invalid, invalid, disabled }"
    :time-config="{ enableTimePicker: false }"
    :disabled="disabled"
    :teleport="true"
    :range="isRange ? { partialRange: false } : false"
    :multi-calendars="multiple"
    :month-picker="type === 'month'"
    :year-picker="type === 'year'"
    year-first
    clearable
    @update:model-value="model = $event"
  >
    <template #year="{ value }"> {{ value }}{{ t('nova.calender.unit.year') }} </template>

    <template #month-overlay="data">
      <NovaYearMonthSelector
        mode="month"
        :current-year="data.year"
        :model-value="data.month"
        :options="
          data.items.map(month => ({
            text: month.text,
            value: month.value,
            disabled: getMonthDisabled(data.year, month.value),
          }))
        "
        :min-dayjs="minDayjs"
        :max-dayjs="maxDayjs"
        @change="handleNextPrevMonthYear(data, $event)"
        @update:model-value="(value: number) => handleSelectMonthYear(data, value, data.year)"
      />
    </template>

    <template #year-overlay="data">
      <NovaYearMonthSelector
        mode="year"
        :model-value="data.year"
        :options="data.items.filter(yearsFilter)"
        @update:model-value="(value: number) => handleSelectMonthYear(data, data.month, value)"
      />
    </template>

    <template #clear-icon="{ clear }">
      <v-icon-btn
        icon="nova:close-circle"
        size="small"
        :color="invalid ? 'error' : color ? color : undefined"
        variant="plain"
        @click.stop="clear()"
      />
    </template>
  </VueDatePicker>
</template>

<style lang="scss">
.dp--theme-light {
  --dp-primary-color: #000;
  --dp-primary-disabled-color: #626f7f;
  --dp-border-color-focus: rgb(var(--v-theme-text));
  --dp-border-color: rgb(var(--v-theme-info-lighten-3));
  --dp-font-size: 0.85rem;
  --dp-font-family: 'Noto Sans JP', sans-serif;
}
</style>

<style lang="scss" scoped>
$info-color: rgb(var(--v-theme-info));
$light-info-color: rgb(var(--v-theme-info-lighten-3));
$error-color: rgb(var(--v-theme-error));
$light-error-color: rgb(var(--v-theme-light-error));
$valid-bg-color: v-bind(validBgColor);
$valid-color: v-bind(validColor);

.vue-date-picker {
  &.invalid {
    :deep(.vue-date-picker-input) {
      background-color: $light-error-color;
      border-color: $error-color;
    }
    :deep(.dp--input-icon) {
      color: $error-color;
    }
  }

  &.valid {
    :deep(.vue-date-picker-input) {
      background-color: $valid-bg-color;
      border-color: $valid-color;
    }
    :deep(.dp--input-icon) {
      color: $valid-color;
    }
  }

  &.disabled {
    :deep(.dp--input-icon) {
      cursor: not-allowed !important;
    }
    :deep(.dp--input-wrap) {
      input {
        color: $info-color !important;
        border-color: $light-info-color !important;
        cursor: not-allowed !important;
      }
    }
  }

  :deep(.dp--input-wrap) {
    input {
      width: v-bind(width);
      padding: 6px 30px 6px 12px !important;
      cursor: auto !important;
    }
    .dp--input-icon {
      inset-inline-start: auto !important;
      right: 0 !important;
    }
    .dp--clear-btn {
      right: 28px !important;
    }
  }
}
</style>
