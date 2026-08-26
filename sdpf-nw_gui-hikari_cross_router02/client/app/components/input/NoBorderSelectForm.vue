<script lang="ts" setup generic="T extends string">
import { useI18n } from 'vue-i18n'
import CaretDownIcon from '~icons/ztgict/caret-down'
import { Size } from '@/components/input/constants'
import type { NoBorderSelectFormPropType } from '@/components/input/types'

const props = withDefaults(defineProps<NoBorderSelectFormPropType<T>>(), {
  placeholder: '',
  required: false,
  size: 'xSmall',
})
const model = defineModel<T | T[] | undefined>('value', { required: true })

const { t } = useI18n()

// クリックイベントを識別するための一意なクラス名
const inputClass = createRandomString({ prefix: 'class-' })

const openList = ref(false)
const inputValue = computed(() => {
  if (Array.isArray(model.value)) {
    const filtered = props.options.filter(option => model.value?.includes(option.value))
    return filtered.map(opt => opt.text).join(', ')
  } else {
    const found = props.options.find(option => option.value === model.value)
    return found?.text ?? ''
  }
})
const handleChangeValue = (value: T | undefined) => {
  openList.value = false
  if (Array.isArray(model.value) && !!value) {
    const updateValue = model.value.includes(value)
      ? model.value.filter(val => val !== value)
      : [...model.value].concat([value])
    model.value = updateValue
  } else {
    model.value = Array.isArray(model.value) ? [] : value
  }
}

useMouseEventListener('click', (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (target.classList.contains(inputClass) || !openList.value) {
    return
  }
  // openList 以外をクリックしたとき用
  openList.value = false
})

const width = computed(() => Size[props.size])
</script>

<template>
  <div class="select-box">
    <input
      type="text"
      :value="inputValue"
      :title="inputValue"
      :placeholder="placeholder"
      :class="inputClass"
      readonly
      @focus="openList = true"
    />
    <div class="arrow-icon valid">
      <CaretDownIcon :width="10" :height="10" />
    </div>
    <ul v-if="openList">
      <li v-if="!required" class="placeholder" @click="handleChangeValue(undefined)">
        {{ t('common.unselected') }}
      </li>
      <li
        v-for="option in options"
        :key="option.value"
        :class="inputValue.includes(option.text) ? 'selected text-overflow' : 'text-overflow'"
        :title="option.text"
        @click.stop="() => handleChangeValue(option.value)"
      >
        {{ option.text }}
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
$info-color: rgb(var(--v-theme-info));
$light-secondary-color: rgb(var(--v-theme-light-secondary));
$light-info-color: rgb(var(--v-theme-light-info));
$width: v-bind(width);
$height: 25px;

.select-box {
  position: relative;
  width: $width;
  padding-right: 2rem;
  :hover {
    cursor: pointer;
  }

  input[type='text'] {
    height: $height;
    width: 100%;
    padding: 0.2rem 1.7rem 0.1rem 0.3rem;
    outline: none;
    border: none;
    border-bottom: 1px solid $info-color;
    background-color: inherit;
    &::placeholder {
      color: $light-info-color;
    }
  }
  .arrow-icon {
    position: absolute;
    top: ($height * 0.1);
    left: calc($width + 0.75rem);
    &.valid svg {
      fill: $info-color;
    }
  }

  ul {
    width: calc($width + 2rem);
    overflow-x: hidden;
    overflow-y: auto;
    max-height: 300px;
    position: absolute;
    top: calc($height + 0.25rem);
    background-color: #fff;
    margin: 0;
    padding-left: 0;
    z-index: 10;
    border: solid 1px $info-color;
    border-radius: 0.25rem;

    li {
      list-style: none;
      line-height: 0.5;
      padding: 0.5rem 0.7rem;
      cursor: pointer;
      &:hover {
        background-color: $light-secondary-color;
      }
      &.selected {
        background-color: $light-secondary-color;
      }
      &.placeholder {
        color: $light-info-color;
      }
    }
  }
  .text-overflow {
    overflow: hidden;
    white-space: nowrap;
    width: 100%;
    text-overflow: ellipsis;
  }
}
</style>
