<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  ThreatDetectionSharedRequestStatusTypes,
  ThreatDetectionSharedRequestTypes,
  ThreatDetectionSharedRequestDirectionTypes,
  ThreatDetectionSharedRequestActionTypes,
} from '@/api/threatDetectionShared/constants'
import type { ThreatDetectionSharedRequestActionType } from '@/api/threatDetectionShared/types'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const requestId = computed(() => route.params.id as string)

const { loading } = useLoading()
const { setNotificationMessageState } = useNotificationDialog()

const { contractor, getContractor } = useGetContractor()
const { threatDetectionSharedRequest, getThreatDetectionSharedRequest } = useGetThreatDetectionSharedRequest()
const { putThreatDetectionSharedRequest } = usePutThreatDetectionSharedRequest()
const { deleteThreatDetectionSharedRequest } = useDeleteThreatDetectionSharedRequest()

const isStartRequestPendingApproval = computed(
  () =>
    threatDetectionSharedRequest.value?.requestType === ThreatDetectionSharedRequestTypes.Start &&
    threatDetectionSharedRequest.value?.status === ThreatDetectionSharedRequestStatusTypes.PendingApproval,
)
const isReceived = computed(
  () => threatDetectionSharedRequest.value?.requestDirection === ThreatDetectionSharedRequestDirectionTypes.Received,
)

const handleRequestUpdate = async (action?: ThreatDetectionSharedRequestActionType) => {
  if (action) {
    threatDetectionSharedRequest.value = await putThreatDetectionSharedRequest({
      requestId: requestId.value,
      request: { action },
    })
    const message =
      action === ThreatDetectionSharedRequestActionTypes.Approve
        ? t('threatDetectionShared.message.approved')
        : t('threatDetectionShared.message.rejected')
    setNotificationMessageState({ message })
  } else {
    threatDetectionSharedRequest.value = await deleteThreatDetectionSharedRequest(requestId.value)
  }
}

onBeforeMount(() => {
  getThreatDetectionSharedRequest(requestId.value)
  getContractor()
})
</script>

<template>
  <CardContainer>
    <RequestDetail :request="threatDetectionSharedRequest" :contractor="contractor" />

    <div class="mt-4 flex-flex-end-center ga-6">
      <CustomButton
        :width="180"
        icon="left-arrow"
        color="info"
        :text="t('common.return')"
        data-cy="security-contracts-threat-detection-shared-id-return-button"
        @click="router.back()"
      />
      <template v-if="isReceived && isStartRequestPendingApproval">
        <CustomButton
          :width="180"
          icon="right-arrow"
          color="warning"
          :text="t('threatDetectionShared.reject')"
          :disabled="loading"
          data-cy="security-contracts-threat-detection-shared-id-reject-button"
          @click="handleRequestUpdate(ThreatDetectionSharedRequestActionTypes.Reject)"
        />
        <CustomButton
          :width="180"
          icon="right-arrow"
          :text="t('threatDetectionShared.approve')"
          :disabled="loading"
          data-cy="security-contracts-threat-detection-shared-id-approve-button"
          @click="handleRequestUpdate(ThreatDetectionSharedRequestActionTypes.Approve)"
        />
      </template>
      <CustomButton
        v-if="!isReceived && isStartRequestPendingApproval"
        :width="180"
        icon="right-arrow"
        color="warning"
        :text="t('threatDetectionShared.cancel')"
        :disabled="loading"
        data-cy="security-contracts-threat-detection-shared-id-cancel-button"
        @click="handleRequestUpdate()"
      />
    </div>
  </CardContainer>
</template>
