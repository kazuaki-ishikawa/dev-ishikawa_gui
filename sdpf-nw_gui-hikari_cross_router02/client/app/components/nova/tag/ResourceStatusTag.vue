<script setup lang="ts">
import { ResourceStatusTypes } from '@/api/constants'
import type { ResourceStatusType } from '@/api/types'

type PropType = {
  status: ResourceStatusType
}
const props = defineProps<PropType>()
const color = computed(() => {
  switch (props.status) {
    case ResourceStatusTypes.Active:
      return 'primary'
    default:
      return 'info'
  }
})
</script>

<template>
  <NovaLightColorTag :label="status" :color="color" class="px-6" />
</template>
