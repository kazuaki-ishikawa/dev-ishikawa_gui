<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { OrderRinkLineGroupRequest } from '@/api/rinkLineGroups/types'

type PropType = {
  request: OrderRinkLineGroupRequest
}
const props = defineProps<PropType>()
const { t } = useI18n()

const headers = [
  { text: 'No.', key: 'lineIndex', width: 80 },
  { text: t('rinkLineGroups.lineGroupName'), key: 'lineGroupName' },
  { text: t('rinkLines.lineNumber'), key: 'lineNumber' },
  { text: t('rinkLineGroups.totalLineGroupLimit'), key: 'totalLineGroupLimit' },
]
const items = computed(
  () =>
    props.request.orderDetailLine?.map(item => ({
      lineIndex: item.lineIndex,
      lineGroupName: item.lineGroupName || '',
      lineNumber: item.lineNumber,
      totalLineGroupLimit: `${item.totalLineGroupLimit ? item.totalLineGroupLimit / 1024 ** 3 : 0}GB`,
    })) ?? [],
)
</script>

<template>
  <StripedTable :headers="headers" :items="items" :key-items="['lineIndex']" />
</template>
