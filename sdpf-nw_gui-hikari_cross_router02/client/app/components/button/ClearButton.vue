<script lang="ts" setup>
const DEFAULT_HEIGHT = 34

type PropType = {
  text: string
  width?: number
  disabled?: boolean
}
const props = withDefaults(defineProps<PropType>(), {
  width: 300,
  disabled: false,
})
const buttonWidth = computed(() => `${props.width}px`)
</script>

<template>
  <v-btn
    :disabled="props.disabled"
    variant="text"
    :height="DEFAULT_HEIGHT"
    rounded="pill"
    size="default"
    :ripple="false"
    class="clear-button"
  >
    <span>{{ props.text }}</span>
  </v-btn>
</template>

<style lang="scss" scoped>
$transition-time: 0.5s;
$secondary-color: rgb(var(--v-theme-secondary));
$light-info-color: rgb(var(--v-theme-light-info));
$hover-text-color: rgb(var(--v-theme-highlight));

.clear-button {
  width: v-bind(buttonWidth);
  min-width: 0;
  padding: 0;
  border: 1px solid $secondary-color;
  color: $secondary-color;
  font-size: v.$input-font-size;
  transition: all $transition-time;
  :deep(.v-btn__overlay),
  :deep(.v-btn__underlay) {
    display: none;
  }
  &:hover:not(:disabled) {
    cursor: pointer;
    background-color: $secondary-color;
    color: $hover-text-color;
  }
  &:disabled {
    opacity: 1;
    border: 1px solid $light-info-color;
    color: $light-info-color;
  }
}
</style>
