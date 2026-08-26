<script setup lang="ts">
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { OrderStatusTypes, BandwidthUnitTypes, TerminalTypes, DocumentServiceTypes } from '@/api/constants'
import {
  FieldSurveyResultTypes,
  ReserveStatusTypes,
  ConnectionTypes,
  FieldSurveyLessResultDrawingResendRequestTypes,
} from '@/api/guarantees/constants'
import type { GuaranteeFieldSurveyAndConstructionOrderPutRequest } from '@/api/guarantees/types'
import { CampaignTypes, CampaignResourceType } from '@/api/campaigns/constants'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenantId as string)
const guaranteeId = computed(() => route.params.id as string)

const { duringReceptionHours, getThresholdText, getDurationText, getNotificationIntervalText } = useGuarantees()
const { guarantee, editable, removable, getGuarantee } = useGetGuarantee()

const { updateGuaranteeOrder } = useUpdateGuaranteeOrder()
const { deleteDialog, deleteCampaign } = useDeleteCampaign()
const { campaigns, getCampaignList } = useGetCampaignList()
const { resourceSummaryTerminalList, getAllResourceSummaryTerminalList } = useGetAllResourceSummaryTerminalList()
const { inProgressSwitchover, getTerminal } = useGetTerminal()
const { disabledGuaranteeApplication } = useApplicationRestriction()

const moveToGuarantee = async (page: 'edit' | 'remove') => {
  await navigateTo({ path: `${route.path}/${page}` })
}

const extraRateLimit = computed(() => (guarantee.value?.physicalBandwidth === '100M' ? 10 : 100))
const internetRateLimit = computed(() => {
  const internetRateLimitCampaign = campaigns.value.find(
    campaign => campaign.campaignInfo?.networkType === ConnectionTypes.Internet,
  )
  const date = internetRateLimitCampaign?.expirationTime
    ? dayjs(internetRateLimitCampaign.expirationTime).format('YYYY年MM月DD日')
    : t('guarantees.undefinedExpirationTime')
  return internetRateLimitCampaign
    ? t('guarantees.rateLimitCampaignTextWithDate', {
        rateLimit: `${convertBandwidthToUnit(guarantee.value?.internet?.rateLimit ?? '', BandwidthUnitTypes.MB) - extraRateLimit.value}M`,
        extraRateLimit: extraRateLimit.value,
        date,
      })
    : guarantee.value?.internet?.rateLimit || ''
})
const vpnRateLimit = computed(() => {
  const vpnRateLimitCampaign = campaigns.value.find(
    campaign => campaign.campaignInfo?.networkType === ConnectionTypes.Vpn,
  )
  const date = vpnRateLimitCampaign?.expirationTime
    ? dayjs(vpnRateLimitCampaign.expirationTime).format('YYYY年MM月DD日')
    : t('guarantees.undefinedExpirationTime')
  return vpnRateLimitCampaign
    ? t('guarantees.rateLimitCampaignTextWithDate', {
        rateLimit: `${convertBandwidthToUnit(guarantee.value?.vpn?.rateLimit ?? '', BandwidthUnitTypes.MB) - extraRateLimit.value}M`,
        extraRateLimit: extraRateLimit.value,
        date,
      })
    : guarantee.value?.vpn?.rateLimit || ''
})

const openEditFieldSurveyAndConstructionDialog = ref(false)
const openEditFieldSurveyLessInfoDialog = ref(false)

const updateFieldSurveyLessInfoDisabled = computed(
  () =>
    guarantee.value?.fieldSurveyLessInfo?.drawingResendRequest !==
      FieldSurveyLessResultDrawingResendRequestTypes.Required || !duringReceptionHours.value,
)
const { handleUploadFieldSurveyLessFileDocument } = useUploadDocument(false)
const { setNotificationMessageState } = useNotificationDialog()
const handleEditFieldSurveyLessInfoSubmit = (data: { file: File }) => {
  openEditFieldSurveyLessInfoDialog.value = false
  handleUploadFieldSurveyLessFileDocument(data.file, DocumentServiceTypes.Guarantee, (id: string) => {
    if (!id) {
      // id が取得できなかった場合はアップロード失敗とみなす
      setNotificationMessageState({ message: t('fileUpload.uploadFailed') })
      return
    }
    if (guarantee.value?.orderId) {
      updateGuaranteeOrder(guarantee.value.orderId, {
        request: {
          fieldSurveyLessInfo: {
            fieldSurveyLessFileId: id,
          },
        },
      })
    }
  })
}

