<script setup lang="ts">
type PropType = {
  status: 'ok' | 'ng' | 'warning'
  text?: string
}
const props = defineProps<PropType>()
const label = computed(() => {
  switch (props.status) {
    case 'ok':
    case 'ng':
      return props.status.toUpperCase()
    case 'warning':
      return 'Warning'
    default:
      return props.status
  }
})
const color = computed(() => {
  switch (props.status) {
    case 'ok':
      return 'success'
    case 'ng':
      return 'error'
    case 'warning':
      return 'warning'
    default:
      return undefined
  }
})
</script>

<template>
  <v-sheet class="text-center rounded-sm" width="100%" :color="color">
    {{ text || label }}
  </v-sheet>
</template>
