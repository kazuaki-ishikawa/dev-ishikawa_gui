<script lang="ts" setup>
type PropType = {
  value: string
  label: string
  list?: string[]
  disabled?: boolean
}
withDefaults(defineProps<PropType>(), {
  list: () => [],
})

type Emits = {
  (e: 'click', value: string): void
}
const emits = defineEmits<Emits>()
</script>

<template>
  <div class="py-5">
    <div class="pb-3">{{ label }}</div>
    <button
      v-for="selector in list"
      :key="selector"
      :disabled="disabled"
      :class="{ active: selector === value }"
      @click="() => emits('click', selector)"
    >
      {{ selector }}
    </button>
  </div>
</template>

<style lang="scss" scoped>
$primary-color: rgb(var(--v-theme-secondary));
$light-info-color: rgb(var(--v-theme-light-info));
$light-color: #fff;

button {
  margin: 0.25rem 0.5rem;
  padding: 0.5rem 1rem;
  font-size: v.$input-font-size;
  line-height: normal;
  background-color: $light-color;
  color: $primary-color;
  border-radius: 5px;
  border: 1px solid $primary-color;
  user-select: none;
  &.active {
    background-color: $primary-color;
    color: $light-color;
  }
  &:hover:not(:disabled) {
    cursor: pointer;
    background-color: $primary-color;
    color: $light-color;
  }
  &:disabled {
    border: 1px solid $light-info-color;
    color: $light-color;
    background-color: $light-info-color;
  }
}
</style>
