<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { BreakOutPostRequest, BreakOutPutRequest } from '@/api/breakOut/types'

type PropType = {
  request: BreakOutPostRequest | BreakOutPutRequest
}
defineProps<PropType>()
const { t } = useI18n()
</script>

<template>
  <InnerCard :title="t('orders.request')">
    <DetailGrid v-if="!!request?.customerNote">
      <div>{{ t('breakOut.customerNote') }}</div>
      <div>{{ request?.customerNote }}</div>
    </DetailGrid>
    <DetailGrid v-if="!!request?.fqdnList">
      <div>{{ t('breakOut.fqdnList') }}</div>
      <div class="list-content overflow-y-auto flex-column">
        <div v-for="(fqdn, index) in request.fqdnList" :key="`break-out-detail-fqdn-${index}`">
          {{ fqdn }}
        </div>
      </div>
    </DetailGrid>
    <DetailGrid v-if="!!request?.prefixList">
      <div>{{ t('breakOut.prefixList') }}</div>
      <div class="list-content overflow-y-auto flex-column">
        <div v-for="(prefix, index) in request.prefixList" :key="`break-out-detail-prefix-${index}`">
          {{ prefix }}
        </div>
      </div>
    </DetailGrid>
  </InnerCard>
</template>

<style lang="scss" scoped>
.list-content {
  max-height: 200px;
  align-items: flex-start !important;
}
</style>
