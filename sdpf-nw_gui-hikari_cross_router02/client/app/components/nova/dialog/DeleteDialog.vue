<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { NovaIconTypes } from '@/components/icons/constants'

type PropType = {
  title: string
  items: Array<{ label: string; value: string }>
  disabled?: boolean
}
withDefaults(defineProps<PropType>(), {})

type Emits = {
  (e: 'submit'): void
}
const emits = defineEmits<Emits>()

const model = defineModel<boolean>({ required: true })

const { t } = useI18n()
const { loading } = useLoading()
</script>

<template>
  <NovaDialogBase v-model="model" :title="title" :icon="NovaIconTypes.AlertCircle">
    <slot name="description" />
    <div class="mb-5 text-error">{{ t('nova.delete.cannotFallback') }}</div>

    <div v-for="(item, index) in items" :key="index" class="delete-dialog-grid py-2">
      <div class="my-auto font-weight-bold text-body-medium text-break">{{ item.label }}</div>
      <div class="my-auto text-break">{{ item.value }}</div>
    </div>

    <template #actions>
      <NovaCustomButton outlined data-cy="delete-dialog-cancel-button" @click="model = false">
        {{ t('nova.common.cancel') }}
      </NovaCustomButton>
      <NovaCustomButton
        class="ml-4"
        color="error"
        :disabled="disabled || loading"
        data-cy="delete-dialog-submit-button"
        @click="emits('submit')"
      >
        {{ t('nova.common.applicationForDelete') }}
      </NovaCustomButton>
    </template>
  </NovaDialogBase>
</template>

<style lang="scss" scoped>
$border-color: rgb(var(--v-theme-info-lighten-3));

.delete-dialog-grid {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 50px;

  &:last-of-type {
    border-block: 1px solid $border-color;
  }
  &:not(:last-of-type) {
    border-block-start: 1px solid $border-color;
  }
}
</style>
