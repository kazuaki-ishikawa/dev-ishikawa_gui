<script lang="ts" setup>
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { ja } from 'date-fns/locale'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import type { SelectItem } from '@vuepic/vue-datepicker'
import { Size } from './constants'
import type { SizeType } from './types'
import { IconTypes } from '@/components/icons/constants'

type MonthYearSelectorType = 'year' | 'month'

type PropType = {
  maxDate?: string
  minDate?: string
  startDate?: string
  size?: SizeType
  required?: boolean
  clearable?: boolean
  disabled?: boolean
  disabledDates?: (value: Date) => boolean
}
const model = defineModel<string>({ required: true })
const props = withDefaults(defineProps<PropType>(), {
  maxDate: undefined,
  minDate: undefined,
  startDate: undefined,
  size: 'middle',
  required: false,
  clearable: true,
  disabled: false,
  disabledDates: undefined,
})

type Emits = {
  (e: 'valid', valid: boolean): void
}
const emits = defineEmits<Emits>()
const { t } = useI18n()

const isFocused = ref(false)
const width = computed(() => Size[props.size])
const maxDayjs = computed(() => (props.maxDate ? dayjs(props.maxDate) : ''))
const minDayjs = computed(() => (props.minDate ? dayjs(props.minDate) : ''))

const errorMessage = computed(() => {
  if (props.disabled) {
    return ''
  }
  if (props.required && !model.value) {
    return t('invalid.required')
  }
  if (maxDayjs.value && maxDayjs.value.isBefore(model.value, 'date')) {
    return t('invalid.maxDate', { date: maxDayjs.value.format('YYYY/MM/DD') })
  }
  if (minDayjs.value && minDayjs.value.isAfter(model.value, 'date')) {
    return t('invalid.minDate', { date: minDayjs.value.format('YYYY/MM/DD') })
  }
  if (
    Array.isArray(props.disabledDates)
      ? props.disabledDates.includes(model.value)
      : props.disabledDates?.(new Date(model.value))
  ) {
    return t('invalid.invalidDate')
  }
  return ''
})

const valid = computed(() => !errorMessage.value)
watch(valid, next => emits('valid', next), { immediate: true })

const inputState = computed(() => valid.value || (!!model.value && isFocused.value))

const useMonthYearSelectorState = () => {
  const type = ref<MonthYearSelectorType | null>(null)

  const setType = (nextType: MonthYearSelectorType | null) => {
    type.value = nextType
  }

  const toggle = (nextType: MonthYearSelectorType) => {
    setType(type.value === nextType ? null : nextType)
  }

  const close = () => {
    setType(null)
  }

  return {
    type,
    toggle,
    close,
  }
}

const {
  type: monthYearSelectorType,
  toggle: toggleMonthYearSelector,
  close: closeMonthYearSelector,
} = useMonthYearSelectorState()

const monthOptions = computed(() =>
  Array.from({ length: 12 }, (_, index) => ({
    label: `${index + 1}月`,
    value: index,
  })),
)

const yearsFilter = (year: SelectItem<number>) => {
  const isMinYears = !minDayjs.value || year.value >= minDayjs.value.year()
  const isMaxYears = !maxDayjs.value || year.value <= maxDayjs.value.year()
  return isMinYears && isMaxYears
}
const getMonthDisabled = (year: number, month: number) => {
  const isMinMonth = !!minDayjs.value && year === minDayjs.value.year() && month < minDayjs.value.month()
  const isMaxMonth = !!maxDayjs.value && year === maxDayjs.value.year() && month > maxDayjs.value.month()
  return isMinMonth || isMaxMonth
}
const getPrevMonthDisabled = (year: number, month: number) =>
  !!minDayjs.value &&
  (year < minDayjs.value.year() || (year === minDayjs.value.year() && month <= minDayjs.value.month()))
const getNextMonthDisabled = (year: number, month: number) =>
  !!maxDayjs.value &&
  (year > maxDayjs.value.year() || (year === maxDayjs.value.year() && month >= maxDayjs.value.month()))

