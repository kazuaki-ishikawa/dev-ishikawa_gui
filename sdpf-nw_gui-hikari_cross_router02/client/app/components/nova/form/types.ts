import type { ColorKeyList } from '@/components/constants'
import type { NovaIconType } from '@/components/icons/constants'

export type RuleType<T> = (value: T) => true | string

export type OptionType<T> = {
  text: string
  value: T
}
export type CheckboxFormOptionType<T> = OptionType<T> & {
  help?: string
}
export type CustomCheckboxesPropType<T> = {
  options: Array<CheckboxFormOptionType<T>>
  color?: (typeof ColorKeyList)[number]
  required?: boolean
  maxItems?: number
  disabled?: boolean
  inline?: boolean
}
export type CheckboxFormPropType<T> = {
  inputProps: Omit<CustomCheckboxesPropType<T>, 'color'>
  isConfirmation?: boolean
  original?: T[]
}

export type RadioFormOptionType<T> = OptionType<T> & {
  disabled?: boolean
  help?: string
  icon?: NovaIconType
}
export type CustomRadioGroupOptionType<T> = {
  color?: (typeof ColorKeyList)[number]
  options: Array<RadioFormOptionType<T>>
  disabled?: boolean
  inline?: boolean
  columns?: number
}
export type RadioFormPropType<T> = {
  inputProps: Omit<CustomRadioGroupOptionType<T>, 'color'>
  isConfirmation?: boolean
  original?: T
}

export type CustomTextFieldPropType = {
  color?: (typeof ColorKeyList)[number]
  rules?: RuleType<string>[]
  required?: boolean
  disabled?: boolean
  width?: string
  placeholder?: string
  password?: boolean
  prependIcon?: NovaIconType
  maxLength?: number
}

export type InputFormPropType = {
  inputProps?: Omit<CustomTextFieldPropType, 'color'>
  isConfirmation?: boolean
  original?: string
}
export type InputPrefixedIpFormType = {
  prefix: number
  inputProps?: Omit<CustomTextFieldPropType, 'color' | 'maxLength'>
  isConfirmation?: boolean
  original?: string
}

type SelectFormOptionType = OptionType<string> & {
  button?: {
    label?: string
    click: () => void
  }
}
export type CustomSelectPropType = {
  color?: (typeof ColorKeyList)[number]
  rules?: RuleType<string>[]
  required?: boolean
  disabled?: boolean
  width?: string
  placeholder?: string
  options: SelectFormOptionType[]
  multiple?: boolean // true の場合は v-model が string[] となる
  allowCustomValue?: boolean // 候補外の値も入力・保持できるようにする
}

export type SelectFormPropType = {
  inputProps: Omit<CustomSelectPropType, 'color'>
  isConfirmation?: boolean
  original?: string | string[]
}
