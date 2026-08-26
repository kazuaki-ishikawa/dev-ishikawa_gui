<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

type PropType = {
  open: boolean
  message: string
  submitButton?: { label: string; click: () => void; width?: number }
  cancelButton?: { label: string; click: () => void; width?: number }
}
defineProps<PropType>()
type Emits = {
  (e: 'close'): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
</script>

<template>
  <DialogBase :open="open" @close="emits('close')">
    <div class="grid h-100 text-center text-info">
      <div class="notification-dialog-text" data-cy="notification-dialog-text">{{ message }}</div>
    </div>

    <template #footer>
      <div class="flex-center-center ga-4">
        <CustomButton
          v-if="cancelButton"
          :text="cancelButton.label"
          :width="cancelButton.width"
          icon="right-arrow"
          color="primary"
          data-cy="notification-dialog-cancel-button"
          @click="cancelButton.click()"
        />
        <CustomButton
          :text="submitButton?.label ?? t('common.close')"
          icon="right-arrow"
          :width="submitButton?.width"
          color="info"
          data-cy="notification-dialog-submit-button"
          @click="submitButton ? submitButton.click() : emits('close')"
        />
      </div>
    </template>
  </DialogBase>
</template>

<style lang="scss" scoped>
.grid {
  display: grid;
}
.notification-dialog-text {
  font-size: 1.5rem;
  overflow-wrap: break-word;
  align-self: center;
  white-space: pre-wrap;
}
</style>
