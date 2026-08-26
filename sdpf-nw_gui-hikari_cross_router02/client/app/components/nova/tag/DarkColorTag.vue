<script setup lang="ts">
type PropType = {
  label: string
  color: 'info' | 'primary' | 'success' | 'warning' | 'error'
}
const props = defineProps<PropType>()
</script>

<template>
  <v-chip label size="small" :class="['dark-color-tag', `dark-color-tag--${props.color}`]">
    {{ props.label }}
  </v-chip>
</template>

<style scoped lang="scss">
.dark-color-tag {
  color: rgb(var(--v-theme-surface));
}

.dark-color-tag--info {
  background-color: rgb(var(--v-theme-info-darken-1));
}

.dark-color-tag--primary {
  background-color: rgb(var(--v-theme-primary-darken-1));
}

.dark-color-tag--success {
  background-color: rgb(var(--v-theme-success-darken-1));
}

.dark-color-tag--warning {
  background-color: rgb(var(--v-theme-warning-darken-1));
}

.dark-color-tag--error {
  background-color: rgb(var(--v-theme-error-darken-1));
}
</style>
