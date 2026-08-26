<script lang="ts" setup generic="T extends string">
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import type { CheckboxFormPropType } from '@/components/nova/form/types'

const props = withDefaults(defineProps<CheckboxFormPropType<T>>(), {
  isConfirmation: false,
  original: undefined,
})
const model = defineModel<T[]>({ required: true })

const { t } = useI18n()
const sortedModelValue = computed(() => model.value.toSorted((a, b) => a.localeCompare(b)))
const sortedOriginalValues = computed(() => props.original?.toSorted((a, b) => a.localeCompare(b)) ?? [])

const edited = computed(
  () => props.original !== undefined && !isEqual(sortedModelValue.value, sortedOriginalValues.value),
)
const disabled = computed(() => props.inputProps?.disabled || props.isConfirmation)
const baseColor = computed(() => (edited.value ? 'success' : undefined))
</script>

<template>
  <v-row no-gutters>
    <v-col v-if="isConfirmation && edited && original !== undefined">
      <NovaCustomCheckboxes v-bind="{ ...inputProps }" :model-value="original" disabled>
        <template #prepend>
          <span class="text-error text-sm">{{ t('nova.common.beforeUpdate') }}</span>
        </template>
        <template #explanation><slot name="explanation" /></template>
      </NovaCustomCheckboxes>
    </v-col>
    <v-col>
      <NovaCustomCheckboxes v-bind="{ ...inputProps }" v-model="model" :color="baseColor" :disabled="disabled">
        <template v-if="isConfirmation && edited" #prepend>
          <span class="text-error text-sm">{{ t('nova.common.afterUpdate') }}</span>
        </template>
        <template #explanation><slot name="explanation" /></template>
      </NovaCustomCheckboxes>
    </v-col>
  </v-row>
</template>
