<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { PhoneTicketingSupportResponse } from '@/api/phoneTicketingSupport/types'

type PropType = {
  phoneTicketingSupport: PhoneTicketingSupportResponse | null
  status: (typeof PhoneTicketingSupportStatus)[keyof typeof PhoneTicketingSupportStatus]
  tenantId: string
  isOrder?: boolean
}
const props = defineProps<PropType>()
const { t } = useI18n()
const { getOrderIdLink, orderStatusTypeTranslation } = useOrders()
const showContent = computed(() => props.status !== PhoneTicketingSupportStatus.Deleted)
</script>

<template>
  <DetailGrid>
    <div>{{ t('phoneTicketingSupport.supportId') }}</div>
    <div data-cy="phone-ticketing-support-detail-support-id">
      {{ showContent ? phoneTicketingSupport?.supportId : '' }}
    </div>
  </DetailGrid>
  <DetailGrid>
    <div>{{ t('phoneTicketingSupport.supportUsage') }}</div>
    <div>
      {{ phoneTicketingSupport?.enabled ? t('phoneTicketingSupport.enabled') : t('phoneTicketingSupport.disabled') }}
    </div>
  </DetailGrid>
  <DetailGrid>
    <div>
      {{
        status === PhoneTicketingSupportStatus.Deleting ? t('details.serviceEndDate') : t('details.serviceStartDate')
      }}
    </div>
    <div data-cy="phone-ticketing-support-detail-effective-date">
      {{ showContent ? formatDate(phoneTicketingSupport?.effectiveDate) : '' }}
    </div>
  </DetailGrid>
  <DetailGrid>
    <div>{{ t('phoneTicketingSupport.picName') }}</div>
    <div data-cy="phone-ticketing-support-detail-pic-name">{{ showContent ? phoneTicketingSupport?.picName : '' }}</div>
  </DetailGrid>
  <DetailGrid>
    <div>{{ t('phoneTicketingSupport.picPhoneNumber') }}</div>
    <div data-cy="phone-ticketing-support-detail-pic-phone-number">
      {{ showContent ? phoneTicketingSupport?.picPhoneNumber : '' }}
    </div>
  </DetailGrid>
  <DetailGrid>
    <div>{{ t('phoneTicketingSupport.supportPhoneNumber') }}</div>
    <div data-cy="phone-ticketing-support-detail-support-phone-number">
      {{ showContent ? phoneTicketingSupport?.supportPhoneNumber : '' }}
    </div>
  </DetailGrid>
  <DetailGrid>
    <div>{{ t('details.orderId') }}</div>
    <div data-cy="phone-ticketing-support-detail-order-id">
      <NuxtLink v-if="showContent" :to="getOrderIdLink({ tenantId, orderId: phoneTicketingSupport?.orderId })">
        {{ phoneTicketingSupport?.orderId }}
      </NuxtLink>
    </div>
  </DetailGrid>
  <DetailGrid v-if="phoneTicketingSupport?.orderStatus && !isOrder">
    <div>{{ t('details.orderStatus') }}</div>
    <div>
      {{ showContent ? orderStatusTypeTranslation[phoneTicketingSupport.orderStatus] : '' }}
    </div>
  </DetailGrid>
</template>
