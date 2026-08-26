<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RinkMobileOrderTypes } from '@/api/orders/constants'
import { RinkLineAdditionalLimitTypes } from '@/api/rinkLines/constants'
import type { OrderRinkLineDetailType, OrderRinkLineRequest } from '@/api/rinkLines/types'

type PropType = {
  list: OrderRinkLineDetailType[]
  orderType: OrderRinkLineRequest['orderType']
}
const props = defineProps<PropType>()
const { t } = useI18n()

const lineHeaders = computed(() => {
  const headers = [
    { text: 'No', key: 'lineIndex', width: 100 },
    { text: t('rinkLines.lineNumber'), key: 'lineNumber', width: 200, class: 'text-sm' },
    { text: t('rinkLines.plan'), key: 'planName', width: 200, class: 'text-sm' },
    { text: t('rinkLines.accessType'), key: 'accessType', width: 150, class: 'text-sm' },
    { text: t('rinkLines.simNumber'), key: 'simNumber', width: 200, class: 'text-sm' },
    { text: t('rinkLines.deviceName'), key: 'deviceName', width: 150, class: 'text-sm' },
    { text: 'IMEI', key: 'imei', width: 200, class: 'text-sm' },
    { text: t('rinkLines.authenticationId'), key: 'authenticationId', width: 220 },
    { text: t('rinkLines.authenticationPassword'), key: 'authenticationPassword', width: 200 },
    { text: t('rinkLines.actIpAddress'), key: 'actIpAddress', width: 200, class: 'text-sm' },
    { text: t('rinkLines.sbyIpAddress'), key: 'sbyIpAddress', width: 200, class: 'text-sm' },
  ]
  // 新規作成以外のオーダーでは additionalLimit 列を表示する
  if (props.orderType !== RinkMobileOrderTypes.RinkLineCreate) {
    headers.push({ text: t('rinkLines.additionalLimit'), key: 'additionalLimit', width: 150, class: 'text-sm' })
  }
  return headers
})

const items = computed(() => {
  return props.list.map(line => {
    const foundAddLimit = Object.entries(RinkLineAdditionalLimitTypes).find(
      ([_, value]) => value === line.addLimit,
    )?.[0]
    return {
      lineIndex: `${line.lineIndex}`,
      lineNumber: line.lineNumber,
      planName: line.planName,
      accessType: line.accessType,
      simNumber: line.simNumber,
      deviceName: line.deviceName || line.initialDeviceName,
      imei: line.imei,
      authenticationId: line.authenticationId,
      authenticationPassword: line.authenticationPassword,
      actIpAddress: line.actIpAddress,
      sbyIpAddress: line.sbyIpAddress || '',
      additionalLimit: foundAddLimit ?? line.addLimit,
    }
  })
})
</script>

<template>
  <div class="text-secondary text-lg my-3">{{ `${t('service.rinkLines')}${t('common.list')}` }}</div>
  <StripedTable v-if="items.length" :headers="lineHeaders" :items="items" :key-items="['lineIndex']">
    <template #accessType="{ data }">
      {{ data ? t(`rinkLines.accessTypes.${data}`) : '' }}
    </template>
  </StripedTable>
</template>
