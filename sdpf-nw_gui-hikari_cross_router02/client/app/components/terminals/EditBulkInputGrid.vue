<script setup lang="ts">
import { IconTypes } from '@/components/icons/constants'

type PropType = {
  label: string
  isConfirmation: boolean
  note?: string
  disabled?: boolean
  required?: boolean
}
const props = withDefaults(defineProps<PropType>(), {
  note: '',
  disabled: false,
  required: false,
})

const checked = defineModel<boolean>('checked', { required: true })

const inputDisabled = computed(() => props.disabled || props.isConfirmation)
const handleLabelClick = () => {
  if (!inputDisabled.value) {
    checked.value = !checked.value
  }
}
</script>

<template>
  <div>
    <div v-if="checked || !isConfirmation" class="flex-start-start flex-wrap py-3">
      <CheckboxBase
        v-show="!isConfirmation"
        v-model:value="checked"
        :disabled="inputDisabled"
        data-cy="edit-bulk-input-checkbox"
      />
      <div :class="{ 'ml-3': !isConfirmation }" class="w-280px flex-start-center">
        <span
          :class="[
            'label',
            {
              'cursor-pointer': !inputDisabled,
              'pt-2px': $slots.help,
              'pt-3px': !$slots.help,
            },
          ]"
          @click="handleLabelClick"
        >
          {{ label }}
        </span>
        <span v-show="required" class="text-error">*</span>
        <HelpTooltip v-if="$slots.help" class="px-2 pt-1" size="smallMiddle" :icon="IconTypes.Alert" color="warning">
          <slot name="help" />
        </HelpTooltip>
      </div>
      <slot />
    </div>
    <div v-if="note && checked && !isConfirmation" class="text-warning text-pre-wrap ml-8">
      {{ note }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.w-280px {
  width: 280px;
}
.label {
  &.pt-2px {
    padding-top: 2px;
  }
  &.pt-3px {
    padding-top: 3px;
  }
}
</style>
