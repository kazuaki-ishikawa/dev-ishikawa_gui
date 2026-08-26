<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { GuaranteePostRequest } from '@/api/guarantees/types'

type PropType = {
  request: GuaranteePostRequest
}
defineProps<PropType>()
const { t } = useI18n()

const { getTimeText } = useHikariCollaboUtils()
const { getCommunicationModeText, getNecessaryText, getThresholdText, getDurationText, getNotificationIntervalText } =
  useGuarantees()
</script>

<template>
  <div>
    <InnerCard :title="t('guarantees.basicInformation')">
      <DetailGrid>
        <div>{{ t('guarantees.customerNote') }}</div>
        <div>{{ request.customerNote }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('guarantees.physicalBandwidth') }}</div>
        <div>{{ request.physicalBandwidth }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('guarantees.interface') }}</div>
        <div>{{ request.userInterfaceType }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('guarantees.communicationMode') }}</div>
        <div>{{ getCommunicationModeText(request?.communicationMode) }}</div>
      </DetailGrid>
      <div class="mt-3 text-secondary text-lg">{{ t('guarantees.internet') }}</div>
      <DetailGrid>
        <div>{{ t('guarantees.rateLimit') }}</div>
        <div>{{ request.internet?.rateLimit }}</div>
      </DetailGrid>
      <div class="mt-3 ml-5">
        <div class="text-secondary text-lg">{{ t('guarantees.alertSetting') }}</div>
        <DetailGrid :label-width="270">
          <div>{{ t('guarantees.threshold') }}</div>
          <div>{{ getThresholdText(request.internet?.alertSetting?.threshold) }}</div>
        </DetailGrid>
        <DetailGrid :label-width="270">
          <div>{{ t('guarantees.duration') }}</div>
          <div>{{ getDurationText(request.internet?.alertSetting?.duration) }}</div>
        </DetailGrid>
        <DetailGrid :label-width="270">
          <div>{{ t('guarantees.notificationInterval') }}</div>
          <div>{{ getNotificationIntervalText(request.internet?.alertSetting?.notificationInterval) }}</div>
        </DetailGrid>
      </div>
      <div class="mt-3 text-secondary text-lg">{{ t('guarantees.vpn') }}</div>
      <DetailGrid>
        <div>{{ t('guarantees.rateLimit') }}</div>
        <div>{{ request.vpn?.rateLimit }}</div>
      </DetailGrid>
      <div class="mt-3 ml-5">
        <div class="text-secondary text-lg">{{ t('guarantees.alertSetting') }}</div>
        <DetailGrid :label-width="270">
          <div>{{ t('guarantees.threshold') }}</div>
          <div>{{ getThresholdText(request.vpn?.alertSetting?.threshold) }}</div>
        </DetailGrid>
        <DetailGrid :label-width="270">
          <div>{{ t('guarantees.duration') }}</div>
          <div>{{ getDurationText(request.vpn?.alertSetting?.duration) }}</div>
        </DetailGrid>
        <DetailGrid :label-width="270">
          <div>{{ t('guarantees.notificationInterval') }}</div>
          <div>{{ getNotificationIntervalText(request.vpn?.alertSetting?.notificationInterval) }}</div>
        </DetailGrid>
      </div>
      <DetailGrid>
        <div>{{ t('guarantees.installationPlaceCode') }}</div>
        <div>{{ request.installationPlaceCode }}</div>
      </DetailGrid>
    </InnerCard>
    <InnerCard :title="t('guarantees.fieldSurveyDetailsInformation')">
      <DetailGrid>
        <div>{{ t('guarantees.fieldSurveyLess') }}</div>
        <div>
          <CheckboxBase :value="!!request?.fieldSurveyLess" disabled />
        </div>
      </DetailGrid>
      <template v-if="request.fieldSurveyLess">
        <DetailGrid>
          <div>{{ t('guarantees.fieldSurveyLessFileId') }}</div>
          <div>{{ request.fieldSurveyLessInfo?.fieldSurveyLessFileId }}</div>
        </DetailGrid>
      </template>
      <DetailGrid>
        <div>{{ t('guarantees.admissionApplicationRequired') }}</div>
        <div>{{ getNecessaryText(request.fieldSurvey?.admissionApplicationRequired) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('guarantees.reserveDate') }}</div>
        <div class="ga-2">
          <span> {{ formatDate(request.fieldSurvey?.date) }} </span>
          <span> {{ getTimeText(request.fieldSurvey?.time ?? '') }} </span>
        </div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('guarantees.operationAdjustmentSpecifiedVisitDateTime') }}</div>
        <div>
          <CheckboxBase :value="!!request.fieldSurvey?.operationAdjustment" disabled />
        </div>
      </DetailGrid>
      <div class="pt-3 text-lg text-secondary">{{ t('guarantees.preContact') }}</div>
      <DetailGrid>
        <div>{{ t('guarantees.preContactCompanyName') }}</div>
        <div>{{ request.fieldSurvey?.preContactCompanyName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('guarantees.preContactPersonName') }}</div>
        <div>{{ request.fieldSurvey?.preContactPersonName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('guarantees.preContactPhoneNumber') }}</div>
        <div>{{ request.fieldSurvey?.preContactPhoneNumber }}</div>
      </DetailGrid>
      <div class="pt-3 text-lg text-secondary">{{ t('guarantees.attendanceInformation') }}</div>
      <DetailGrid>
        <div>{{ t('guarantees.attendanceCompanyName') }}</div>
        <div>{{ request.fieldSurvey?.attendanceCompanyName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('guarantees.attendancePersonName') }}</div>
        <div>{{ request.fieldSurvey?.attendancePersonName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('guarantees.attendancePhoneNumber') }}</div>
        <div>{{ request.fieldSurvey?.attendancePhoneNumber }}</div>
      </DetailGrid>
    </InnerCard>
    <InnerCard :title="t('guarantees.constructionDetailsInformation')">
      <DetailGrid>
        <div>{{ t('guarantees.admissionApplicationRequired') }}</div>
        <div>{{ getNecessaryText(request.construction?.admissionApplicationRequired) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('guarantees.reserveDate') }}</div>
        <div class="ga-2">
          <span> {{ formatDate(request.construction?.date) }} </span>
          <span> {{ getTimeText(request.construction?.time ?? '') }} </span>
        </div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('guarantees.operationAdjustmentSpecifiedVisitDateTime') }}</div>
        <div>
          <CheckboxBase :value="!!request.construction?.operationAdjustment" disabled />
        </div>
      </DetailGrid>
      <div class="pt-3 text-lg text-secondary">{{ t('guarantees.preContact') }}</div>
      <DetailGrid>
        <div>{{ t('guarantees.preContactCompanyName') }}</div>
        <div>{{ request.construction?.preContactCompanyName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('guarantees.preContactPersonName') }}</div>
        <div>{{ request.construction?.preContactPersonName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('guarantees.preContactPhoneNumber') }}</div>
        <div>{{ request.construction?.preContactPhoneNumber }}</div>
      </DetailGrid>
      <div class="pt-3 text-lg text-secondary">{{ t('guarantees.attendanceInformation') }}</div>
      <DetailGrid>
        <div>{{ t('guarantees.attendanceCompanyName') }}</div>
        <div>{{ request.construction?.attendanceCompanyName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('guarantees.attendancePersonName') }}</div>
        <div>{{ request.construction?.attendancePersonName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('guarantees.attendancePhoneNumber') }}</div>
        <div>{{ request.construction?.attendancePhoneNumber }}</div>
      </DetailGrid>
    </InnerCard>
  </div>
</template>
