<script lang="ts" setup generic="T extends string">
import { useI18n } from 'vue-i18n'
import type { CheckboxFormOptionType } from '@/components/input/types'

type PropType = {
  options: CheckboxFormOptionType<T>[]
  required?: boolean
  maxItems?: number
  disabled?: boolean
  colMinWidth?: string
}
const props = withDefaults(defineProps<PropType>(), {
  required: false,
  maxItems: undefined,
  disabled: false,
  colMinWidth: '150px',
})
const model = defineModel<T[]>('value', { required: true })

type Emits = {
  (e: 'valid', valid: boolean): void
}
const emits = defineEmits<Emits>()
const { t } = useI18n()

const errorMessage = computed(() => {
  if (props.disabled) {
    return ''
  }
  return !props.required || model.value.length > 0 ? '' : t('invalid.required')
})
watch(errorMessage, next => emits('valid', !next), { immediate: true })

const checkboxDisabled = (value: T) => {
  if (props.maxItems === 0) {
    return true
  } else if (props?.maxItems && props.maxItems <= model.value.length) {
    return props.disabled || !model.value.includes(value)
  } else {
    return props.disabled
  }
}
const labelClass = (value: T) => {
  const list = ['label']
  if (checkboxDisabled(value)) {
    list.push('disabled')
  }
  if (errorMessage.value) {
    list.push('error')
  }
  return list
}
const handleClick = (value: T) => {
  if (!checkboxDisabled(value)) {
    model.value = model.value.includes(value) ? model.value.filter(val => val !== value) : [...model.value, value]
  }
}
</script>

<template>
  <div>
    <div class="input-box">
      <div v-for="option in props.options" :key="option.value" class="checkbox-base">
        <CheckboxBase
          :value="model.includes(option.value)"
          :disabled="checkboxDisabled(option.value)"
          :error="!!errorMessage"
          @update:value="() => handleClick(option.value)"
        />
        <div :class="[...labelClass(option.value), option.value]" @click.stop="handleClick(option.value)">
          {{ option.text }}
          <HelpTooltip v-if="!!option?.help" class="pl-1 pt-1" size="smallMiddle">
            {{ option.help }}
          </HelpTooltip>
        </div>
      </div>
    </div>
    <div class="error">
      {{ errorMessage }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
$min-width: v-bind(colMinWidth);
$info-color: rgb(var(--v-theme-info));
$warning-color: rgb(var(--v-theme-warning));

.input-box {
  position: relative;
  display: grid;
  grid-auto-rows: auto;
  grid-gap: 0.25rem;
  grid-template-columns: repeat(auto-fill, minmax($min-width, 1fr));
  grid-template-rows: auto;
}

.checkbox-base {
  display: flex;
  align-items: center;
}

.label {
  display: flex;
  align-items: center;
  margin-left: 0.5rem;
  margin-bottom: 2px;
  padding-left: 4.8px;
  overflow-wrap: anywhere;
  width: calc(100% - 15px);
  cursor: pointer;
  &.disabled {
    cursor: auto;
    color: $info-color;
  }
  &.error {
    font-size: 1rem;
    color: $warning-color;
  }
}
.error {
  font-size: 0.825rem;
  color: $warning-color;
}
</style>
