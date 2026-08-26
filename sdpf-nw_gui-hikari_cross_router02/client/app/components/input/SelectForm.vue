<script lang="ts" setup generic="T extends string | string[]">
import type { CSSProperties } from 'vue'
import { useI18n } from 'vue-i18n'
import CaretDownIcon from '~icons/ztgict/caret-down'
import { Size, UNSELECTED_VALUE } from '@/components/input/constants'
import type { SelectFormPropType } from '@/components/input/types'

const inputRef = ref<HTMLInputElement>()

const props = withDefaults(defineProps<SelectFormPropType>(), {
  rules: () => [],
  size: 'small',
  required: false,
  disabled: false,
  placeholder: '',
  maxItems: Number.MAX_SAFE_INTEGER,
})

type Emits = {
  (e: 'valid', valid: boolean): void
}
const emits = defineEmits<Emits>()
const model = defineModel<T>({ required: true })
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
const filterWord = ref('')

const selectListOptions = computed(() => {
  if (!filterWord.value) {
    return props.options
  }
  return props.options.filter(option => option.text.toLocaleLowerCase().includes(filterWord.value.toLocaleLowerCase()))
})
const handleFocusIn = () => {
  openList.value = true
  selectInputRect.value = selectRef.value?.getClientRects()[0]
  containerRact.value = containerRef.value?.getClientRects()[0]
}
const handleInputFilterWord = (e: Event) => {
  const target = e.target as HTMLInputElement
  filterWord.value = target.value
}
const handleArrowIconClick = () => {
  if (selectDisabled.value) {
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

const errorMessage = computed(() => {
  if (props.disabled) {
    return ''
  }
  const required = props.required && model.value.length === 0 ? t('invalid.required') : ''
  const message = props.rules.reduce((msg, rule) => {
    if (!msg && typeof model.value === 'string') {
      const newMessage = rule(model.value)
      return newMessage !== true ? newMessage : ''
    }
    if (!msg && typeof model.value !== 'string') {
      const newMessage = model.value.find((v: string) => rule(v) !== true)
      return newMessage || ''
    }
    return msg
  }, '')
  return required || message
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

const handleChangeValue = (value: string) => {
  if (typeof model.value === 'string') {
    model.value = value as T
    openList.value = false
  } else if (!value) {
    // string[] であることを認識させるために filter(Boolean) を使用
    model.value = [''].filter(Boolean) as T
    // 未選択を選択した場合はリストを閉じる
    openList.value = false
  } else {
    const newValue = model.value.includes(value)
      ? model.value.filter(v => v !== value)
      : props.options.filter(opt => model.value.includes(opt.value) || opt.value === value).map(opt => opt.value)

    // MultipleSelectForm から 利用無し を選択するとリセット
    model.value =
      value === UNSELECTED_VALUE ? ([UNSELECTED_VALUE] as T) : (newValue.filter(v => v !== UNSELECTED_VALUE) as T)
    // 未選択対象の項目を選択した場合はリストを閉じる
    openList.value = value !== UNSELECTED_VALUE && newValue.length < props.maxItems
  }
}

const width = computed(() => Size[props.size])
const inputValue = computed(() => {
  if (typeof model.value === 'string') {
    return props.options.find(opt => opt.value === model.value)?.text ?? model.value
  } else {
    return model.value
      .map(value => {
        const found = props.options.find(opt => opt.value === value)
        return found?.text ?? value
      })
      .join(', ')
  }
})

const selectDisabled = computed(() => {
  if (props.maxItems <= model.value.length) {
    return props.disabled || model.value.length >= props.maxItems
  } else {
    return props.disabled
  }
})
const selectFieldClass = computed(() => `${errorMessage.value ? 'invalid' : 'valid'} ${inputClass}`)

watch(openList, () => {
  if (openList.value) {
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
  } else {
    // セレクトリストが閉じたときにフィルタ文言を初期化
    filterWord.value = ''
    // ract と style を初期化
    selectInputRect.value = undefined
    containerRact.value = undefined
    containerStyle.value = { visibility: 'hidden', top: '0px', left: '0px' }
  }
})
</script>

<template>
  <div ref="selectRef" class="select-box">
    <input
      ref="inputRef"
      type="text"
      :value="openList ? filterWord : inputValue"
      :title="disabled ? '' : inputValue"
      :placeholder="disabled ? '' : placeholder"
      :class="selectFieldClass"
      :disabled="selectDisabled"
      @focusin="handleFocusIn"
      @input="handleInputFilterWord"
    />
    <div class="arrow-icon" :class="selectFieldClass" @click="handleArrowIconClick">
      <CaretDownIcon :width="10" :height="10" />
    </div>
    <div class="w-max text-warning text-sm pl-2">{{ errorMessage }}</div>

    <ul ref="containerRef" class="my-0" :style="{ ...containerStyle, width }">
      <li v-if="!required && !filterWord" class="placeholder" @click.stop="handleChangeValue('')">
        {{ t('common.unselected') }}
      </li>
      <li
        v-for="option in selectListOptions"
        :key="option.value"
        :class="{
          selected: typeof model === 'string' ? model === option.value : model.includes(option.value),
        }"
        class="flex-flex-start-center"
        @click.stop="handleChangeValue(option.value)"
      >
        <div class="text-truncate mr-auto" :class="{ 'w-70': !!option.button }" :title="option.text">
          {{ option.text }}
        </div>
        <button v-if="!!option.button" @click.stop="option.button.click">
          {{ option.button.label ?? t('common.confirm') }}
        </button>
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

.select-box {
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
.w-70 {
  width: 70%;
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
    &.placeholder {
      user-select: none;
      color: $info-color;
    }
    &.selected:not(:hover) {
      background-color: $light-secondary-color;
    }
    button {
      border: solid 1px transparent;
      border-radius: 0.8rem;
      width: 80px;
      font-size: 0.75rem;
      cursor: pointer;
      background-color: $info-color;
      color: #fff;
      &:hover {
        background-color: #fff;
        color: $info-color;
        border: solid 1px $info-color;
      }
    }
  }
}
</style>
