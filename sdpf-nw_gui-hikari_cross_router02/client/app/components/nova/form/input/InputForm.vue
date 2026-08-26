<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import type { InputFormPropType } from '@/components/nova/form/types'

const props = withDefaults(defineProps<InputFormPropType>(), {
  isConfirmation: false,
  original: undefined,
})
const model = defineModel<string>({ required: true })

const { t } = useI18n()

const edited = computed(() => props.original !== undefined && props.original !== model.value)
const disabled = computed(() => props.inputProps?.disabled || props.isConfirmation)
const baseColor = computed(() => (edited.value ? 'success' : undefined))
</script>

<template>
  <v-sheet color="transparent" class="d-flex flex-wrap ga-6">
    <v-sheet v-if="isConfirmation && edited && original !== undefined" color="transparent" width="fit-content">
      <NovaCustomTextField v-bind="{ ...inputProps }" :model-value="original" color="info" disabled>
        <template #prepend>
          <span class="text-error text-sm">{{ t('nova.common.beforeUpdate') }}</span>
        </template>
        <template v-if="$slots.explanation" #explanation><slot name="explanation" /></template>
      </NovaCustomTextField>
    </v-sheet>
    <v-sheet color="transparent" width="fit-content">
      <NovaCustomTextField v-bind="{ ...inputProps }" v-model="model" :color="baseColor" :disabled="disabled">
        <template v-if="isConfirmation && edited" #prepend>
          <span class="text-error text-sm">{{ t('nova.common.afterUpdate') }}</span>
        </template>
        <template v-if="$slots.explanation" #explanation><slot name="explanation" /></template>
      </NovaCustomTextField>
    </v-sheet>
  </v-sheet>
</template>
