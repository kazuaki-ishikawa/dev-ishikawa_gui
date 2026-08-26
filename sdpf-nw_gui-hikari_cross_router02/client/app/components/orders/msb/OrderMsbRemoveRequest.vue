<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import type { MsbDeleteRequest } from '@/api/msb/types'

type PropType = {
  request: MsbDeleteRequest
}
defineProps<PropType>()
const { t } = useI18n()
</script>

<template>
  <InnerCard :title="t('msb.customerInformation')">
    <DetailGrid>
      <div>{{ t('msb.reason') }}</div>
      <div>{{ request.reason }}</div>
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
</template>
