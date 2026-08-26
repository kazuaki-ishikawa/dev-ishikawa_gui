<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import type { ContractorPutRequest } from '@/api/contractor/types'

type PropType = {
  request: ContractorPutRequest
}
defineProps<PropType>()
const { t } = useI18n()
</script>

<template>
  <InnerCard :title="t('orders.request')">
    <DetailGrid>
      <div>{{ t('contractor.name') }}</div>
      <div>{{ request.name }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('contractor.nameKana') }}</div>
      <div>{{ request.nameKana }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('terminals.picName') }}</div>
      <div>{{ request.picName }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('terminals.picNameKana') }}</div>
      <div>{{ request.picNameKana }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('contractor.addressCode') }}</div>
      <div>{{ request?.addressCode }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('contractor.postalCode') }}</div>
      <div>{{ request.postalCode }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('contractor.address') }}</div>
      <div>{{ request.address }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('contractor.houseNumber') }}</div>
      <div>{{ request?.houseNumber }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('contractor.buildingName') }}</div>
      <div>{{ request?.buildingName }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('contractor.addressKana') }}</div>
      <div>{{ request.addressKana }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('contractor.phoneNumber') }}</div>
      <div>{{ request.phoneNumber }}</div>
    </DetailGrid>
  </InnerCard>
</template>
