<script lang="ts" setup>
import type { ColorKeyList } from '@/components/constants'

type PropType = {
  label?: string
  color?: (typeof ColorKeyList)[number]
  error?: boolean
  disabled?: boolean
  indeterminate?: boolean
}
const props = withDefaults(defineProps<PropType>(), {
  error: false,
  disabled: false,
  indeterminate: false,
})
const model = defineModel<boolean>({ required: true })
const textColor = computed(() => (props.color ? `rgb(var(--v-theme-${props.color}))` : '#000'))
const hoverColor = computed(() =>
  props.color ? `rgb(var(--v-theme-${props.color}-darken-2))` : 'rgb(var(--v-theme-info))',
)
</script>

<template>
  <v-checkbox-btn
    v-model="model"
    :label="label"
    :disabled="disabled"
    :error="error"
    :indeterminate="!model && indeterminate"
    density="compact"
    class="checkbox"
  >
    <template v-if="$slots.label" #label>
      <slot name="label" />
    </template>
  </v-checkbox-btn>
</template>

<style lang="scss" scoped>
$text-color: v-bind(textColor);
$hover-color: v-bind(hoverColor);
$error-color: rgb(var(--v-theme-error));
$error-hover-color: rgb(var(--v-theme-error-darken-2));

.checkbox {
  flex: 0 0 auto;
  width: fit-content;
  color: $text-color;

  &:hover:not(.v-selection-control--disabled) {
    color: $hover-color;
  }
  &.v-selection-control--error:not(.v-selection-control--disabled) {
    &:hover {
      :deep(.v-icon),
      :deep(.v-label) {
        color: $error-hover-color;
      }
    }
  }

  &.v-selection-control--disabled {
    :deep(.v-label) {
      pointer-events: auto !important;
      cursor: not-allowed !important;
    }
    :deep(.v-icon) {
      pointer-events: auto;
      cursor: not-allowed;
      color: $text-color;
    }

    &.v-selection-control--error {
      color: $error-color;
      :deep(.v-icon) {
        color: $error-color;
      }
    }
  }
}
</style>
