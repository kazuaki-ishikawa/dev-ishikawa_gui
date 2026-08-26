<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { RegistrationAddressResponse } from '@/api/iwanUtil/types'

type PropType = {
  response: RegistrationAddressResponse
}
defineProps<PropType>()
const { t } = useI18n()
</script>

<template>
  <div>
    <div class="text-secondary text-lg mt-3">{{ t('addressRegistrationRequest.resourceInformation') }}</div>
    <DetailGrid>
      <div>{{ t('details.tenantId') }}</div>
      <div>{{ response?.tenantId }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('details.orderId') }}</div>
      <div>{{ response?.orderId }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('details.updateTime') }}</div>
      <div>{{ formatDateTime(response?.updateTime) }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('details.serviceStartTime') }}</div>
      <div>{{ formatDateTime(response?.serviceStartTime) }}</div>
    </DetailGrid>

    <div class="text-secondary text-lg mt-3">{{ t('addressRegistrationRequest.installationInformation') }}</div>
    <DetailGrid>
      <div>{{ t('ipoes.postalCode') }}</div>
      <div>{{ response.postalCode }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('addressRegistrationRequest.prefecture') }}</div>
      <div>{{ response.prefecture }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('ipoes.municipality') }}</div>
      <div>{{ response.municipality }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('ipoes.largerSection') }}</div>
      <div>{{ response?.largerSection ?? '' }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('ipoes.section') }}</div>
      <div>{{ response.section }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('ipoes.houseNumber1') }}</div>
      <div>{{ response?.houseNumber1 ?? '' }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('ipoes.houseNumber2') }}</div>
      <div>{{ response?.houseNumber2 ?? '' }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('ipoes.houseNumber3') }}</div>
      <div>{{ response?.houseNumber3 ?? '' }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('ipoes.buildingName1') }}</div>
      <div>{{ response?.buildingName1 ?? '' }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('ipoes.buildingName2') }}</div>
      <div>{{ response?.buildingName2 ?? '' }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('ipoes.buildingName3') }}</div>
      <div>{{ response?.buildingName3 ?? '' }}</div>
    </DetailGrid>

    <div class="text-secondary text-lg mt-3">{{ t('addressRegistrationRequest.contactsInformation') }}</div>
    <DetailGrid>
      <div>{{ t('addressRegistrationRequest.latitude') }}</div>
      <div>{{ response.latitude }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('addressRegistrationRequest.longitude') }}</div>
      <div>{{ response.longitude }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('addressRegistrationRequest.companyName') }}</div>
      <div>{{ response?.companyName ?? '' }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('addressRegistrationRequest.personName') }}</div>
      <div>{{ response?.personName ?? '' }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('addressRegistrationRequest.phoneNumber') }}</div>
      <div>{{ response?.phoneNumber ?? '' }}</div>
    </DetailGrid>
  </div>
</template>
