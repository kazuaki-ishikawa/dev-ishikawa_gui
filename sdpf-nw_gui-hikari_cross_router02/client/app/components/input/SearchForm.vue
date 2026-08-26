<script lang="ts" setup>
import { Size } from './constants'
import type { SizeType } from './types'
import { IconTypes } from '@/components/icons/constants'

type PropType = {
  size?: SizeType
  placeholder?: string
  disabled?: boolean
}
const props = withDefaults(defineProps<PropType>(), {
  size: 'middle',
  placeholder: '',
  disabled: false,
})
const model = defineModel<string>('value', { required: true })

type Emits = {
  (e: 'search'): void
}
const emits = defineEmits<Emits>()

const handleInputValue = (e: Event) => {
  const target = e.target as HTMLInputElement
  model.value = target.value
}
const width = computed(() => Size[props.size])
const handleSearch = () => {
  if (props.disabled) {
    return
  }
  emits('search')
}
</script>

<template>
  <div class="input-box">
    <input type="text" :value="model" :placeholder="placeholder" @input="handleInputValue" />
    <div v-if="!!model" class="clear-button" @click="model = ''">
      <SvgIcon :type="IconTypes.CircleClose" color="info" />
    </div>
    <div class="search-button" :class="{ disabled }" @click="handleSearch">
      <SvgIcon :type="IconTypes.Search" size="small" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
$input-width: calc(v-bind(width) * 0.6);
$search-button-width: calc($input-width * 0.4);
$clear-button-size: 20px;
$input-height: v.$input-height * 0.85;
$border-radius: $input-height * 0.85;
$info-color: rgb(var(--v-theme-info));
$light-info-color: rgb(var(--v-theme-light-info));

.input-box {
  position: relative;
  width: $input-width;
}
input[type='text'] {
  height: $input-height;
  width: 100%;
  padding: 0.1rem $clear-button-size * 1.5 0.1rem 0.7rem;
  border: 1px solid $info-color;
  border-top-left-radius: $border-radius;
  border-bottom-left-radius: $border-radius;
  background-color: #fff;
  &:focus {
    outline: none;
  }
  &::placeholder {
    color: $light-info-color;
  }
}
.button {
  position: absolute;
  height: $input-height;
  padding: 0.1rem;
  border: 1px solid $info-color;
  cursor: pointer;
  &:hover {
    opacity: 0.8;
  }
}
.clear-button {
  @extend .button;
  top: $clear-button-size * 0.25;
  left: calc($input-width + $clear-button-size * 0.65);
  height: $clear-button-size;
  width: $clear-button-size;
  border-radius: 50%;
  border: none;
}

.search-button {
  @extend .button;
  top: 0;
  left: calc($input-width + $clear-button-size * 1.5 + 0.7rem);
  width: $search-button-width;
  display: flex;
  justify-content: center;
  align-items: center;
  border-top-right-radius: $border-radius;
  border-bottom-right-radius: $border-radius;
  background-color: $info-color;
  &.disabled {
    background-color: $light-info-color;
    cursor: auto;
    &:hover {
      opacity: 1;
    }
  }
}
</style>
