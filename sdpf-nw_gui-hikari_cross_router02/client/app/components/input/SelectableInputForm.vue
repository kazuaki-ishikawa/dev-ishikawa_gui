<script lang="ts" setup>
import type { CSSProperties } from 'vue'
import { useI18n } from 'vue-i18n'
import CaretDownIcon from '~icons/ztgict/caret-down'
import { Size } from '@/components/input/constants'
import type { InputFormPropType, OptionType } from '@/components/input/types'

const inputRef = ref<HTMLInputElement>()

type PropType = InputFormPropType & {
  options?: OptionType<string>[]
}
const props = withDefaults(defineProps<PropType>(), {
  rules: () => [],
  options: () => [],
  size: 'middle',
  required: false,
  disabled: false,
  placeholder: '',
  maxlength: undefined,
  minlength: undefined,
})

type Emits = {
  (e: 'valid', valid: boolean): void
}
const emits = defineEmits<Emits>()
const model = defineModel<string>({ required: true })

// クリックイベントを識別するための一意なクラス名
const inputClass = createRandomString({ prefix: 'class-' })

const selectRef = ref<HTMLDivElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const selectInputRect = ref<DOMRect>()
const containerRact = ref<DOMRect>()
const containerStyle = ref<CSSProperties>({ visibility: 'hidden', top: '0px', left: '0px' })
const containerHeight = computed(() => containerRact.value?.height ?? 0)

const { t } = useI18n()

const openList = ref(false)
const width = computed(() => Size[props.size])
const selectFieldClass = computed(() => `${errorMessage.value ? 'invalid' : 'valid'} ${inputClass}`)

// 入力値でオプションをフィルタリング
const selectListOptions = computed(() => {
  if (!model.value) {
    return props.options
  }
  return props.options.filter(option => option.text.toLowerCase().includes(model.value.toLowerCase()))
})

const handleFocus = async () => {
  openList.value = true
  selectInputRect.value = selectRef.value?.getClientRects()[0]
  containerRact.value = containerRef.value?.getClientRects()[0]
  updateContainerStyle()
}

const handleArrowIconClick = () => {
  if (props.disabled) {
    return
  }
  if (!openList.value) {
    openList.value = true
    inputRef.value?.focus()
    selectInputRect.value = selectRef.value?.getClientRects()[0]
    containerRact.value = containerRef.value?.getClientRects()[0]
  } else {
    openList.value = false
  }
}

const handleSelectOption = (value: string) => {
  model.value = value
  openList.value = false
  inputRef.value?.blur()
}

const errorMessage = computed(() => {
  if (props.disabled) {
    return ''
  }
  const required = props.required && !model.value ? t('invalid.required') : ''
  const minlength =
    props.minlength && model.value.length < Number(props.minlength)
      ? t('invalid.minlength', { minlength: props.minlength })
      : ''
  const message = props.rules.reduce((msg, rule) => {
    if (!msg) {
      const newMessage = rule(model.value)
      return newMessage !== true ? newMessage : ''
    }
    return msg
  }, '')
  return required || message || minlength
})
watch(errorMessage, next => emits('valid', !next), { immediate: true })

useMouseEventListener('click', (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (target.closest(`.${inputClass}`) || !openList.value) {
    return
  }
  // openList 以外をクリックしたとき用
  openList.value = false
})

const updateContainerStyle = () => {
  if (!openList.value) {
    return
  }
  const offsetParent = selectRef.value?.offsetParent
  const offsetParentRact = offsetParent?.getClientRects()[0]
  const selectInputRectTop = selectInputRect.value?.top ?? 0
  const selectInputRectBottom = selectInputRect.value?.bottom ?? 0
  const selectInputRectLeft = selectInputRect.value?.left ?? 0
  const selectInputRectHeight = selectInputRect.value?.height ?? 0
  const visibility = selectInputRect.value ? 'visible' : 'hidden'
  const er = errorMessage.value ? 20 : 0

  if (offsetParent?.className === 'dialog-card') {
    // ダイアログ(基準が absolute になる)の場合
    containerStyle.value = {
      visibility,
      top: `${selectInputRectTop - (offsetParentRact?.top ?? 0) + selectInputRectHeight - er}px`,
      left: `${selectInputRectLeft - (offsetParentRact?.left ?? 0)}px`,
    }
    return
  }

  const inversionTop = window.innerHeight - selectInputRectBottom < containerHeight.value
  containerStyle.value = {
    visibility,
    // bottom までの距離が container の高さより小さい場合、上側に表示する
    top: `${inversionTop ? selectInputRectTop - containerHeight.value : selectInputRectBottom - er}px`,
    // left までの距離が container の幅より小さい場合、左側に表示する
    left: `${selectInputRectLeft}px`,
  }
}

