<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { MsbPostResponse, MsbPatchResponse, MsbDeleteResponse, MsbLicensesResponse } from '@/api/msb/types'

type PropType = {
  msb: MsbPostResponse | MsbPatchResponse | MsbDeleteResponse | MsbLicensesResponse
  isOrder?: boolean
}
const props = defineProps<PropType>()
const { t } = useI18n()
const { getMsbLicensePackList } = useMsb()

const resourceIdLink = `/tenants/${props.msb.tenantId}/msb/${props.msb.resourceId}`
</script>

<template>
  <!-- オーダー画面かつdepartmentNameが存在するときのみお客様情報を表示 -->
  <InnerCard v-if="isOrder && 'departmentName' in msb" :title="t('msb.customerInformation')">
    <DetailGrid>
      <div>{{ t('msb.departmentName') }}</div>
      <div>{{ msb.departmentName }}</div>
    </DetailGrid>
    <DetailGrid v-if="'customerType' in msb">
      <div>{{ t('msb.customerType') }}</div>
      <div>{{ t(`msb.customerTypes.${msb.customerType}`) }}</div>
    </DetailGrid>
    <DetailGrid v-if="'emailAddress' in msb">
      <div>{{ t('msb.emailAddress') }}</div>
      <div>{{ msb.emailAddress }}</div>
    </DetailGrid>
    <DetailGrid v-if="'customerSpecialNote' in msb">
      <div>{{ t('msb.customerSpecialNote') }}</div>
      <div>{{ msb.customerSpecialNote }}</div>
    </DetailGrid>
  </InnerCard>
  <InnerCard
    v-if="'licensePacks' in msb"
    :title="t('msb.applicationLicenseInformation')"
    data-cy="msb-detail-application-license-information-section"
  >
    <template v-for="msbLicensePack in getMsbLicensePackList(msb.licensePacks)" :key="msbLicensePack.key">
      <DetailGrid>
        <div>{{ msbLicensePack.label }}</div>
        <div>{{ msbLicensePack.value }}</div>
      </DetailGrid>
    </template>
  </InnerCard>
  <InnerCard v-if="isOrder" :title="t('msb.orderInformation')">
    <DetailGrid v-if="'orderId' in msb">
      <div>{{ t('details.orderId') }}</div>
      <div>{{ msb.orderId }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('details.tenantId') }}</div>
      <div>{{ msb.tenantId }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('orders.resourceId') }}</div>
      <NuxtLink :to="resourceIdLink">{{ msb.resourceId }}</NuxtLink>
    </DetailGrid>
  </InnerCard>
</template>
