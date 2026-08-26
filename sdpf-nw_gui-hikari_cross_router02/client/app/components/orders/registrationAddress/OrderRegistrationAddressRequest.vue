<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { RegistrationAddressPostRequest } from '@/api/iwanUtil/types'

type PropType = {
  request: RegistrationAddressPostRequest
}
defineProps<PropType>()
const { t } = useI18n()
</script>

<template>
  <InnerCard :title="t('orders.request')">
    <div class="text-secondary text-lg mt-3">{{ t('addressRegistrationRequest.installationInformation') }}</div>
    <DetailGrid>
      <div>{{ t('ipoes.postalCode') }}</div>
      <div>{{ request.postalCode }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('addressRegistrationRequest.prefecture') }}</div>
      <div>{{ request.prefecture }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('ipoes.municipality') }}</div>
      <div>{{ request.municipality }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('ipoes.largerSection') }}</div>
      <div>{{ request?.largerSection ?? '' }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('ipoes.section') }}</div>
      <div>{{ request.section }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('ipoes.houseNumber1') }}</div>
      <div>{{ request?.houseNumber1 ?? '' }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('ipoes.houseNumber2') }}</div>
      <div>{{ request?.houseNumber2 ?? '' }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('ipoes.houseNumber3') }}</div>
      <div>{{ request?.houseNumber3 ?? '' }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('ipoes.buildingName1') }}</div>
      <div>{{ request?.buildingName1 ?? '' }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('ipoes.buildingName2') }}</div>
      <div>{{ request?.buildingName2 ?? '' }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('ipoes.buildingName3') }}</div>
      <div>{{ request?.buildingName3 ?? '' }}</div>
    </DetailGrid>
    <div class="text-secondary text-lg mt-3">{{ t('addressRegistrationRequest.contactsInformation') }}</div>
    <DetailGrid>
      <div>{{ t('addressRegistrationRequest.latitude') }}</div>
      <div>{{ request.latitude }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('addressRegistrationRequest.longitude') }}</div>
      <div>{{ request.longitude }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('addressRegistrationRequest.mapDocumentId') }}</div>
      <div>{{ request.mapDocumentId }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('addressRegistrationRequest.companyName') }}</div>
      <div>{{ request?.companyName ?? '' }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('addressRegistrationRequest.personName') }}</div>
      <div>{{ request?.personName ?? '' }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('addressRegistrationRequest.phoneNumber') }}</div>
      <div>{{ request?.phoneNumber ?? '' }}</div>
    </DetailGrid>
  </InnerCard>
</template>
