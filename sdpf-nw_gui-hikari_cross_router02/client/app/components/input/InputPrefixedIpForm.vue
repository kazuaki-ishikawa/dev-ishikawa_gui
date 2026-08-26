<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { Size } from '@/components/input/constants'
import type { InputPrefixedIpFormPropType } from '@/components/input/types'
import { IconTypes } from '@/components/icons/constants'

const props = withDefaults(defineProps<InputPrefixedIpFormPropType>(), {
  rules: () => [],
  size: 'middle',
  required: false,
  disabled: false,
  placeholder: '',
  maxlength: undefined,
  minlength: undefined,
})
const model = defineModel<string>({ required: true })

type Emits = {
  (e: 'valid', valid: boolean): void
}
const emits = defineEmits<Emits>()
const { t } = useI18n()

// 入力値はサブネットマスクを除いたIPアドレス部分のみとする
const internalValue = ref('')
const inputRef = ref<HTMLInputElement>()
const width = computed(() => Size[props.size])

// プレフィックス部分のラベルの位置を入力値に応じて動的に変更するため、テキストの幅を測定する関数
let canvas: HTMLCanvasElement | undefined
const measureTextWidth = (text: string) => {
  if (!import.meta.client || !inputRef.value) {
    return `${text.length}ch`
  }
  canvas = canvas || document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) {
    return `${text.length}ch`
  }
  context.font = getComputedStyle(inputRef.value).font
  return `${context.measureText(text).width}px`
}

const prefixLabelStyle = computed(() => {
  const text = internalValue.value || (props.disabled ? '' : props.placeholder)
  return { right: `calc(100% - 2.1rem - ${measureTextWidth(text)})` }
})

// model -> internalValue 同期（外部からの値セット時）
let isSyncing = false
watch(
  model,
  next => {
    if (isSyncing) {
      return
    }
    // 初期値などでサブネットマスクが付与された値が入ることを想定し、サブネットマスクを除いた部分を internalValue にセットする
    internalValue.value = next.replace(/\/\d+$/, '')
  },
  { immediate: true },
)

// internalValue -> model 同期
watch(
  internalValue,
  next => {
    isSyncing = true
    // model にはサブネットマスクを付与した値をセットする
    model.value = next ? `${next}/${props.prefix}` : ''
    // ループ防止のため、nextTick で isSyncing を false に戻す
    nextTick(() => {
      isSyncing = false
    })
  },
  { immediate: true },
)

const errorMessage = computed(() => {
  if (props.disabled) {
    return ''
  }
  const required = props.required && !internalValue.value ? t('invalid.required') : ''
  const minlength =
    props.minlength && internalValue.value.length < Number(props.minlength)
      ? t('invalid.minlength', { minlength: props.minlength })
      : ''
  const message = props.rules.reduce((msg, rule) => {
    if (!msg) {
      const newMessage = rule(internalValue.value)
      return newMessage !== true ? newMessage : ''
    }
    return msg
  }, '')
  return required || message || minlength
})
watch(errorMessage, next => emits('valid', !next), { immediate: true })
</script>

<template>
  <div class="flex-flex-start-flex-start">
    <div :style="{ width }">
      <div class="position-relative flex-flex-start-center">
        <input
          ref="inputRef"
          v-model="internalValue"
          type="text"
          :placeholder="disabled ? '' : placeholder"
          :class="errorMessage ? 'invalid' : 'valid'"
          :disabled="disabled"
          :maxlength="maxlength"
        />
        <span v-if="!!internalValue || !disabled" class="prefix-label" :style="prefixLabelStyle">/{{ prefix }}</span>
        <div v-if="!!internalValue && !disabled" class="button" @click="internalValue = ''">
          <SvgIcon :type="IconTypes.CircleClose" :color="errorMessage ? 'warning' : 'info'" />
        </div>
      </div>
      <div class="error-message text-warning text-sm pl-2">{{ errorMessage }}</div>
    </div>
    <div v-if="!!maxlength" class="char-counter ml-3 mt-2">
      {{ `${internalValue.length}/${maxlength}` }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
$primary-color: rgb(var(--v-theme-primary));
$info-color: rgb(var(--v-theme-info));
$warning-color: rgb(var(--v-theme-warning));
$light-info-color: rgb(var(--v-theme-light-info));
$light-warning-color: rgb(var(--v-theme-light-warning));

input[type='text'] {
  height: v.$input-height;
  width: 100%;
  padding: 0.1rem 2.375rem 0.1rem 0.7rem;
  font-size: v.$input-font-size;
  outline: none;
  font-family: inherit;
  border: 1px solid $info-color;
  border-radius: 0.3rem;
  &:focus {
    border: 1px solid $primary-color;
  }
  &:disabled {
    border: 1px solid $light-info-color;
    &::placeholder {
      color: $light-info-color;
    }
  }
  &.invalid {
    border: 1px solid $warning-color;
    background-color: $light-warning-color;
  }
  &::placeholder {
    color: $light-info-color;
  }
}

.prefix-label {
  position: absolute;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  color: $info-color;
  font-size: v.$input-font-size;
  pointer-events: none;
  user-select: none;
}

.error-message {
  width: max-content;
}

.char-counter {
  width: 4rem;
}

.button {
  position: absolute;
  top: 0.625rem;
  right: 0.625rem;
  height: 18px;
  width: 18px;
  border: none;
  border-radius: 50%;
  background-color: #fff;
  cursor: pointer;
  svg {
    position: absolute;
    top: 0;
    left: 0;
  }
  &:hover {
    opacity: 0.8;
  }
}
</style>
