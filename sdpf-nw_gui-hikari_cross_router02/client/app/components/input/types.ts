import type { Size } from './constants'
import type { IconType } from '@/components/icons/constants'

type RuleType = (value: string) => true | string
export type SizeType = keyof typeof Size

export type OptionType<T> = {
  text: string
  value: T
}
export type CheckboxFormOptionType<T> = OptionType<T> & {
  help?: string
}
export type RadioFormOptionType<T> = OptionType<T> & {
  disabled?: boolean // 個々のラジオボタンを無効化するオプション
  icon?: IconType
  help?: string
}
type SelectFormOptionType = OptionType<string> & {
  button?: {
    label?: string
    click: () => void
  }
}

type BaseFormPropType = {
  rules?: RuleType[]
  size?: SizeType
  required?: boolean
  disabled?: boolean
}
export type InputFormPropType = BaseFormPropType & {
  maxlength?: number | string
  minlength?: number | string
  placeholder?: string
  password?: boolean
}
export type InputPrefixedIpFormPropType = InputFormPropType & {
  prefix: number
}
export type SelectFormPropType = BaseFormPropType & {
  options: SelectFormOptionType[]
  placeholder?: string
  maxItems?: number
}

export type NoBorderSelectFormPropType<T> = {
  options: OptionType<T>[]
  placeholder?: string
  required?: boolean
  size?: SizeType
}
