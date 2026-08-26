<script setup lang="ts">
import type { NovaIconType } from '@/components/icons/constants'

type PropType = {
  title?: string
  icon?: NovaIconType
  width?: number
}
const props = withDefaults(defineProps<PropType>(), {
  width: 700,
})

const model = defineModel<boolean>({ default: false })

const dialogWidth = computed(() => `${props.width}px`)
const titleIcon = computed(() => (props.icon ? `nova:${props.icon}` : undefined))
</script>

<template>
  <v-dialog v-model="model" :width="dialogWidth" persistent>
    <v-card :prepend-icon="titleIcon">
      <template #title>
        <div class="flex-space-between-center">
          <span class="text-lg">{{ title }}</span>
          <v-btn icon="mdi-close" variant="text" @click="model = false" />
        </div>
      </template>

      <v-card-text class="text-sm">
        <slot />
      </v-card-text>

      <div class="flex-end-center pr-6 pb-5">
        <slot name="actions" />
      </div>
    </v-card>
  </v-dialog>
</template>
