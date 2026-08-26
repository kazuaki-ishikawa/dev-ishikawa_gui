<script setup lang="ts">
import type { ColorKeyList } from '@/components/constants'

type PropType = {
  title: string
  color: (typeof ColorKeyList)[number]
  elevation?: 1 | 2 | 3 | 4 | 5
}
const props = defineProps<PropType>()

const borderClass = computed(() => ['border-b-md', `border-${props.color}-lighten-5`, 'border-opacity-100'])
</script>

<template>
  <v-card :elevation="elevation">
    <v-card-title class="px-3 py-2" :class="borderClass">
      <span class="text-title-medium font-weight-bold">{{ title }}</span>
      <NovaHelpTooltip v-if="$slots.help" size="18" class="mx-3">
        <slot name="help" />
      </NovaHelpTooltip>
    </v-card-title>
    <v-card-item>
      <slot />
    </v-card-item>
  </v-card>
</template>
