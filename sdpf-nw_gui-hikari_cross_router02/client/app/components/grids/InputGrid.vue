<script lang="ts" setup>
import type { HelpTooltipPropType } from '@/components/tooltip/types'

type PropType = {
  label: string
  required?: boolean
  labelWidth?: number
  help?: string
  helpOption?: HelpTooltipPropType
}
const props = withDefaults(defineProps<PropType>(), {
  required: false,
  labelWidth: 290,
  help: '',
  helpOption: undefined,
})

const labelWidth = computed(() => `${props.labelWidth}px`)
const helpBind = computed<HelpTooltipPropType>(() => ({ size: 'smallMiddle', ...props.helpOption }))
</script>

<template>
  <div class="input-grid-container">
    <div class="input-grid">
      <div class="flex-flex-start-center mr-5" :style="{ width: labelWidth }">
        {{ label }}
        <span v-if="required" class="text-error">*</span>
        <HelpTooltip v-if="$slots.help || help" class="px-2 pt-1" v-bind="helpBind">
          <slot v-if="$slots.help" name="help" />
          <span v-else>{{ help }}</span>
        </HelpTooltip>
      </div>
      <div class="flex-1-1-0">
        <slot />
      </div>
    </div>
    <slot name="footer" />
  </div>
</template>

<style scoped lang="scss">
.input-grid-container {
  padding: 0.65rem 0;
  &:not(:last-of-type) {
    border-bottom: v.$split-border;
  }
}
.input-grid {
  display: flex;
  flex-wrap: wrap;
  padding: 0.1rem 0;
}
</style>