const getMonthInRange = (year: number, month: number) => {
  if (minDayjs.value && year === minDayjs.value.year() && month < minDayjs.value.month()) {
    return minDayjs.value.month()
  }
  if (maxDayjs.value && year === maxDayjs.value.year() && month > maxDayjs.value.month()) {
    return maxDayjs.value.month()
  }
  return month
}
const handleSelectMonthYear = (updateMonthYear: (month: number, year: number) => void, month: number, year: number) => {
  updateMonthYear(getMonthInRange(year, month), year)
  closeMonthYearSelector()
}

const handleFocus = () => {
  isFocused.value = true
  closeMonthYearSelector()
}

const handleBlur = () => {
  isFocused.value = false
  closeMonthYearSelector()
}

const handleUpdateSelectedDate = (value: string) => {
  closeMonthYearSelector()
  if (value) {
    model.value = dayjs(value).format('YYYY-MM-DD')
  } else {
    model.value = ''
  }
}
</script>

<template>
  <div>
    <VueDatePicker
      :model-value="model"
      class="vue-date-picker"
      :ui="{ input: 'vue-date-picker-input' }"
      type="date"
      :locale="ja"
      week-start="0"
      auto-apply
      :start-date="startDate || minDate"
      :min-date="minDate"
      :max-date="maxDate"
      :disabled-dates="disabledDates"
      :formats="{ input: 'yyyy/MM/dd', preview: 'yyyy/MM/dd' }"
      placeholder="2025/01/01"
      :class="errorMessage ? 'invalid' : 'valid'"
      :time-config="{ enableTimePicker: false }"
      :state="inputState"
      :disabled="disabled"
      :teleport="true"
      :clearable="clearable"
      @focus="handleFocus"
      @blur="handleBlur"
      @update:model-value="handleUpdateSelectedDate"
    >
      <!-- month-yearスロットを使ってヘッダーをカスタマイズ -->
      <template #month-year="data">
        <template v-if="data.mode === 'date'">
          <div class="date-picker-month-year">
            <button
              type="button"
              class="date-picker-month-year-button"
              :disabled="getPrevMonthDisabled(data.year, data.month)"
              @click="data.handleMonthYearChange(false)"
            >
              <SvgIcon :type="IconTypes.ChevronLeft" color="info" size="small" />
            </button>
            <div class="month-year-selector">
              <button
                type="button"
                class="select-button"
                data-cy="date-picker-year-select-button"
                @click="toggleMonthYearSelector('year')"
              >
                {{ data.year }}年
              </button>
              <button
                type="button"
                class="select-button"
                data-cy="date-picker-month-select-button"
                @click="toggleMonthYearSelector('month')"
              >
                {{ data.month + 1 }}月
              </button>
              <div v-if="monthYearSelectorType === 'year'" class="month-year-menu elevation-4">
                <div class="month-year-list">
                  <button
                    v-for="year in data.years.filter(yearsFilter)"
                    :key="year.value"
                    type="button"
                    class="month-year-option"
                    :class="{ selected: year.value === data.year }"
                    :data-cy="`date-picker-year-option-${year.value}`"
                    @click="handleSelectMonthYear(data.updateMonthYear, data.month, year.value)"
                  >
                    {{ year.text }}
                  </button>
                </div>
              </div>
              <div v-if="monthYearSelectorType === 'month'" class="month-year-menu elevation-4">
                <div class="month-year-list">
                  <button
                    v-for="month in monthOptions"
                    :key="month.value"
                    type="button"
                    class="month-year-option"
                    :disabled="getMonthDisabled(data.year, month.value)"
                    :class="{ selected: month.value === data.month }"
                    :data-cy="`date-picker-month-option-${month.value + 1}`"
                    @click="handleSelectMonthYear(data.updateMonthYear, month.value, data.year)"
                  >
                    {{ month.label }}
                  </button>
                </div>
              </div>
            </div>
            <button
              type="button"
              class="date-picker-month-year-button"
              :disabled="getNextMonthDisabled(data.year, data.month)"
              @click="data.handleMonthYearChange(true)"
            >
              <SvgIcon :type="IconTypes.ChevronRight" color="info" size="small" />
            </button>
          </div>
        </template>
      </template>
      <template #clear-icon="{ clear }">
        <div class="clear-button" @click.stop="clear">
          <SvgIcon :type="IconTypes.CircleClose" :color="errorMessage ? 'warning' : 'info'" />
        </div>
      </template>
    </VueDatePicker>
    <div class="error">{{ errorMessage }}</div>
  </div>
