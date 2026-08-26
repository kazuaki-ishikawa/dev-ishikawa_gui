<script lang="ts" setup generic="R extends boolean">
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import type { DateProps, DatePickerFormPropType } from '@/components/nova/form/calendar/types'

const props = withDefaults(defineProps<DatePickerFormPropType<R>>(), {
  isConfirmation: false,
  original: undefined,
})
const model = defineModel<DateProps<R>['modelValue']>({ required: true })

const { t } = useI18n()

const edited = computed(() => props.original !== undefined && !isEqual(model.value, props.original))
const disabled = computed(() => props.inputProps?.disabled || props.isConfirmation)
const baseColor = computed(() => (edited.value ? 'success' : undefined))
</script>

<template>
  <v-sheet color="transparent" class="d-flex flex-wrap ga-6">
    <v-sheet v-if="isConfirmation && edited && original !== undefined" color="transparent" width="fit-content">
      <NovaDatePicker v-bind="{ ...inputProps }" :model-value="original" color="info" disabled>
        <template #prepend>
          <span class="text-error text-sm">{{ t('nova.common.beforeUpdate') }}</span>
        </template>
        <template v-if="$slots.explanation" #explanation><slot name="explanation" /></template>
      </NovaDatePicker>
    </v-sheet>
    <v-sheet color="transparent" width="fit-content">
      <NovaDatePicker v-bind="{ ...inputProps }" v-model="model" :color="baseColor" :disabled="disabled">
        <template v-if="isConfirmation && edited" #prepend>
          <span class="text-error text-sm">{{ t('nova.common.afterUpdate') }}</span>
        </template>
        <template v-if="$slots.explanation" #explanation><slot name="explanation" /></template>
      </NovaDatePicker>
    </v-sheet>
  </v-sheet>
</template>
