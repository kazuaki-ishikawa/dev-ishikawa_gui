<script setup lang="ts">
import { IconTypes } from '@/components/icons/constants'

type PropType = {
  value: string
  text: string
  showButton?: boolean
  overflow?: boolean
}
const { showButton = false, overflow = false, ...props } = defineProps<PropType>()
type Emits = {
  (e: 'click', value: string): void
}
const emits = defineEmits<Emits>()
</script>

<template>
  <div class="flex-flex-start-center px-2">
    <div class="mr-1" :class="{ 'text-overflow': overflow }" :title="props.text">{{ props.text }}</div>
    <IconButton
      v-if="showButton"
      :type="IconTypes.CircleClose"
      color="info"
      size="small"
      class="pt-2px"
      @click="emits('click', props.value)"
    />
  </div>
</template>

<style lang="scss" scoped>
.text-overflow {
  max-width: 300px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.pt-2px {
  padding-top: 2px;
}
</style>