</template>

<style lang="scss" scoped>
.clear-button {
  position: relative;
  top: 0.125rem;
  right: 0.5rem;
}
.error {
  padding-left: 0.7rem;
  font-size: 0.825rem;
  color: rgb(var(--v-theme-warning));
}
</style>

<style lang="scss">
$width: v-bind(width);
$primary-color: rgb(var(--v-theme-primary));
$info-color: rgb(var(--v-theme-info));
$warning-color: rgb(var(--v-theme-warning));
$light-info-color: rgb(var(--v-theme-light-info));
$light-warning-color: rgb(var(--v-theme-light-warning));
$hover-bg-color: $light-info-color;

.date-picker-month-year {
  display: grid;
  grid-template-columns: 2rem 1fr 2rem;
  align-items: center;
  width: 100%;
  padding: 0.25rem 0;
}
.month-year-selector {
  position: relative;
  text-align: center;
}
.select-button {
  border-radius: 0.2rem;
  border: none;
  background-color: transparent;
  color: inherit;
  &:hover {
    background-color: $hover-bg-color;
  }
}
.month-year-menu {
  position: absolute;
  z-index: 1;
  top: 2rem;
  left: 50%;
  width: 15rem;
  padding: 0.5rem;
  max-height: 12rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  border-radius: 0.5rem;
  background-color: #fff;
  transform: translateX(-50%);
}
.month-year-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.25rem;
}
.month-year-option {
  height: 2rem;
  border: none;
  border-radius: 0.375rem;
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
.date-picker-month-year-button {
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 0.5rem;
  background-color: $hover-bg-color;
  cursor: pointer;
  &:hover {
    opacity: 0.8;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
.vue-date-picker {
  width: $width;
  --dp-success-color: $primary-color;
  --dp-danger-color: $warning-color;
  --dp-font-size: calc(1rem * 5 / 6);
  --dp-font-family: 'Noto Sans JP', sans-serif;
  .dp__input_icon {
    color: $light-info-color;
  }
  &.invalid .vue-date-picker-input {
    border: 1px solid $warning-color;
    background-color: $light-warning-color;
  }
}
.vue-date-picker-input {
  height: calc(v.$input-height + 5px);
  width: $width;
  outline: none;
  border: 1px solid $info-color;
  border-radius: 0.3rem;
  &::placeholder {
    color: $light-info-color;
  }
  &.dp__input_focus {
    border: 1px solid $primary-color;
  }
  &:disabled {
    color: $info-color;
    border: 1px solid $light-info-color;
  }
}
.dp--menu {
  // カレンダー全体に影をつける
  border-radius: 0.5rem;
  box-shadow: 0 0.5rem 1rem v.$light-info-alpha-color;
  .dp--arrow-top {
    // 吹き出しを消す
    display: none;
  }
  .dp--calendar-header-separator {
    // 曜日と日付の間の区切り線を消す
    display: none;
  }
  .dp--today {
    // 今日の日付のスタイルを変更
    border-radius: 6px;
    border: 1px outset rgb(var(--v-theme-light-info));
  }
  .dp--active {
    // 現在選択中の日付
    border-radius: 6px;
    background-color: #000;
    color: #fff;
  }
  .dp--cell-inner {
    &:hover:not(.dp--cell-disabled) {
      background-color: $hover-bg-color;
    }
  }
}
</style>
