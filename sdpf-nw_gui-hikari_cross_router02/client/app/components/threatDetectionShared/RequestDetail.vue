<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ContractorResponse } from '@/api/contractor/types'
import {
  ThreatDetectionSharedRequestStatusTypes,
  ThreatDetectionSharedRequestDirectionTypes,
} from '@/api/threatDetectionShared/constants'
import type { ThreatDetectionsSharedRequestResponse } from '@/api/threatDetectionShared/types'

type PropType = {
  request?: ThreatDetectionsSharedRequestResponse
  contractor?: ContractorResponse
}

const props = defineProps<PropType>()

const route = useRoute()
const { t } = useI18n()

const tenantId = computed(() => route.params.tenantId as string)
const { checkStoppedStatus, getRequestStatusText, getBillingMethodText, getRequestTypeText } =
  useThreatDetectionShared()

const isReceived = computed(
  () => props.request?.requestDirection === ThreatDetectionSharedRequestDirectionTypes.Received,
)
const title = computed(() => {
  if (!props.request) {
    return undefined
  }
  return isReceived.value ? t('threatDetectionShared.receivedDetail') : t('threatDetectionShared.sentDetail')
})
const contractorNameLabel = computed(() => {
  if (!props.request) {
    return undefined
  }
  return isReceived.value
    ? t('threatDetectionShared.receivedContractorName')
    : t('threatDetectionShared.sentContractorName')
})
const isStopped = computed(() => checkStoppedStatus(props.request))
const updateTimeLabel = computed(() => {
  if (isStopped.value) {
    return t('threatDetectionShared.updateTime.stop')
  }
  return t('threatDetectionShared.updateTime.start')
})
const updateTime = computed(() => {
  if (isStopped.value || props.request?.status === ThreatDetectionSharedRequestStatusTypes.Approved) {
    return formatDateTime(props.request?.updateTime)
  }
  return ''
})

const tableHeaders = computed(() => [
  { text: t('terminals.terminalId'), key: 'terminalId', width: 200 },
  { text: t('threatDetectionShared.currentContractorName'), key: 'contractorName' },
  { text: t('terminals.installationAddress'), key: 'installationAddress' },
])
const tableItems = computed(() => {
  if (!props.request) {
    return []
  }

  // 受信の場合は request の値を、送信の場合は contractor の値を表示する
  const contractorName = isReceived.value
    ? `${props.request.contractorName}（${props.request.sharedTenantId}）`
    : `${props.contractor?.name}（${tenantId.value}）`
  return props.request.terminals.map(terminal => ({
    terminalId: terminal.terminalId,
    contractorName,
    // TODO: #17285
    // APIでまとめて返すようにする、と話していた部分。まだ確定ではないのでコメントは残す。
    installationAddress: terminal.installationAddress,
  }))
})
</script>

<template>
  <InnerCard :title="title">
    <DetailGrid>
      <div>{{ t('threatDetectionShared.requestType.label') }}</div>
      <div>{{ getRequestTypeText(request?.requestType) }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ contractorNameLabel }}</div>
      <div>{{ request?.contractorName }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('details.tenantId') }}</div>
      <div>{{ request?.sharedTenantId }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('threatDetectionShared.requestId') }}</div>
      <div>{{ request?.requestId }}</div>
    </DetailGrid>
    <DetailGrid>
      <div data-cy="request-detail-update-time-label">{{ updateTimeLabel }}</div>
      <div data-cy="request-detail-update-time-value">{{ updateTime }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('threatDetectionShared.billingMethod.label') }}</div>
      <div data-cy="request-detail-billing-method-value">
        {{ getBillingMethodText(request?.billingMethod) || t('threatDetectionShared.message.billingMethodNotFound') }}
      </div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('threatDetectionShared.status.label') }}</div>
      <div data-cy="request-detail-status-value">{{ getRequestStatusText(request) }}</div>
    </DetailGrid>

    <InnerCard :title="t('threatDetectionShared.terminals')">
      <SeparatedTable :headers="tableHeaders" :items="tableItems" data-cy="request-detail-terminals-table" />
    </InnerCard>
  </InnerCard>
</template>
