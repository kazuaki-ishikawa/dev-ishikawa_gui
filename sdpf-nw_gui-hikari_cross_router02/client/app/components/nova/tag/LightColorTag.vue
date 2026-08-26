<script setup lang="ts">
type PropType = {
  label: string
  color: 'info' | 'primary' | 'success' | 'warning' | 'error'
}
defineProps<PropType>()
</script>

<template>
  <v-chip label size="small" :color="color">
    {{ label }}
  </v-chip>
</template>
