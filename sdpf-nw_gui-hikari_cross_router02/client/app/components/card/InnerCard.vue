<script lang="ts" setup>
import type { ColorKeyList } from '@/components/constants'

type PropType = {
  title?: string
  color?: (typeof ColorKeyList)[number]
  note?: string
}
withDefaults(defineProps<PropType>(), {
  title: '',
  note: undefined,
})
</script>

<template>
  <div class="inner-card" :class="color ? `bg-light-${color} text-${color}` : 'bg-highlight text-black'">
    <div v-if="!!title" class="border-b-white pb-4">
      <div class="flex-space-between-center">
        <div class="flex-flex-start-center">
          <div
            :class="{ 'text-secondary': !color, 'text-warning': color === 'warning' }"
            class="text-lg"
            data-cy="inner-card-title"
          >
            {{ title }}
          </div>
          <HelpTooltip v-if="$slots.help" class="px-2 pt-1" size="smallMiddle">
            <slot name="help" />
          </HelpTooltip>
        </div>
        <slot name="button" />
      </div>
      <div v-if="!!note" class="d-flex text-warning mt-2">
        <span class="whitespace-pre-line">{{ note }}</span>
      </div>
      <slot name="description" />
    </div>
    <slot />
  </div>
</template>

<style scoped lang="scss">
.inner-card {
  border-radius: v.$child-border-radius;
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
}
.border-b-white {
  border-bottom: 2px solid #fff;
}
.whitespace-pre-line {
  white-space: pre-line;
}
</style>
