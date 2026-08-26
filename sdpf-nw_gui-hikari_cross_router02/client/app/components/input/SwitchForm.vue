<script setup lang="ts">
type PropType = {
  disabled?: boolean
}
const props = defineProps<PropType>()
const model = defineModel<boolean>({ required: true })

const bg = computed(() => {
  return model.value && !props.disabled
    ? 'linear-gradient(90deg, rgb(var(--v-theme-secondary)), rgb(var(--v-theme-primary)))'
    : 'rgb(var(--v-theme-light-info))'
})
</script>

<template>
  <v-switch v-model="model" class="switch-form" :disabled="disabled" inset="material" hide-details />
</template>

<style lang="scss" scoped>
$bg-color: v-bind(bg);

.switch-form {
  :deep(.v-selection-control) {
    .v-switch__track {
      border: none;
      background: $bg-color !important;
    }
  }
}
</style>
