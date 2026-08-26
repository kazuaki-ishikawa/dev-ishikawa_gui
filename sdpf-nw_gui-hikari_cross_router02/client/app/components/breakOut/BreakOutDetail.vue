<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { BreakOutResponse } from '@/api/breakOut/types'

type PropType = {
  breakOut?: BreakOutResponse | null
  showTimes?: boolean
  isOrder?: boolean
}
const props = withDefaults(defineProps<PropType>(), {
  breakOut: null,
  showTime: false,
})
const { t } = useI18n()
const { getOrderIdLink, orderStatusTypeTranslation } = useOrders()
const orderIdLink = computed(() =>
  props.breakOut ? getOrderIdLink({ tenantId: props.breakOut.tenantId, orderId: props.breakOut?.orderId }) : '',
)
</script>

<template>
  <div>
    <DetailGrid>
      <div>{{ t('breakOut.customerNote') }}</div>
      <div data-cy="break-out-detail-customer-note">{{ breakOut?.customerNote }}</div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('breakOut.fqdnList') }}</div>
      <div class="list-content overflow-y-auto flex-column" data-cy="break-out-detail-fqdn-list">
        <div v-for="(fqdn, index) in breakOut?.fqdnList" :key="`break-out-detail-fqdn-${index}`">
          {{ fqdn }}
        </div>
      </div>
    </DetailGrid>
    <DetailGrid>
      <div>{{ t('breakOut.prefixList') }}</div>
      <div class="list-content overflow-y-auto flex-column" data-cy="break-out-detail-prefix-list">
        <div v-for="(prefix, index) in breakOut?.prefixList" :key="`break-out-detail-prefix-${index}`">
          {{ prefix }}
        </div>
      </div>
    </DetailGrid>
    <template v-if="showTimes">
      <DetailGrid>
        <div>{{ t('details.resourceStatus') }}</div>
        <div>{{ breakOut?.resourceStatus }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.orderId') }}</div>
        <NuxtLink
          v-if="!!orderIdLink"
          class="cursor-pointer"
          :to="orderIdLink"
          data-cy="break-out-detail-order-id-link"
        >
          {{ breakOut?.orderId }}
        </NuxtLink>
        <div v-else data-cy="break-out-detail-order-id">{{ breakOut?.orderId }}</div>
      </DetailGrid>
      <DetailGrid v-if="!!breakOut?.orderStatus && !isOrder">
        <div>{{ t('details.orderStatus') }}</div>
        <div data-cy="break-out-detail-order-status">
          {{ orderStatusTypeTranslation[breakOut.orderStatus] }}
        </div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.creationTime') }}</div>
        <div data-cy="break-out-detail-creation-time">{{ formatDateTime(breakOut?.creationTime) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.updateTime') }}</div>
        <div data-cy="break-out-detail-update-time">{{ formatDateTime(breakOut?.updateTime) }}</div>
      </DetailGrid>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.list-content {
  max-height: 200px;
  align-items: flex-start !important;
}
</style>
