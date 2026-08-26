<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type {
  PhoneTicketingSupportPostRequest,
  PhoneTicketingSupportPutRequest,
  PhoneTicketingSupportDeleteRequest,
} from '@/api/phoneTicketingSupport/types'
import { OrderRequestTypes } from '@/api/orders/constants'
import type { OrderRequestType } from '@/api/orders/types'

type PropType = {
  request: PhoneTicketingSupportPostRequest | PhoneTicketingSupportPutRequest | PhoneTicketingSupportDeleteRequest
  requestType: OrderRequestType
}
const props = defineProps<PropType>()
const { t } = useI18n()
const isCreate = computed(() => props.requestType === OrderRequestTypes.Create)
const isUpdate = computed(() => props.requestType === OrderRequestTypes.Update)
const isDelete = computed(() => props.requestType === OrderRequestTypes.Delete)
const effectiveDateLabel = computed(() => {
  if (isCreate.value || isUpdate.value) {
    return t('details.serviceStartDate')
  } else {
    return t('details.serviceEndDate')
  }
})
</script>

<template>
  <InnerCard :title="t('orders.request')">
    <DetailGrid v-if="!isDelete">
      <div>{{ t('phoneTicketingSupport.picName') }}</div>
      <div>{{ (request as PhoneTicketingSupportPostRequest | PhoneTicketingSupportPutRequest).picName }}</div>
    </DetailGrid>
    <DetailGrid v-if="!isDelete">
      <div>{{ t('phoneTicketingSupport.picPhoneNumber') }}</div>
      <div>
        {{ (request as PhoneTicketingSupportPostRequest | PhoneTicketingSupportPutRequest).picPhoneNumber }}
      </div>
    </DetailGrid>
    <DetailGrid v-if="!isUpdate">
      <div>{{ effectiveDateLabel }}</div>
      <div>
        {{
          formatDate((request as PhoneTicketingSupportPostRequest | PhoneTicketingSupportDeleteRequest).effectiveDate)
        }}
      </div>
    </DetailGrid>
  </InnerCard>
</template>
