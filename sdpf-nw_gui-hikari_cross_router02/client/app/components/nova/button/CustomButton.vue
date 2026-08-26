<script setup lang="ts">
import type { ColorKeyList } from '@/components/constants'

type PropType = {
  color?: (typeof ColorKeyList)[number]
  size?: 'small' | 'large'
  prependIcon?: string
  appendIcon?: string
  outlined?: boolean
  disabled?: boolean
}
const props = withDefaults(defineProps<PropType>(), {
  color: 'interactive',
})
type Emits = {
  (e: 'click'): void
}
const emits = defineEmits<Emits>()

const outlineColor = computed(() => {
  if (props.outlined && props.color === 'error') {
    return 'border-error-lighten-3'
  }
  return undefined
})
</script>

<template>
  <v-btn
    :color="color"
    :size="size"
    :prepend-icon="prependIcon"
    :append-icon="appendIcon"
    :variant="outlined ? 'outlined' : undefined"
    :border="!outlined && disabled ? 0 : 'md'"
    :disabled="disabled"
    rounded="md"
    class="font-weight-bold custom-button"
    :class="[{ 'bg-white': outlined, 'border-opacity-100': !!outlineColor }, outlineColor]"
    @click.stop="emits('click')"
  >
    <slot />
  </v-btn>
</template>

<style lang="scss" scoped>
.custom-button {
  pointer-events: auto !important;
  &.v-btn--disabled {
    cursor: not-allowed !important;
  }
}
</style>
