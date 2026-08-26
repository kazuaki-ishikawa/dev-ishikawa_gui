<script setup lang="ts">
import type { ColorKeyList } from '@/components/constants'
import { NovaIconTypes } from '@/components/icons/constants'

type PropType = {
  icon?: typeof NovaIconTypes.Help | typeof NovaIconTypes.HelpCircle | typeof NovaIconTypes.Information
  size?: string
  color?: (typeof ColorKeyList)[number]
}
withDefaults(defineProps<PropType>(), {
  icon: NovaIconTypes.Help,
  size: '25',
  color: 'info',
})
</script>

<template>
  <NovaCustomTooltip>
    <div class="text-pre-wrap">
      <slot />
    </div>
    <template #activator="{ props }">
      <v-icon
        v-bind="props"
        :icon="`nova:${icon}`"
        :size="size"
        tabindex="0"
        role="button"
        :color="color"
        :class="$attrs['class']"
      />
    </template>
  </NovaCustomTooltip>
</template>
