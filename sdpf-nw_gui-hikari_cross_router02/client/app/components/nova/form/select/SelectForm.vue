<script lang="ts" setup>
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import type { SelectFormPropType } from '@/components/nova/form/types'

const props = withDefaults(defineProps<SelectFormPropType>(), {
  isConfirmation: false,
  original: undefined,
})
const model = defineModel<string | string[]>({ required: true })

const { t } = useI18n()

const sortedModelValue = computed(() =>
  typeof model.value !== 'string' ? model.value.toSorted((a, b) => a.localeCompare(b)) : [model.value],
)
const sortedOriginalValues = computed(() =>
  typeof props.original !== 'string'
    ? (props.original?.toSorted((a, b) => a.localeCompare(b)) ?? [])
    : [props.original],
)

const edited = computed(
  () => props.original !== undefined && !isEqual(sortedModelValue.value, sortedOriginalValues.value),
)

const disabled = computed(() => props.inputProps?.disabled || props.isConfirmation)
const baseColor = computed(() => (edited.value ? 'success' : undefined))
</script>

<template>
  <v-sheet color="transparent" class="d-flex flex-wrap ga-6">
    <v-sheet v-if="isConfirmation && edited && original !== undefined" color="transparent" width="fit-content">
      <NovaCustomSelect v-bind="{ ...inputProps }" :model-value="original" color="info" disabled>
        <template #prepend>
          <span class="text-error text-sm">{{ t('nova.common.beforeUpdate') }}</span>
        </template>
        <template v-if="$slots.explanation" #explanation><slot name="explanation" /></template>
      </NovaCustomSelect>
    </v-sheet>
    <v-sheet color="transparent" width="fit-content">
      <NovaCustomSelect v-bind="{ ...inputProps }" v-model="model" :color="baseColor" :disabled="disabled">
        <template v-if="isConfirmation && edited" #prepend>
          <span class="text-error text-sm">{{ t('nova.common.afterUpdate') }}</span>
        </template>
        <template v-if="$slots.explanation" #explanation><slot name="explanation" /></template>
      </NovaCustomSelect>
    </v-sheet>
  </v-sheet>
</template>
