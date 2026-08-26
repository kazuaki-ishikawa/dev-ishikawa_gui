<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import type { MsbPostRequest } from '@/api/msb/types'

type PropType = {
  request: MsbPostRequest
}
defineProps<PropType>()

const { t } = useI18n()
const { getMsbLicensePackList } = useMsb()
</script>

<template>
  <InnerCard :title="t('msb.customerInformation')">
    <DetailGrid>
      <div>{{ t('msb.departmentName') }}</div>
      <div>{{ request.departmentName }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('msb.customerType') }}</div>
      <div>{{ t(`msb.customerTypes.${request.customerType}`) }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('msb.emailAddress') }}</div>
      <div>{{ request.emailAddress }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('msb.customerSpecialNote') }}</div>
      <div>{{ request.customerSpecialNote }}</div>
    </DetailGrid>
  </InnerCard>
  <InnerCard :title="t('msb.applicationLicenseInformation')">
    <template v-for="msbLicensePack in getMsbLicensePackList(request.licensePacks)" :key="msbLicensePack.key">
      <DetailGrid>
        <div>{{ msbLicensePack.label }}</div>
        <div>{{ msbLicensePack.value }}</div>
      </DetailGrid>
    </template>
  </InnerCard>
</template>
