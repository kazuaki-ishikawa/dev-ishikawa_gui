import type { Dayjs } from 'dayjs'
import type { ColorKeyList } from '@/components/constants'

type RangeFlag<R extends boolean> = R | ''

export type DateProps<R extends boolean> = {
  type: 'date'
  range?: RangeFlag<R>
  modelValue: R extends true ? [string, string] | [] : string
}
export type DatePickerModelValueType = DateProps<false>['modelValue']
export type RangeDatePickerModelValueType = DateProps<true>['modelValue']

export type YearMonthValue = { year: number; month: number }
export type MonthProps<R extends boolean> = {
  type: 'month'
  range?: RangeFlag<R>
  modelValue: R extends true ? [YearMonthValue, YearMonthValue] | [] : YearMonthValue | null
}
export type MonthPickerModelValueType = MonthProps<false>['modelValue']
export type RangeMonthPickerModelValueType = MonthProps<true>['modelValue']

export type YearProps<R extends boolean> = {
  type: 'year'
  range?: RangeFlag<R>
  modelValue: R extends true ? [number, number] | [] : number | null
}
export type YearPickerModelValueType = YearProps<false>['modelValue']
export type RangeYearPickerModelValueType = YearProps<true>['modelValue']

export type VueDatePickerPropType<R extends boolean> = (DateProps<R> | MonthProps<R> | YearProps<R>) & {
  required?: boolean
  startDate?: string
  disabled?: boolean
  disabledDates?: (value: Date) => boolean
  width?: string | number
  invalid?: boolean
  maxDayjs?: Dayjs
  minDayjs?: Dayjs
  color?: (typeof ColorKeyList)[number]
}
export type VueDatePickerModelValueType<R extends boolean> = VueDatePickerPropType<R>['modelValue']

export type DatePickerPropType<R extends boolean> = Omit<DateProps<R>, 'type'> & {
  required?: boolean
  startDate?: string
  disabled?: boolean
  disabledDates?: (value: Date) => boolean
  width?: string | number
  maxDate?: string
  minDate?: string
  color?: (typeof ColorKeyList)[number]
}
export type MonthPickerPropType<R extends boolean> = Omit<MonthProps<R>, 'type'> & {
  required?: boolean
  startDate?: string
  disabled?: boolean
  width?: string | number
  maxDate?: string
  minDate?: string
}

export type YearPickerPropType<R extends boolean> = Omit<YearProps<R>, 'type'> & {
  required?: boolean
  disabled?: boolean
  width?: string | number
  max?: number
  min?: number
}

export type DatePickerFormPropType<R extends boolean> = {
  inputProps: Omit<DatePickerPropType<R>, 'modelValue' | 'color'>
  isConfirmation?: boolean
  original?: DateProps<R>['modelValue']
}
