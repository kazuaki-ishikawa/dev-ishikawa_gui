<script setup lang="ts">
type PropType = {
  title: string
}
defineProps<PropType>()
</script>

<template>
  <v-card-title class="my-3 pa-0 text-lg">
    {{ title }}
  </v-card-title>
</template>
