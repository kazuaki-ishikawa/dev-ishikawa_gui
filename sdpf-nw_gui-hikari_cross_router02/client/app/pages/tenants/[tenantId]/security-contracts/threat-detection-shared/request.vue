<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { TermsOfServiceBasePath } from '@/api/termsOfService/constants'
import {
  ThreatDetectionSharedRequestStatusTypes,
  ThreatDetectionSharedRequestActionTypes,
  ThreatDetectionSharedRequestTypes,
} from '@/api/threatDetectionShared/constants'
import type { ThreatDetectionsSharedRequestResponse } from '@/api/threatDetectionShared/types'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const tenantId = computed(() => route.params.tenantId as string)
const selectedRequestIdList = ref<string[]>([])

const { loading } = useLoading()
const { setNotificationMessageState } = useNotificationDialog()
const { navigationGuard } = useNavigationGuard()
watch(selectedRequestIdList, () => navigationGuard(selectedRequestIdList.value.length > 0))

const {
  securityTermsOfServiceAccepted,
  getTermsOfServiceAccepted: getSecurityTermsOfServiceAccepted,
  moveToSecurityTermOfService,
} = useTermsOfService(TermsOfServiceBasePath.Security)
const { threatDetectionSharedRequestList, getAllThreatDetectionSharedRequestList } =
  useGetAllThreatDetectionSharedRequestList()
const { putThreatDetectionSharedRequest } = usePutThreatDetectionSharedRequest()
const { getBillingMethodText } = useThreatDetectionShared()

const isApproval = computed(() => route.query.type === 'approve')
const requestIdList = computed(() => {
  const requestId = route.query.requestId
  if (!requestId) {
    return []
  }
  return Array.isArray(requestId) ? (requestId as string[]) : [requestId]
})

const tableHeaders = computed(() => [
  { text: t('terminals.terminalId'), key: 'terminalId', width: 200 },
  { text: t('threatDetectionShared.currentContractorName'), key: 'contractorName' },
  { text: t('terminals.installationAddress'), key: 'installationAddress' },
])
const getTableItems = (request: ThreatDetectionsSharedRequestResponse) => {
  return request.terminals.map(terminal => ({
    terminalId: terminal.terminalId,
    contractorName: `${request.contractorName}（${request.sharedTenantId}）`,
    // TODO: #17284
    // APIでまとめて返すようにする、と話していた部分。まだ確定ではないのでコメントは残す。
    installationAddress: terminal.installationAddress,
  }))
}

const handleSelectedChange = (requestId: string, value: boolean) => {
  if (value) {
    selectedRequestIdList.value = [...selectedRequestIdList.value, requestId]
  } else {
    selectedRequestIdList.value = selectedRequestIdList.value.filter(id => id !== requestId)
  }
}

const handleSubmit = async () => {
  const action = isApproval.value
    ? ThreatDetectionSharedRequestActionTypes.Approve
    : ThreatDetectionSharedRequestActionTypes.Reject

  const results = await Promise.allSettled(
    selectedRequestIdList.value.map(requestId =>
      putThreatDetectionSharedRequest({ requestId, request: { action }, suppressErrorDialog: true }),
    ),
  )
  const rejectedList = results.filter(data => data.status === 'rejected')
  const fulfilledList = results.filter(data => data.status === 'fulfilled').map(data => data.value)

  // 成功したものは選択済みのリクエストIDから削除する
  selectedRequestIdList.value = selectedRequestIdList.value.filter(
    requestId => !fulfilledList.some(res => requestId === res.requestId),
  )

  if (rejectedList.length > 0) {
    // 失敗したものが1件でもあればエラーメッセージを表示する
    setNotificationMessageState({
      message: t('threatDetectionShared.message.requestFailed', {
        action: t(`threatDetectionShared.${action}`),
        requestId: selectedRequestIdList.value.join('\n'),
      }),
    })
  } else {
    const message =
      action === ThreatDetectionSharedRequestActionTypes.Approve
        ? t('threatDetectionShared.message.approved')
        : t('threatDetectionShared.message.rejected')
    setNotificationMessageState({ message })
  }
  // レスポンス値で更新する
  threatDetectionSharedRequestList.value = threatDetectionSharedRequestList.value.map(req => {
    const fulfilled = fulfilledList.find(data => data.requestId === req.requestId)
    return fulfilled ? fulfilled : req
  })
}

