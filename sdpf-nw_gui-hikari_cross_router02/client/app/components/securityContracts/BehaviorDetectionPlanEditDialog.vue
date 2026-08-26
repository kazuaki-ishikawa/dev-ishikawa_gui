<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { BehaviorDetectionPlanTypes } from '@/api/behaviorDetection/constants'
import type { BehaviorDetectionPlanType } from '@/api/behaviorDetection/types'

type PropType = {
  open: boolean
  originalPlan?: BehaviorDetectionPlanType
  terminalCount: number
}

const props = withDefaults(defineProps<PropType>(), {
  originalPlan: BehaviorDetectionPlanTypes.None,
})

type Emits = {
  (e: 'submit', updatedPlan: BehaviorDetectionPlanType): void
  (e: 'close'): void
}

const emit = defineEmits<Emits>()
const { t } = useI18n()

const planOptions = [
  { value: BehaviorDetectionPlanTypes.Lite, text: t('securityContracts.behaviorDetectionPlan.lite') },
  { value: BehaviorDetectionPlanTypes.Standard, text: t('securityContracts.behaviorDetectionPlan.standard') },
]
const selectedPlan = ref<BehaviorDetectionPlanType>(planOptions[0]?.value ?? BehaviorDetectionPlanTypes.Lite)
const isPlanChanged = computed(() => selectedPlan.value !== props.originalPlan)

watch(
  () => props.open,
  isOpen => {
    if (isOpen && props.originalPlan !== BehaviorDetectionPlanTypes.None) {
      selectedPlan.value = props.originalPlan
    }
  },
)

const handleSubmit = async () => {
  if (!selectedPlan.value || !isPlanChanged.value) {
    return
  }
  emit('submit', selectedPlan.value)
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <DialogBase
    :open="props.open"
    :submit-label="t('common.edit')"
    :cancel-label="t('common.cancel')"
    :width="600"
    :disabled="!isPlanChanged"
    overflow-y="visible"
    @submit="handleSubmit"
    @close="handleClose"
  >
    <div class="behavior-plan-change-content">
      <div class="text-pre-wrap">{{ t('securityContracts.message.behaviorDetectionEdit') }}</div>

      <DetailGrid>
        <div>{{ t('securityContracts.terminalCount') }}</div>
        <div>
          {{ terminalCount }}
        </div>
      </DetailGrid>

      <InputGrid required :label="t('terminals.behaviorDetection')">
        <SelectForm v-model="selectedPlan" :options="planOptions" required />
      </InputGrid>
    </div>
  </DialogBase>
</template>

<style lang="scss" scoped>
.behavior-plan-change-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
</style>
