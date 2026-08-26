<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { Size } from '@/components/input/constants'
import type { InputFormPropType } from '@/components/input/types'

type PropType = InputFormPropType & {
  rows?: number
}
const props = withDefaults(defineProps<PropType>(), {
  rules: () => [],
  size: 'middle',
  required: false,
  disabled: false,
  placeholder: '',
  rows: 5,
  maxlength: 100,
})

type Emits = {
  (e: 'valid', valid: boolean): void
}
const emits = defineEmits<Emits>()
const model = defineModel<string>({ required: true })
const { t } = useI18n()
const textareaWrapRef = ref<HTMLElement | null>(null)

const width = computed(() => Size[props.size])
const counterValue = computed(() => model.value.length)
const minHeight = computed(() => `${props.rows * 1.6 + 3.75}rem`)
const errorMessage = computed(() => {
  if (props.disabled) {
    return ''
  }
  const empty = model.value.replaceAll(/\r\n|\n|\r/g, '').length === 0
  const required = props.required && empty ? t('invalid.required') : ''
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

watch(model, async () => {
  await nextTick()
  const textarea = textareaWrapRef.value?.querySelector('textarea')
  if (!textarea) {
    return
  }

  const isFocused = document.activeElement === textarea
  const isCursorAtEnd =
    textarea.selectionStart === textarea.value.length && textarea.selectionEnd === textarea.value.length
  if (isFocused && isCursorAtEnd) {
    textarea.scrollTop = textarea.scrollHeight
  }
})
</script>

<template>
  <div class="flex-flex-start-flex-start">
    <div :style="{ width }">
      <div class="position-relative flex-flex-start-center" />
      <div
        ref="textareaWrapRef"
        class="textarea-box"
        :class="{ 'textarea-box--error': !!errorMessage, 'textarea-box--disabled': disabled }"
        :style="{ minHeight }"
      >
        <v-textarea
          v-model="model"
          class="textarea-vuetify"
          variant="outlined"
          no-resize
          hide-details
          :placeholder="disabled ? '' : placeholder"
          :disabled="disabled"
        />
        <div class="textarea-counter">{{ counterValue }}/{{ maxlength }}</div>
      </div>
      <div class="w-max text-warning text-sm pl-2 text-pre-wrap">{{ errorMessage }}</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$primary-color: rgb(var(--v-theme-primary));
$info-color: rgb(var(--v-theme-info));
$warning-color: rgb(var(--v-theme-warning));
$light-info-color: rgb(var(--v-theme-light-info));
$light-warning-color: rgb(var(--v-theme-light-warning));

.w-max {
  width: max-content;
}

// 外側のボックスが枠線・背景・リサイズハンドルを持ち、
// 内部の textarea とカウンター表示領域を縦に分離する
.textarea-box {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 10rem;
  background-color: #fff;
  border: 1px solid $info-color;
  border-radius: 0.3rem;
  overflow: hidden;
  // ドラッグで縦横を変えられるつまみ（右下）
  resize: both;

  &:focus-within:not(.textarea-box--error):not(.textarea-box--disabled) {
    border-color: $primary-color;
  }

  &--error {
    border-color: $warning-color;
    background-color: $light-warning-color;
  }

  &--disabled {
    border-color: $light-info-color;
    background-color: #fff;
    resize: none;
    cursor: not-allowed;
  }
}

.textarea-vuetify {
  flex: 1 1 auto;
  min-height: 0;

  // disabled時にnot-allowed
  // vuetifyのdefaultを上書き
  &.v-input--disabled {
    cursor: not-allowed !important;
    pointer-events: auto !important;
  }

  // v-textareaの枠線・背景はボックス側で表現するため無効化し、高さをボックスに追従させる
  :deep(.v-input__control),
  :deep(.v-field),
  :deep(.v-field__field) {
    height: 100%;
  }

  :deep(.v-field) {
    background-color: transparent;
  }

  :deep(.v-field__outline) {
    display: none;
  }

  :deep(textarea) {
    height: calc(100% - 1.75rem) !important;
    font-size: v.$input-font-size;
    overflow-y: auto;
  }
}

.textarea-counter {
  flex-shrink: 0;
  padding: 0.4rem 1.2rem 0.5rem;
  text-align: right;
  font-size: v.$input-font-size;
  color: $info-color;
}
</style>
