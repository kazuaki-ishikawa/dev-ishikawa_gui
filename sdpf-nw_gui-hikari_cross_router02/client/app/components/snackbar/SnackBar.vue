<script lang="ts" setup>
import type { ColorKeyList } from '@/components/constants'

type PropType = {
  open: boolean
  text: string
  color?: (typeof ColorKeyList)[number]
}
withDefaults(defineProps<PropType>(), {
  color: 'success',
})

type Emits = {
  (e: 'close'): void
}
const emits = defineEmits<Emits>()
</script>

<template>
  <v-snackbar
    :model-value="open"
    :color="color"
    :timeout="-1"
    :z-index="2500"
    location="top center"
    @update:model-value="emits('close')"
  >
    <span data-cy="snack-bar-text">{{ text }}</span>
    <template #actions>
      <v-btn icon="mdi-close" @click="emits('close')" />
    </template>
  </v-snackbar>
</template>
