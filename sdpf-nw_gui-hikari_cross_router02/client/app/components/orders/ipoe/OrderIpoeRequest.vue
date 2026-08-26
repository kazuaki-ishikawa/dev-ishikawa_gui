<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import type {
  FletsSeparatePostRequest,
  FletsSeparatePutRequest,
  HikariCollaboPostRequest,
  HikariCollaboPutRequest,
  HikariCollaboDeleteRequest,
} from '@/api/ipoes/types'
import type { HikariCollaboDiversionRequest } from '@/api/hikariCollaboUtil/types'
import { OrderRequestTypes } from '@/api/orders/constants'
import type { OrderRequestType } from '@/api/orders/types'

type PropType = {
  request:
    | FletsSeparatePostRequest
    | FletsSeparatePutRequest
    | HikariCollaboPostRequest
    | HikariCollaboPutRequest
    | HikariCollaboDeleteRequest
    | HikariCollaboDiversionRequest
    | null
  requestType: OrderRequestType
}
defineProps<PropType>()
const { t } = useI18n()

const { getIpoeTypeText, getExistText } = useIpoes()
const { getDiversionContractTypeText } = useHikariCollaboUtils()
</script>

<template>
  <div v-if="!!request">
    <InnerCard :title="t('orders.request')">
      <!-- 新規作成 -->
      <OrderFletsSeparate v-if="'fletsOpen' in request" :request="request" />
      <OrderHikariCollaboNew v-else-if="'fletsOrderType' in request" :request="request" />
      <!-- 転用 -->
      <template v-else-if="'diversionNumber' in request">
        <DetailGrid>
          <div>{{ t('ipoes.diversionNumber') }}</div>
          <div>{{ request.diversionNumber }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.diversionDate') }}</div>
          <div>{{ formatDate(request.diversionDate) }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.contractType') }}</div>
          <div>{{ getDiversionContractTypeText(request.contractInfo.contractType) }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.contractorName') }}</div>
          <div>{{ request.contractInfo.contractorName }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.contractorNameKana') }}</div>
          <div>{{ request.contractInfo.contractorNameKana }}</div>
        </DetailGrid>
      </template>
      <!-- 更新 -->
      <template v-else-if="requestType === OrderRequestTypes.Update">
        <DetailGrid v-if="'customerNote' in request">
          <div>{{ t('ipoes.customerNote') }}</div>
          <div>{{ request.customerNote }}</div>
        </DetailGrid>
        <DetailGrid v-if="'ipoeType' in request">
          <div>{{ t('ipoes.ipoeType') }}</div>
          <div>{{ getIpoeTypeText(request?.ipoeType) }}</div>
        </DetailGrid>
        <DetailGrid v-if="'appControl' in request">
          <div>{{ t('ipoes.appControl') }}</div>
          <div>{{ getExistText(request?.appControl) }}</div>
        </DetailGrid>
        <DetailGrid v-if="'onSiteRepairOption' in request">
          <div>{{ t('ipoes.onSiteRepairOption') }}</div>
          <div>{{ getExistText(request?.onSiteRepairOption) }}</div>
        </DetailGrid>
        <DetailGrid v-if="'changeEffectiveDate' in request">
          <div>{{ t('ipoes.changeEffectiveDate') }}</div>
          <div>{{ request?.changeEffectiveDate }}</div>
        </DetailGrid>
      </template>

      <!-- 廃止 -->
      <OrderIpoeRemove v-else-if="'collectType' in request" :request="request" />
    </InnerCard>
  </div>
</template>
