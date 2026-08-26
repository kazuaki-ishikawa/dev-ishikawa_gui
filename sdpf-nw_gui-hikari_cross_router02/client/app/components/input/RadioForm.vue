<script lang="ts" setup generic="T">
import type { RadioFormOptionType } from '@/components/input/types'

type PropType = {
  options: RadioFormOptionType<T>[]
  required?: boolean // 本来不要だが他コンポーネントとの統一のため設定だけしておく
  disabled?: boolean // 全体を無効化するオプション
  colMinWidth?: string
}
const model = defineModel<T>({ required: true })
const props = withDefaults(defineProps<PropType>(), {
  colMinWidth: 'auto',
})

type Emits = {
  (e: 'valid', valid: boolean): void
}
const emits = defineEmits<Emits>()

const handleClick = (value: T, index: number) => {
  if (props.disabled || props.options[index]?.disabled) {
    return
  }
  model.value = value
}
const valid = computed(
  () => props.disabled || props.options.some(option => !option.disabled && option.value === model.value),
)
watch(valid, next => emits('valid', next), { immediate: true })
</script>

<template>
  <div class="input-box">
    <div
      v-for="(option, index) in options"
      :key="`${option.value}`"
      class="radio"
      :class="{ checked: model === option.value, disabled: disabled || option.disabled }"
    >
      <div :class="`label ${option.value}`" @click="handleClick(option.value, index)">
        {{ option.text }}
        <SvgIcon v-if="!!option?.icon" class="pt-2px pl-1" :type="option.icon" size="smallMiddle" light-color="info" />
        <HelpTooltip v-if="!!option?.help" class="pl-1 pt-1" size="smallMiddle">{{ option.help }}</HelpTooltip>
      </div>
      <!-- カラムごとにsublabelを表示させたい場合はslotで渡す -->
      <slot name="sublabel" :disabled="!!option?.disabled" :value="option.value" />
      <div class="button" @click="handleClick(option.value, index)" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
$min-width: v-bind(colMinWidth);
$secondary-color: rgb(var(--v-theme-secondary));
$info-color: rgb(var(--v-theme-info));
$light-info-color: rgb(var(--v-theme-light-info));

.input-box {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  row-gap: 0.5rem;
  column-gap: 2rem;
}
.label {
  min-height: 22px;
  display: flex;
  align-items: center;
  padding-left: 1.85rem;
  max-width: 100%;
  overflow-wrap: anywhere;
  white-space: normal;
  line-height: 1.25rem;
  min-width: $min-width;
}

.radio {
  position: relative;
  flex: 0 1 auto;
  width: fit-content;
  max-width: 100%;
  cursor: pointer;
  &.checked:not(.disabled) .button {
    border: 1px solid $secondary-color;
    &::after {
      width: 12px;
      height: 12px;
    }
  }
  &.disabled {
    cursor: auto;
    color: $info-color;
    &.checked .button::after {
      width: 12px;
      height: 12px;
      background-color: $info-color;
    }
    .button {
      border: 1px solid $light-info-color;
      background-color: v.$light-info-alpha-color;
    }
  }

  .pt-2px {
    padding-top: 2px;
  }

  .button {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 1px solid $info-color;
    position: absolute;
    top: 2px;
    left: 0;
    background-color: #fff;
    &::after {
      content: '';
      display: block;
      background-color: $secondary-color;
      border-radius: 50%;
      position: absolute;
      top: 0.25rem;
      left: 0.25rem;
    }
  }
}
</style>