const reserveFieldSurveyConstructionDateDisabled = computed(
  () =>
    guarantee.value?.orderStatus !== OrderStatusTypes.Applied ||
    (guarantee.value?.fieldSurvey?.reserveStatus !== ReserveStatusTypes.Rejected &&
      guarantee.value?.construction?.reserveStatus !== ReserveStatusTypes.Rejected &&
      guarantee.value?.fieldSurveyResult !== FieldSurveyResultTypes.NG),
)
const handleEditFieldSurveyAndConstructionSubmit = (request: GuaranteeFieldSurveyAndConstructionOrderPutRequest) => {
  if (guarantee.value?.orderId) {
    updateGuaranteeOrder(guarantee.value.orderId, { request })
  }
  openEditFieldSurveyAndConstructionDialog.value = false
}

const terminalType = computed(
  () =>
    resourceSummaryTerminalList.value.terminals.find(terminal => terminal.terminalId === guarantee.value?.terminalId)
      ?.terminalType,
)

const reload = async () => {
  if (guaranteeId.value) {
    await getGuarantee(guaranteeId.value)
    getCampaignList({ resourceId: guaranteeId.value, campaignType: CampaignTypes.GuaranteeOneRankUp })
  }
  if (guarantee.value?.terminalId) {
    await getAllResourceSummaryTerminalList({ terminalId: [guarantee.value.terminalId] })
    // 迂回設定・レートリミットの判定用に getTerminal を実行する. データ取得前にボタンが活性化されないよう await で完了を待つ
    if (terminalType.value === TerminalTypes.Rental) {
      await getTerminal(guarantee.value.terminalId)
    }
  }
}
const handleDeleteCampaign = async () => {
  await deleteCampaign({
    campaignType: CampaignTypes.GuaranteeOneRankUp,
    resourceType: CampaignResourceType.Guarantee,
    resourceId: guaranteeId.value,
  })
  reload()
}

const intervalId = ref()
onBeforeMount(() => {
  reload()
  // 10分間隔でデータを再取得する
  intervalId.value = setInterval(() => reload(), 1000 * 60 * 10)
})
onUnmounted(() => {
  clearInterval(intervalId.value)
})
</script>

