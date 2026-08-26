<script lang="ts" setup generic="T extends string">
import { useI18n } from 'vue-i18n'
import type { CustomCheckboxesPropType } from '@/components/nova/form/types'

const props = withDefaults(defineProps<CustomCheckboxesPropType<T>>(), {
  required: false,
  maxItems: undefined,
  disabled: false,
  inline: false, // デフォルトで縦並び
})
const model = defineModel<T[]>({ required: true })

const { t } = useI18n()

const checkboxDisabled = (value: T) => {
  if (props.maxItems === 0) {
    return true
  } else if (props?.maxItems && props.maxItems <= model.value.length) {
    return props.disabled || !model.value.includes(value)
  } else {
    return props.disabled
  }
}

const handleClick = (value: T) => {
  if (!checkboxDisabled(value)) {
    model.value = model.value.includes(value) ? model.value.filter(val => val !== value) : [...model.value, value]
  }
}

const required = (value: T[]) => !!props.disabled || !props.required || value.length > 0 || t('invalid.required')
</script>

<template>
  <NovaValidationInput :value="model" :rules="[required]" :hide-details="disabled ? true : 'auto'">
    <template #default="{ invalid }">
      <v-row :gap="inline ? 20 : 0">
        <v-col
          v-for="option in options"
          :key="`${option.value}`"
          :cols="inline ? 'auto' : 12"
          class="flex-flex-start-center"
        >
          <NovaCheckboxBase
            :model-value="model.includes(option.value)"
            :label="option.text"
            :disabled="checkboxDisabled(option.value)"
            :error="invalid"
            :color="color"
            @update:model-value="handleClick(option.value)"
          />
          <NovaHelpTooltip v-if="option.help" size="18" class="mx-3">
            {{ option.help }}
          </NovaHelpTooltip>
        </v-col>
      </v-row>
    </template>

    <template v-if="$slots.prepend" #prepend>
      <slot name="prepend" />
    </template>

    <template v-if="$slots.explanation" #explanation>
      <slot name="explanation" />
    </template>
  </NovaValidationInput>
</template>
