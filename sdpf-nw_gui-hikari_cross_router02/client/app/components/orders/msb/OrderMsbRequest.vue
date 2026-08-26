<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import type { MsbPostRequest, MsbPatchRequest, MsbDeleteRequest } from '@/api/msb/types'
import { OrderRequestTypes } from '@/api/orders/constants'
import type { OrderRequestType } from '@/api/orders/types'

type PropType = {
  requestType: OrderRequestType
  request: MsbPostRequest | MsbPatchRequest | MsbDeleteRequest
}
const props = defineProps<PropType>()

const { t } = useI18n()

const createRequest = computed(() => props.request as MsbPostRequest)
const updateRequest = computed(() => props.request as MsbPatchRequest)
const deleteRequest = computed(() => props.request as MsbDeleteRequest)
</script>

<template>
  <div v-if="!!request">
    <InnerCard :title="t('orders.request')">
      <!-- 新規作成 -->
      <OrderMsbCreateRequest v-if="requestType === OrderRequestTypes.Create" :request="createRequest" />
      <!-- 更新 -->
      <OrderMsbUpdateRequest v-else-if="requestType === OrderRequestTypes.Update" :request="updateRequest" />
      <!-- 削除 -->
      <OrderMsbRemoveRequest v-else-if="requestType === OrderRequestTypes.Delete" :request="deleteRequest" />
    </InnerCard>
  </div>
</template>
