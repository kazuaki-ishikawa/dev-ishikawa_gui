<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import type { MsbPatchRequest } from '@/api/msb/types'

type PropType = {
  request: MsbPatchRequest
}
defineProps<PropType>()
const { t } = useI18n()

const { getMsbLicensePackList } = useMsb()
</script>

<template>
  <InnerCard :title="t('msb.customerInformation')">
    <DetailGrid>
      <div>{{ t('msb.emailAddress') }}</div>
      <div>{{ request.emailAddress }}</div>
    </DetailGrid>
    <DetailGrid v-if="'customerSpecialNote' in request">
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
