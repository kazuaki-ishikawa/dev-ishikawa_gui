<script setup lang="ts" generic="T extends string">
import type { IconType } from '@/components/icons/constants'

type PropType = {
  options: Array<{
    text: string
    value: T
    disabled?: boolean
    icon?: IconType
  }>
}
defineProps<PropType>()
const dropdownOpen = defineModel<boolean>('dropdownOpen', { required: true })

type Emits = {
  (e: 'click', value: T): void
}
const emits = defineEmits<Emits>()

useMouseEventListener('click', () => {
  if (!dropdownOpen.value) {
    return
  }
  // dropdownOpen 以外をクリックしたとき用
  dropdownOpen.value = false
})
</script>

<template>
  <div class="position-relative">
    <slot />
    <Transition name="dropdown">
      <div v-if="dropdownOpen" class="dropdown">
        <div v-for="option in options" :key="option.value">
          <button class="button" :disabled="option.disabled" @click="emits('click', option.value)">
            <span>{{ option.text }}</span>
            <SvgIcon v-if="option.icon" :type="option.icon" size="smallMiddle" />
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
$primary-color: rgb(var(--v-theme-primary));
$secondary-color: rgb(var(--v-theme-secondary));
$light-info-color: rgb(var(--v-theme-light-info));

.dropdown {
  position: absolute;
  top: 40px;
  right: 0;
  border-radius: 0.75rem;
  z-index: 100;
  width: max-content;
  box-shadow: 0.1rem 0.1rem 0.5rem 0.1rem $light-info-color;
  overflow: hidden;
  .button {
    padding: 0.5rem 0.75rem;
    width: 100%;
    text-align: left;
    border-style: none;
    color: $secondary-color;
    background-color: #fff;
    &:disabled {
      color: #fff;
      background-color: $light-info-color;
    }
    &:hover:not(:disabled) {
      background: $primary-color;
      color: #fff;
      cursor: pointer;
    }
  }
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s ease-out;
}
.dropdown-enter-from,
.dropdown-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>
