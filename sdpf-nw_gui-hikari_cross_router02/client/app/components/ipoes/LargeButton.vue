<script lang="ts" setup>
import type { ColorKeyList } from '@/components/constants'

type PropType = {
  color?: (typeof ColorKeyList)[number]
}
const props = withDefaults(defineProps<PropType>(), {
  color: 'primary',
})

type Emits = {
  (e: 'click'): void
}
const emit = defineEmits<Emits>()

const backgroundColor = computed(() => `rgb(var(--v-theme-${props.color}))`)
</script>

<template>
  <button class="button elevation-4 flex-center-center" @click="emit('click')">
    <div class="position-relative text-pre-wrap"><slot /></div>
  </button>
</template>

<style lang="scss" scoped>
$primary-color: v-bind('backgroundColor');
$text-color: #fff;
$transition-time: 0.5s;
.button {
  color: $text-color;
  user-select: none;
  border: solid 1px transparent;
  background-color: $primary-color;
  width: 25rem;
  position: relative;
  min-height: 7rem;
  border-radius: 4px;
  transition: all $transition-time;
  &:hover {
    cursor: pointer;
    color: $primary-color;
    border: solid 1px $primary-color;
    background-color: $text-color;
  }
}
</style>
