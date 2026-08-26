<script setup lang="ts" generic="T extends 'input' | 'select' | 'checkbox'">
import { NovaIconTypes } from '@/components/icons/constants'
import type { OptionType } from '@/components/input/types'

type CommonProps = {
  label: string
}
type InputProps = {
  type: 'input'
  modelValue: string
  options?: never // inputの時は絶対に渡せない（エラーにする）
}
type CheckboxProps = {
  type: 'checkbox'
  modelValue: string[]
  options: OptionType<string>[]
}
type SelectProps = {
  type: 'select'
  modelValue: string | string[]
  multiple?: boolean
  options: OptionType<string>[]
}

type PropType = CommonProps & (InputProps | CheckboxProps | SelectProps)

defineProps<PropType>()
const model = defineModel<PropType['modelValue']>({ required: true })
</script>

<template>
  <div>
    <v-label class="mb-1">{{ label }}</v-label>
    <NovaCustomTextField
      v-if="type === 'input'"
      v-model="model as string"
      :placeholder="label"
      width="200px"
      :prepend-icon="NovaIconTypes.Search"
    />
    <NovaCustomCheckboxes v-else-if="type === 'checkbox'" v-model="model as string[]" :options="options!" inline />
    <NovaCustomSelect
      v-else-if="type === 'select'"
      v-model="model"
      :options="options"
      :placeholder="label"
      :multiple="multiple"
      width="200px"
    />
  </div>
</template>
