<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ContractorResponse } from '@/api/contractor/types'

type PropType = {
  contractor?: ContractorResponse
  tenantId: string
}
const props = defineProps<PropType>()
const { t } = useI18n()
const { getOrderIdLink } = useOrders()
const orderIdLink = computed(() => getOrderIdLink({ tenantId: props.tenantId, orderId: props.contractor?.orderId }))
</script>

<template>
  <div>
    <DetailGrid>
      <div>{{ t('details.orderId') }}</div>
      <NuxtLink :to="orderIdLink"> {{ contractor?.orderId }}</NuxtLink>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('contractor.name') }}</div>
      <div>{{ contractor?.name }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('contractor.nameKana') }}</div>
      <div>{{ contractor?.nameKana }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('terminals.picName') }}</div>
      <div>{{ contractor?.picName }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('terminals.picNameKana') }}</div>
      <div>{{ contractor?.picNameKana }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('contractor.addressCode') }}</div>
      <div>{{ contractor?.addressCode }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('contractor.postalCode') }}</div>
      <div>{{ contractor?.postalCode }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('contractor.address') }}</div>
      <div>{{ contractor?.address }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('contractor.houseNumber') }}</div>
      <div>{{ contractor?.houseNumber }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('contractor.buildingName') }}</div>
      <div>{{ contractor?.buildingName }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('contractor.addressKana') }}</div>
      <div>{{ contractor?.addressKana }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('contractor.phoneNumber') }}</div>
      <div>{{ contractor?.phoneNumber }}</div>
    </DetailGrid>
  </div>
</template>
