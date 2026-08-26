<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RouteName } from '@/route/constants'
import type { BreakOutResponse } from '@/api/breakOut/types'

type PropType = {
  breakOut: BreakOutResponse | null
}
defineProps<PropType>()

const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)
const { t } = useI18n()
</script>

<template>
  <NovaDetailGrid :label="t('nova.breakOut.customerNote')">
    {{ breakOut?.customerNote }}
  </NovaDetailGrid>
  <NovaDetailGrid :label="t('nova.breakOut.id')">
    {{ breakOut?.breakOutListId }}
  </NovaDetailGrid>
  <NovaDetailGrid :label="t('breakOut.fqdnList')">
    <div v-for="(fqdn, index) in breakOut?.fqdnList" :key="`break-out-detail-fqdn-${index}`">
      {{ fqdn }}
    </div>
  </NovaDetailGrid>
  <NovaDetailGrid :label="t('breakOut.prefixList')">
    <div v-for="(prefix, index) in breakOut?.prefixList" :key="`break-out-detail-prefix-${index}`">
      {{ prefix }}
    </div>
  </NovaDetailGrid>
  <NovaDetailGrid :label="t('nova.details.resourceStatus')">
    {{ breakOut?.resourceStatus }}
  </NovaDetailGrid>
  <NovaDetailGrid :label="t('nova.details.orderId')">
    <NuxtLink
      v-if="breakOut?.orderId"
      :to="{ name: RouteName.Order.Detail, params: { tenantId, id: breakOut.orderId } }"
    >
      {{ breakOut.orderId }}
    </NuxtLink>
  </NovaDetailGrid>
  <NovaDetailGrid :label="t('nova.details.creationTime')">
    {{ formatDateTime(breakOut?.creationTime) }}
  </NovaDetailGrid>
  <NovaDetailGrid :label="t('nova.details.updateTime')">
    {{ formatDateTime(breakOut?.updateTime) }}
  </NovaDetailGrid>
</template>
