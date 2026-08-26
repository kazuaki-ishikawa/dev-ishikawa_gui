<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { GuaranteePostRequest, GuaranteePutRequest, GuaranteeDeleteRequest } from '@/api/guarantees/types'
import { OrderRequestTypes } from '@/api/orders/constants'
import type { OrderRequestType } from '@/api/orders/types'

type PropType = {
  request: GuaranteePostRequest | GuaranteePutRequest | GuaranteeDeleteRequest
  requestType: OrderRequestType
}
defineProps<PropType>()
const { t } = useI18n()

const { getTimeText } = useHikariCollaboUtils()
const { getNecessaryText, getThresholdText, getDurationText, getNotificationIntervalText } = useGuarantees()
</script>

<template>
  <InnerCard :title="t('orders.request')">
    <!-- 廃止 -->
    <template v-if="'removal' in request">
      <DetailGrid>
        <div>{{ t('guarantees.admissionApplicationRequired') }}</div>
        <div>{{ getNecessaryText(request.removal?.admissionApplicationRequired) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('guarantees.reserveDate') }}</div>
        <div class="ga-2">
          <span> {{ formatDate(request.removal?.date) }} </span>
          <span> {{ getTimeText(request.removal?.time ?? '') }} </span>
        </div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('guarantees.operationAdjustment') }}</div>
        <div>
          <CheckboxBase :value="!!request.removal?.operationAdjustment" disabled />
        </div>
      </DetailGrid>
      <div class="pt-3 text-lg text-secondary">{{ t('guarantees.preContact') }}</div>
      <DetailGrid>
        <div>{{ t('guarantees.preContactCompanyName') }}</div>
        <div>{{ request.removal?.preContactCompanyName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('guarantees.preContactPersonName') }}</div>
        <div>{{ request.removal?.preContactPersonName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('guarantees.preContactPhoneNumber') }}</div>
        <div>{{ request.removal?.preContactPhoneNumber }}</div>
      </DetailGrid>
      <div class="pt-3 text-lg text-secondary">{{ t('guarantees.attendanceInformation') }}</div>
      <DetailGrid>
        <div>{{ t('guarantees.attendanceCompanyName') }}</div>
        <div>{{ request.removal?.attendanceCompanyName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('guarantees.attendancePersonName') }}</div>
        <div>{{ request.removal?.attendancePersonName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('guarantees.attendancePhoneNumber') }}</div>
        <div>{{ request.removal?.attendancePhoneNumber }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('guarantees.admissionApplicationRequired') }}</div>
        <div>{{ getNecessaryText(request.removal?.admissionApplicationRequired) }}</div>
      </DetailGrid>
    </template>

    <!-- 更新 -->
    <template v-else-if="requestType === OrderRequestTypes.Update">
      <DetailGrid>
        <div>{{ t('guarantees.customerNote') }}</div>
        <div>{{ request.customerNote }}</div>
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
    </template>

    <!-- 新規作成 -->
    <OrderGuaranteeCreateRequest
      v-else-if="requestType === OrderRequestTypes.Create && 'installationPlaceCode' in request"
      :request="request"
    />
  </InnerCard>
</template>
