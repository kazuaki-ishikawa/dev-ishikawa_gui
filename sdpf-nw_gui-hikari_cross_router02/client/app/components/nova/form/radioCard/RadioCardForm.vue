<script setup lang="ts" generic="T">
import { useI18n } from 'vue-i18n'
import type { RadioFormPropType } from '@/components/nova/form/types'

const model = defineModel<T>({ required: true })
const props = withDefaults(defineProps<RadioFormPropType<T>>(), {
  isConfirmation: false,
  original: undefined,
})

const { t } = useI18n()

const edited = computed(() => props.original !== undefined && props.original !== model.value)
const disabled = computed(() => props.inputProps?.disabled || props.isConfirmation)
const singleColumn = computed(() => props.isConfirmation && edited.value)
const baseColor = computed(() => (edited.value ? 'success' : undefined))
</script>

<template>
  <v-row no-gutters>
    <v-col v-if="isConfirmation && edited && original !== undefined">
      <NovaCustomRadioCard
        v-bind="{ ...inputProps }"
        :model-value="original"
        color="info"
        :disabled="true"
        :single-column="true"
      >
        <template #prepend>
          <span class="text-error text-sm">{{ t('nova.common.beforeUpdate') }}</span>
        </template>

        <template v-if="$slots.title" #title="slotProps">
          <slot name="title" v-bind="slotProps" />
        </template>
        <template v-if="$slots.note" #note="slotProps">
          <slot name="note" v-bind="slotProps" />
        </template>
        <template v-if="$slots.explanation" #explanation>
          <slot name="explanation" />
        </template>
      </NovaCustomRadioCard>
    </v-col>

    <v-col>
      <NovaCustomRadioCard
        v-bind="{ ...inputProps }"
        v-model="model"
        :color="baseColor"
        :disabled="disabled"
        :single-column="singleColumn"
      >
        <template v-if="isConfirmation && edited" #prepend>
          <span class="text-error text-sm">{{ t('nova.common.afterUpdate') }}</span>
        </template>

        <template v-if="$slots.title" #title="slotProps">
          <slot name="title" v-bind="slotProps" />
        </template>
        <template v-if="$slots.note" #note="slotProps">
          <slot name="note" v-bind="slotProps" />
        </template>
        <template v-if="$slots.explanation" #explanation>
          <slot name="explanation" />
        </template>
      </NovaCustomRadioCard>
    </v-col>
  </v-row>
</template>