<template>
  <div>
    <GuaranteeAnchorButton class="mb-3" />
    <CardContainer>
      <GuaranteeDetail :guarantee="guarantee" :tenant-id="tenantId" :terminal-type="terminalType">
        <template #customer-note>
          <DetailGrid>
            <div>{{ t('guarantees.customerNote') }}</div>
            <div>{{ guarantee?.customerNote }}</div>
          </DetailGrid>
        </template>
        <template #rate-limit>
          <div class="mt-3 text-secondary text-lg">{{ t('guarantees.internet') }}</div>
          <DetailGrid>
            <div>{{ t('guarantees.rateLimit') }}</div>
            <div>{{ internetRateLimit }}</div>
          </DetailGrid>
          <div class="mt-3 ml-5">
            <div class="text-secondary text-lg">{{ t('guarantees.alertSetting') }}</div>
            <DetailGrid :label-width="270">
              <div>{{ t('guarantees.threshold') }}</div>
              <div>{{ getThresholdText(guarantee?.internet?.alertSetting?.threshold) }}</div>
            </DetailGrid>
            <DetailGrid :label-width="270">
              <div>{{ t('guarantees.duration') }}</div>
              <div>{{ getDurationText(guarantee?.internet?.alertSetting?.duration) }}</div>
            </DetailGrid>
            <DetailGrid :label-width="270">
              <div>{{ t('guarantees.notificationInterval') }}</div>
              <div>{{ getNotificationIntervalText(guarantee?.internet?.alertSetting?.notificationInterval) }}</div>
            </DetailGrid>
          </div>
          <div class="mt-3 text-secondary text-lg">{{ t('guarantees.vpn') }}</div>
          <DetailGrid>
            <div>{{ t('guarantees.rateLimit') }}</div>
            <div>{{ vpnRateLimit }}</div>
          </DetailGrid>
          <div class="mt-3 ml-5">
            <div class="text-secondary text-lg">{{ t('guarantees.alertSetting') }}</div>
            <DetailGrid :label-width="270">
              <div>{{ t('guarantees.threshold') }}</div>
              <div>{{ getThresholdText(guarantee?.vpn?.alertSetting?.threshold) }}</div>
            </DetailGrid>
            <DetailGrid :label-width="270">
              <div>{{ t('guarantees.duration') }}</div>
              <div>{{ getDurationText(guarantee?.vpn?.alertSetting?.duration) }}</div>
            </DetailGrid>
            <DetailGrid :label-width="270">
              <div>{{ t('guarantees.notificationInterval') }}</div>
              <div>{{ getNotificationIntervalText(guarantee?.vpn?.alertSetting?.notificationInterval) }}</div>
            </DetailGrid>
          </div>
        </template>
        <template #reserve-field-survey-construction-date-button>
          <div class="d-flex flex-column align-end">
            <div class="d-flex">
              <CustomButton
                v-if="!!guarantee?.fieldSurveyLess"
                class="mr-5"
                icon="right-arrow"
                :text="t('guarantees.updateFieldSurveyLessInfo')"
                :width="250"
                :disabled="updateFieldSurveyLessInfoDisabled"
                data-cy="guarantees-circuits-id-index-update-field-survey-less-info-button"
                @click="openEditFieldSurveyLessInfoDialog = true"
              />
              <CustomButton
                icon="right-arrow"
                :text="t('guarantees.reserveFieldSurveyConstructionDate')"
                :width="250"
                :disabled="!duringReceptionHours || reserveFieldSurveyConstructionDateDisabled"
                data-cy="guarantees-circuits-id-index-reserve-field-survey-construction-date-button"
                @click="openEditFieldSurveyAndConstructionDialog = true"
              />
            </div>
            <div
              v-if="!duringReceptionHours"
              class="text-warning text-pre-wrap"
              data-cy="guarantees-circuits-id-index-reserve-field-survey-construction-date-outside-reception-hour"
            >
              {{ t('guarantees.outsideReceptionHour') }}
            </div>
          </div>
        </template>
        <template #reserve-removal-date-button>
          <div class="d-flex flex-column align-end">
            <CustomButton
              class="d-flex justify-end"
              icon="right-arrow"
              :text="t('guarantees.reserveRemovalDate')"
              :width="250"
              :disabled="!duringReceptionHours || !removable || disabledGuaranteeApplication"
              data-cy="guarantees-circuits-id-index-reserve-removal-date-button"
              @click="moveToGuarantee('remove')"
            />
            <div
              v-if="!duringReceptionHours"
              class="text-warning text-pre-wrap"
              data-cy="guarantees-circuits-id-index-reserve-removal-date-outside-reception-hour"
            >
              {{ t('guarantees.outsideReceptionHour') }}
            </div>
          </div>
        </template>
      </GuaranteeDetail>
      <div class="grid-flow-col justify-end ga-4">
        <CustomButton color="info" icon="left-arrow" :text="t('common.return')" :width="180" @click="router.back()" />
        <CustomButton
          color="warning"
          icon="right-arrow"
          :text="t('common.delete')"
          :width="180"
          :disabled="!editable || inProgressSwitchover || disabledGuaranteeApplication"
          data-cy="guarantees-circuits-id-index-delete-button"
          @click="moveToGuarantee('remove')"
        />
        <CustomButton
          icon="right-arrow"
          :text="t('common.edit')"
          :width="180"
          :disabled="!editable"
          data-cy="guarantees-circuits-id-index-edit-button"
          @click="moveToGuarantee('edit')"
        />
        <CustomButton
          v-if="campaigns.length > 0"
          icon="right-arrow"
          :width="230"
          :text="t('campaign.quitCampaign')"
          :disabled="!editable"
          data-cy="guarantees-circuits-id-quit-campaign-button"
          @click="deleteDialog = true"
        />
      </div>
    </CardContainer>
    <EditFieldSurveyAndConstructionDialog
      v-if="guarantee"
      :open="openEditFieldSurveyAndConstructionDialog"
      :guarantee="guarantee"
      @submit="handleEditFieldSurveyAndConstructionSubmit"
      @close="openEditFieldSurveyAndConstructionDialog = false"
    />
    <EditFieldSurveyLessInfoDialog
      :open="openEditFieldSurveyLessInfoDialog"
      :tenant-id="tenantId"
      @submit="handleEditFieldSurveyLessInfoSubmit"
      @close="openEditFieldSurveyLessInfoDialog = false"
    />
    <GuaranteeCampaignDeleteDialog
      :open="deleteDialog"
      :extra-rate-limit="extraRateLimit"
      @submit="handleDeleteCampaign"
      @close="deleteDialog = false"
    />
  </div>
</template>

<style lang="scss" scoped>
.grid-flow-col {
  display: grid;
  grid-auto-flow: column;
}
</style>
