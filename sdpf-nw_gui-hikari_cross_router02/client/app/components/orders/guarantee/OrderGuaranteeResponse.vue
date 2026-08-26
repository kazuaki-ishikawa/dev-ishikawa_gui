<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { GuaranteeResponse } from '@/api/guarantees/types'

type PropType = {
  response: GuaranteeResponse
  tenantId: string
}
const props = defineProps<PropType>()
const { t } = useI18n()
const guaranteeId = computed(() => props.response.guaranteeId)

const { getThresholdText, getDurationText, getNotificationIntervalText } = useGuarantees()
const { downloadGuaranteeDocument } = useDownloadGuaranteeDocument()

const handleFieldSurveyReportClick = () => {
  downloadGuaranteeDocument({ guaranteeId: guaranteeId.value, query: { documentType: 'fieldSurveyReport' } })
}
</script>

<template>
  <GuaranteeDetail :guarantee="response" :tenant-id="tenantId" is-order>
    <template #customer-note>
      <DetailGrid>
        <div>{{ t('guarantees.customerNote') }}</div>
        <div>{{ response.customerNote }}</div>
      </DetailGrid>
    </template>
    <template #rate-limit>
      <div class="mt-3 text-secondary text-lg">{{ t('guarantees.internet') }}</div>
      <DetailGrid>
        <div>{{ t('guarantees.rateLimit') }}</div>
        <div>{{ response.internet?.rateLimit }}</div>
      </DetailGrid>
      <div class="mt-3 ml-5">
        <div class="text-secondary text-lg">{{ t('guarantees.alertSetting') }}</div>
        <DetailGrid :label-width="270">
          <div>{{ t('guarantees.threshold') }}</div>
          <div>{{ getThresholdText(response.internet?.alertSetting?.threshold) }}</div>
        </DetailGrid>
        <DetailGrid :label-width="270">
          <div>{{ t('guarantees.duration') }}</div>
          <div>{{ getDurationText(response.internet?.alertSetting?.duration) }}</div>
        </DetailGrid>
        <DetailGrid :label-width="270">
          <div>{{ t('guarantees.notificationInterval') }}</div>
          <div>{{ getNotificationIntervalText(response.internet?.alertSetting?.notificationInterval) }}</div>
        </DetailGrid>
      </div>
      <div class="mt-3 text-secondary text-lg">{{ t('guarantees.vpn') }}</div>
      <DetailGrid>
        <div>{{ t('guarantees.rateLimit') }}</div>
        <div>{{ response.vpn?.rateLimit }}</div>
      </DetailGrid>
      <div class="mt-3 ml-5">
        <div class="text-secondary text-lg">{{ t('guarantees.alertSetting') }}</div>
        <DetailGrid :label-width="270">
          <div>{{ t('guarantees.threshold') }}</div>
          <div>{{ getThresholdText(response.vpn?.alertSetting?.threshold) }}</div>
        </DetailGrid>
        <DetailGrid :label-width="270">
          <div>{{ t('guarantees.duration') }}</div>
          <div>{{ getDurationText(response.vpn?.alertSetting?.duration) }}</div>
        </DetailGrid>
        <DetailGrid :label-width="270">
          <div>{{ t('guarantees.notificationInterval') }}</div>
          <div>{{ getNotificationIntervalText(response.vpn?.alertSetting?.notificationInterval) }}</div>
        </DetailGrid>
      </div>
    </template>
    <template #reserve-field-survey-construction-date-button>
      <div class="flex-center-center">
        <CustomButton
          icon="right-arrow"
          :text="t('guarantees.fieldSurveyReport')"
          :width="230"
          class="ml-2"
          @click="handleFieldSurveyReportClick"
        />
      </div>
    </template>
  </GuaranteeDetail>
</template>
