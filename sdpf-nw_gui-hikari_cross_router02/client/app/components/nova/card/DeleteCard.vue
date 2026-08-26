<script setup lang="ts">
import { useI18n } from 'vue-i18n'

type PropType = {
  disabled?: boolean
}
defineProps<PropType>()

type Emits = {
  (e: 'click'): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
</script>

<template>
  <v-card class="delete-card" :title="t('nova.common.deleteTitle')">
    <v-card-item class="pb-4">
      <div class="flex-flex-start-center ga-8">
        <div class="text-info"><slot /></div>
        <NovaCustomButton
          color="error"
          outlined
          :disabled="disabled"
          data-cy="delete-card-delete-button"
          @click="emits('click')"
        >
          {{ t('nova.common.delete') }}
        </NovaCustomButton>
      </div>
    </v-card-item>
  </v-card>
</template>

<style lang="scss" scoped>
.delete-card {
  border: 2px solid rgb(var(--v-theme-light-error));
  font-size: 14px;
}
</style>