watch(openList, () => {
  if (openList.value) {
    updateContainerStyle()
  } else {
    // セレクトリストが閉じたときにrectとstyleを初期化
    selectInputRect.value = undefined
    containerRact.value = undefined
    containerStyle.value = { visibility: 'hidden', top: '0px', left: '0px' }
  }
})
</script>

<template>
  <div ref="selectRef" class="selectable-input-box">
    <input
      ref="inputRef"
      v-model="model"
      type="text"
      :title="disabled ? '' : model"
      :placeholder="disabled ? '' : placeholder"
      :class="selectFieldClass"
      :disabled="disabled"
      :maxlength="maxlength"
      @focus="handleFocus"
    />
    <div class="arrow-icon" :class="selectFieldClass" @click="handleArrowIconClick">
      <CaretDownIcon :width="10" :height="10" />
    </div>
    <div class="w-max text-warning text-sm pl-2">{{ errorMessage }}</div>

    <ul
      v-show="openList && props.options.length > 0"
      ref="containerRef"
      class="my-0"
      :style="{ ...containerStyle, width }"
    >
      <li
        v-for="option in selectListOptions"
        :key="option.value"
        :class="{ selected: model === option.value }"
        class="flex-flex-start-center"
        @click.stop="handleSelectOption(option.value)"
      >
        <div class="text-truncate mr-auto" :title="option.text">{{ option.text }}</div>
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
$width: calc(v-bind(width) - 2.8125rem);
$primary-color: rgb(var(--v-theme-primary));
$info-color: rgb(var(--v-theme-info));
$warning-color: rgb(var(--v-theme-warning));
$light-primary-color: rgb(var(--v-theme-light-primary));
$light-secondary-color: rgb(var(--v-theme-light-secondary));
$light-info-color: rgb(var(--v-theme-light-info));
$light-warning-color: rgb(var(--v-theme-light-warning));

.selectable-input-box {
  position: relative;
  width: $width;
  padding-right: 2.75rem;
  &:focus-within {
    .arrow-icon.valid svg {
      fill: $primary-color;
    }
  }
}

input[type='text'] {
  height: v.$input-height;
  width: 100%;
  padding: 0.1rem 2rem 0.1rem 0.7rem;
  font-size: v.$input-font-size;
  outline: none;
  border: 1px solid $info-color;
  border-radius: 0.3rem;
  &:focus {
    border: 1px solid $primary-color;
  }
  &:disabled {
    border: 1px solid $light-info-color;
    &::placeholder {
      user-select: none;
      color: $light-info-color;
    }
  }
  &.invalid {
    border: 1px solid $warning-color;
    background-color: $light-warning-color;
  }
  &::placeholder {
    user-select: none;
    color: $light-info-color;
  }
}

.arrow-icon {
  position: absolute;
  top: calc(v.$input-height / 5);
  right: 0.75rem;
  cursor: pointer;
  &.invalid svg {
    fill: $warning-color;
  }
  &.valid svg {
    fill: $info-color;
  }
}
.w-max {
  width: max-content;
}

ul {
  position: fixed;
  z-index: v.$tooltip-z-index;
  max-height: 170px;
  overflow: hidden scroll;
  padding: 0;
  background-color: #fff;
  border: solid 1px $info-color;
  border-radius: 0.3rem;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: v.$input-font-size;
  li {
    list-style: none;
    line-height: 1.5;
    padding: 0.5rem 0.7rem;
    cursor: pointer;
    &:hover {
      background-color: $light-primary-color;
    }
    &.selected:not(:hover) {
      background-color: $light-secondary-color;
    }
  }
}
</style>
