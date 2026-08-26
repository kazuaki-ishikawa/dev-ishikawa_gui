<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

type PropType = {
  open: boolean
  text: string
}
const props = defineProps<PropType>()

type Emits = {
  (e: 'submit'): void
  (e: 'close'): void
}
const emit = defineEmits<Emits>()
const { t } = useI18n()
</script>

<template>
  <DialogBase
    :open="props.open"
    :submit-label="t('common.yes')"
    :cancel-label="t('common.no')"
    @submit="emit('submit')"
    @close="emit('close')"
  >
    <div class="confirm-dialog-text">{{ props.text }}</div>
  </DialogBase>
</template>

<style lang="scss" scoped>
.confirm-dialog-text {
  white-space: pre-wrap;
  font-size: 1.5rem;
  color: rgb(var(--v-theme-info));
  text-align: center;
}
</style>
