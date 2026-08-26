<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { TenantPages, ContractsPages } from '@/components/sidebar/constants'

type PropType = {
  open: boolean
  tenantId: string
  showTrafficReportFlowAnalyzer?: boolean
  showSecurity?: boolean
  showBehaviorDetection?: boolean
}
const props = defineProps<PropType>()

type Emits = {
  (e: 'close'): void
}
const emits = defineEmits<Emits>()
const { t } = useI18n()

const moveToTermsOfService = async () => {
  await navigateTo(
    `/tenants/${props.tenantId}/${TenantPages.Contracts}/${ContractsPages.SecurityTrafficReportFlowAnalyzer}`,
    { open: { target: '_blank', windowFeatures: { noopener: true, noreferrer: true } } },
  )
}

const moveToBehaviorDetection = async () => {
  await navigateTo(`/tenants/${props.tenantId}/security-contracts/summary`, {
    open: { target: '_blank', windowFeatures: { noopener: true, noreferrer: true } },
  })
}
</script>

<template>
  <DialogBase :open="props.open" data-cy="terms-of-service-confirm-dialog" @close="emits('close')">
    <template #default>
      <div class="text-center mt-4">
        <div v-if="showBehaviorDetection" data-cy="terms-of-service-confirm-dialog-behavior-detection-message">
          {{ t('terminals.message.needBehaviorDetection') }}
        </div>
        <div
          v-if="showTrafficReportFlowAnalyzer || showSecurity"
          data-cy="terms-of-service-confirm-dialog-flow-analyzer-security-message"
        >
          {{ t('terminals.message.needFlowAnalyzerOrSecurity') }}
        </div>
        <div class="mt-4">{{ t('terminals.message.suggest') }}</div>
      </div>
    </template>
    <template #footer>
      <div class="flex-center-center">
        <!-- 閉じるボタン -->
        <CustomButton
          :width="150"
          :text="t('common.close')"
          icon="right-arrow"
          color="info"
          data-cy="terms-of-service-confirm-dialog-close-button"
          @click="emits('close')"
        />
        <!-- 同意設定へ遷移するボタン -->
        <CustomButton
          v-if="props.showTrafficReportFlowAnalyzer || props.showSecurity"
          class="ml-3"
          :width="150"
          :text="t('terms.agreementSettings')"
          icon="up-right-square"
          data-cy="terms-of-service-confirm-dialog-agreement-settings-button"
          @click="moveToTermsOfService"
        />
        <!-- セキュリティ契約状況一覧へ遷移するボタン -->
        <CustomButton
          v-if="props.showBehaviorDetection"
          class="ml-3"
          :width="230"
          :text="t('securityContracts.configureBehaviorDetection')"
          icon="up-right-square"
          data-cy="terms-of-service-confirm-dialog-behavior-detection-plan-button"
          @click="moveToBehaviorDetection"
        />
      </div>
    </template>
  </DialogBase>
</template>