onBeforeMount(async () => {
  await getSecurityTermsOfServiceAccepted()
  if (securityTermsOfServiceAccepted.value && requestIdList.value.length > 0) {
    await getAllThreatDetectionSharedRequestList({ requestId: requestIdList.value })
    selectedRequestIdList.value = threatDetectionSharedRequestList.value
      .filter(
        req =>
          req.status === ThreatDetectionSharedRequestStatusTypes.PendingApproval &&
          req.requestType === ThreatDetectionSharedRequestTypes.Start,
      )
      .map(req => req.requestId)
  }
})
</script>

<template>
  <CardContainer>
    <div class="mb-4 flex-space-between-center">
      <div class="text-lg">{{ t('threatDetectionShared.requestConfirmation') }}</div>
      <CustomButton
        v-if="!securityTermsOfServiceAccepted"
        icon="up-right-square"
        :text="t('terms.confirmation')"
        :width="180"
        data-cy="security-contracts-threat-detection-shared-request-terms-of-service-button"
        @click="() => moveToSecurityTermOfService(tenantId)"
      />
    </div>
    <div
      v-if="!securityTermsOfServiceAccepted"
      class="text-warning mb-4"
      data-cy="security-contracts-threat-detection-shared-request-terms-of-service-message"
    >
      {{ t('threatDetectionShared.message.requiredSecurityAccepted') }}
    </div>

    <CollapseCardSwitch
      v-for="(req, i) in threatDetectionSharedRequestList"
      :key="req.requestId"
      :model-value="selectedRequestIdList.includes(req.requestId)"
      :title="`${t('threatDetectionShared.requestDetail') + (i + 1)}`"
      :disabled="
        req.status !== ThreatDetectionSharedRequestStatusTypes.PendingApproval ||
        req.requestType !== ThreatDetectionSharedRequestTypes.Start ||
        loading
      "
      :data-cy="`security-contracts-threat-detection-shared-request-${req.requestId}`"
      @update:model-value="value => handleSelectedChange(req.requestId, value)"
    >
      <DetailGrid>
        <div>{{ t('threatDetectionShared.requestId') }}</div>
        <div>{{ req.requestId }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('threatDetectionShared.receivedContractorName') }}</div>
        <div>{{ req.contractorName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.tenantId') }}</div>
        <div>{{ req.sharedTenantId }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('threatDetectionShared.billingMethod.label') }}</div>
        <div>{{ getBillingMethodText(req.billingMethod) || '-' }}</div>
      </DetailGrid>
      <InnerCard :title="t('threatDetectionShared.terminals')">
        <SeparatedTable :headers="tableHeaders" :items="getTableItems(req)" />
      </InnerCard>
    </CollapseCardSwitch>

    <div class="flex-flex-end-center ga-6 mt-4">
      <CustomButton
        :text="t('common.cancel')"
        color="info"
        icon="left-arrow"
        :width="180"
        data-cy="security-contracts-threat-detection-shared-request-cancel-button"
        @click="router.back()"
      />
      <CustomButton
        :text="isApproval ? t('threatDetectionShared.approve') : t('threatDetectionShared.reject')"
        :color="isApproval ? 'primary' : 'warning'"
        icon="right-arrow"
        :width="180"
        :disabled="selectedRequestIdList.length === 0 || loading"
        data-cy="security-contracts-threat-detection-shared-request-submit-button"
        @click="handleSubmit"
      />
    </div>
  </CardContainer>
</template>
