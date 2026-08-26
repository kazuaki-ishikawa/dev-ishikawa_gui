<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { Size } from '@/components/input/constants'
import type { InputFormPropType } from '@/components/input/types'
import { IconTypes } from '@/components/icons/constants'

type PropType = InputFormPropType & {
  buttonLabel: string
  inputDisabled?: boolean
  buttonDisabled?: boolean
}
const model = defineModel<string>({ required: true })
const props = withDefaults(defineProps<PropType>(), {
  rules: () => [],
  required: false,
  disabled: false,
  inputDisabled: false,
  buttonDisabled: false,
  placeholder: '',
  size: 'large',
  maxlength: undefined,
})

type Emits = {
  (e: 'valid', valid: boolean): void
  (e: 'submit'): void
}
const emits = defineEmits<Emits>()
const { t } = useI18n()

const showIcon = computed(() => !!model.value && !props.inputDisabled && !props.disabled)
const submitDisabled = computed(() => props.buttonDisabled || props.disabled || !!errorMessage.value)
const textDisabled = computed(() => props.inputDisabled || props.disabled)
const width = computed(() => Size[props.size])
const clearButtonSize = '20px'

const errorMessage = computed(() => {
  if (props.disabled) {
    return ''
  }
  const required = props.required && !model.value ? t('invalid.required') : ''
  const message = props.rules.reduce((msg, rule) => {
    if (!msg) {
      const newMessage = rule(model.value)
      return newMessage !== true ? newMessage : ''
    }
    return msg
  }, '')
  return required || message
})
watch(errorMessage, next => emits('valid', !next), { immediate: true })
</script>

<template>
  <div class="input-box">
    <input
      v-model="model"
      type="text"
      :placeholder="textDisabled ? '' : placeholder"
      class="select-none"
      :class="errorMessage ? 'invalid' : 'valid'"
      :disabled="textDisabled"
      :maxlength="maxlength"
    />
    <v-btn v-if="showIcon" icon variant="text" :size="clearButtonSize" class="clear-button" @click="() => (model = '')">
      <SvgIcon :type="IconTypes.CircleClose" :color="errorMessage ? 'warning' : 'info'" />
    </v-btn>
    <v-btn variant="flat" class="submit-button pa-0" :disabled="submitDisabled" @click="() => emits('submit')">
      {{ buttonLabel }}
    </v-btn>
    <v-sheet color="transparent" width="max-content" class="text-sm text-warning pl-2 mr-n13">
      {{ errorMessage }}
    </v-sheet>
  </div>
</template>

<style lang="scss" scoped>
$width: v-bind(width);
$submit-button-width: calc($width * 0.4);
$submit-button-height: calc(v.$input-height + 0.2rem + 2px);
$input-width: calc(100% - $submit-button-width);
$clear-button-size: v-bind(clearButtonSize);
$input-left-padding: calc($clear-button-size * 1.75);
$primary-color: rgb(var(--v-theme-primary));
$secondary-color: rgb(var(--v-theme-secondary));
$info-color: rgb(var(--v-theme-info));
$warning-color: rgb(var(--v-theme-warning));
$light-info-color: rgb(var(--v-theme-light-info));
$light-warning-color: rgb(var(--v-theme-light-warning));

.input-box {
  position: relative;
  width: $width;
}
.select-none {
  user-select: none;
}
input[type='text'] {
  height: v.$input-height;
  width: $input-width;
  padding: 0.1rem $input-left-padding 0.1rem 0.7rem;
  font-size: v.$input-font-size;
  border: 1px solid $info-color;
  border-top-left-radius: 5px;
  border-bottom-left-radius: 5px;
  &:focus {
    outline: none;
    border: 1px solid $primary-color;
  }
  &:disabled {
    outline: none;
    border: 1px solid $light-info-color;
    &::placeholder {
      color: $light-info-color;
    }
  }
  &.invalid {
    outline: none;
    border: 1px solid $warning-color;
    background-color: $light-warning-color;
  }
  &::placeholder {
    color: $light-info-color;
  }
}

.clear-button {
  position: absolute;
  top: calc($clear-button-size * 0.5);
  left: calc($input-width + $clear-button-size);
  &:hover {
    opacity: 0.8;
  }
}
.submit-button {
  position: absolute;
  top: 0;
  left: calc($input-width + $input-left-padding + 0.8rem);
  height: $submit-button-height;
  width: $submit-button-width;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-top-right-radius: 0.3rem;
  border-bottom-right-radius: 0.3rem;
  color: #fff;
  font-size: 0.825rem;
  background-image: linear-gradient(90deg, $secondary-color, $primary-color);
  &:hover:not(:disabled) {
    opacity: 0.8;
    cursor: pointer;
  }
  &:disabled {
    opacity: 0.5;
  }
}
</style>
