<script setup lang="ts">
import type { ColorKeyList } from '@/components/constants'
import type { NovaIconType } from '@/components/icons/constants'

type PropType = {
  title?: string
  icon?: NovaIconType
  color?: (typeof ColorKeyList)[number]
}
const props = withDefaults(defineProps<PropType>(), {
  color: 'warning',
})

const titleIcon = computed(() => (props.icon ? `nova:${props.icon}` : undefined))
const backgroundColor = computed(() => `rgb(var(--v-theme-light-${props.color}))`)
</script>

<template>
  <v-alert :icon="titleIcon" variant="outlined" :color="color" class="caution-card">
    <template #title>
      <span class="font-weight-bold text-lg">{{ title }}</span>
    </template>
    <slot />
  </v-alert>
</template>

<style lang="scss" scoped>
$background-color: v-bind(backgroundColor);

.caution-card {
  background-color: $background-color;
  :deep(.v-alert__prepend),
  :deep(.v-alert__content) {
    color: rgb(var(--v-theme-interactive));
  }
}
</style>
