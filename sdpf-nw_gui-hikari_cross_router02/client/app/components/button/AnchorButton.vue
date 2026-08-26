<script lang="ts" setup>
import { IconTypes } from '@/components/icons/constants'
import type { IconType } from '@/components/icons/constants'

type PropType = {
  icon?: IconType
  label: string
}
defineProps<PropType>()

type Emits = {
  (e: 'click'): void
}
const emits = defineEmits<Emits>()
</script>

<template>
  <div class="bg-secondary text-white flex-flex-start-center rounded-lg pa-3 cursor-pointer" @click="emits('click')">
    <SvgIcon v-if="icon" class="pl-1" :type="icon" size="small" />
    <div class="px-2 text-size-sm">{{ label }}</div>
    <SvgIcon :type="IconTypes.CaretDown" size="xSmall" />
  </div>
</template>

<style lang="scss" scoped>
.text-size-sm {
  font-size: 0.875rem;
}
</style>
