<script setup lang="ts">
import { useI18n } from 'vue-i18n'

type PropType = {
  scheduleNetworkList: string[]
  disabled?: boolean
  required?: boolean
}

const props = withDefaults(defineProps<PropType>(), {
  disabled: false,
  required: false,
})

const model = defineModel<string>({ required: true })

type Emits = {
  (e: 'valid', valid: boolean): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()

const openTimeDialog = ref(false)
const tempTimeFrame = ref('')

const selectedTimeDisplay = computed(() => formatDateTime(model.value, false))

const handleOpenTimeDialog = () => {
  if (!props.disabled) {
    tempTimeFrame.value = model.value
    openTimeDialog.value = true
  }
}

const handleTimeDialogSubmit = () => {
  model.value = tempTimeFrame.value
  openTimeDialog.value = false
}

const handleTimeDialogClose = () => {
  tempTimeFrame.value = model.value
  openTimeDialog.value = false
}

const isValid = computed(() => {
  return !props.required || !!model.value
})
watch(
  isValid,
  next => {
    emits('valid', next)
  },
  { immediate: true },
)
</script>

<template>
  <div>
    <div class="flex-flex-start-center ga-3">
      <InputForm
        :model-value="selectedTimeDisplay"
        size="small"
        disabled
        data-cy="edit-schedule-network-date-input-form"
      />
      <CustomButton
        icon="right-arrow"
        :text="t('common.select')"
        :width="150"
        :disabled="disabled"
        data-cy="edit-schedule-network-date-select-button"
        @click="handleOpenTimeDialog"
      />
    </div>
    <div v-if="!isValid" class="pl-2 text-sm text-warning">{{ t('invalid.required') }}</div>

    <DialogBase
      :open="openTimeDialog"
      :submit-label="t('common.save')"
      :cancel-label="t('common.close')"
      :disabled="!tempTimeFrame"
      @close="handleTimeDialogClose"
      @submit="handleTimeDialogSubmit"
    >
      <ScheduleNetworkDateTable v-model="tempTimeFrame" :schedule-network-list="scheduleNetworkList" />
    </DialogBase>
  </div>
</template>
