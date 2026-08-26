<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RinkMobileOrderTypes } from '@/api/orders/constants'
import type { OrderRinkMobileResponse } from '@/api/orders/types'

type PropType = {
  order: OrderRinkMobileResponse
  orderDates: {
    reservedCompletionDate: string
    reservedConstructionDate: string
    cancellationDeadline: string
  }
}
const props = defineProps<PropType>()

const { t } = useI18n()
const request = computed(() => props.order.request)

const orderTypeName = computed(() => {
  const connectionEditPrefix = `${t('service.rinkContracts')}${t('common.edit')}`
  const lineEditPrefix = `${t('service.rinkLines')}${t('common.edit')}`

  switch (request.value.orderType) {
    case RinkMobileOrderTypes.RinkConnectionCreate:
      return `${t('service.rinkContracts')}${t('common.createNew')}`
    case RinkMobileOrderTypes.RinkConnectionUpdateConnectionType:
      return `${connectionEditPrefix}（${t('rinkConnections.editMenu.connectionType')}）`
    case RinkMobileOrderTypes.RinkConnectionUpdateDnsServer:
      return `${connectionEditPrefix}（${t('rinkConnections.editMenu.dnsServer')}）`
    case RinkMobileOrderTypes.RinkConnectionUpdateLocalBreakOut:
      return `${connectionEditPrefix}（${t('rinkConnections.editMenu.localBreakOut')}）`
    case RinkMobileOrderTypes.RinkConnectionUpdateVpnConnectionPrefix:
      return `${connectionEditPrefix}（${t('rinkConnections.editMenu.vpnConnectionPrefix')}）`
    case RinkMobileOrderTypes.RinkConnectionDelete:
      return `${t('service.rinkContracts')}${t('common.delete')}`
    case RinkMobileOrderTypes.RinkDeviceCreate:
      return t('rinkDevices.purchase')
    case RinkMobileOrderTypes.RinkLineCreate:
      return `${t('service.rinkLines')}${t('common.newApplication')}`
    case RinkMobileOrderTypes.RinkLineUpdateAdditionalLimit:
      return `${lineEditPrefix}（${t('rinkLines.editMenu.additionalLimit')}）`
    case RinkMobileOrderTypes.RinkLineUpdateAuthentication:
      return `${lineEditPrefix}（${t('rinkLines.editMenu.authentication')}）`
    case RinkMobileOrderTypes.RinkLineUpdateLinePrefix:
      return `${lineEditPrefix}（${t('rinkLines.editMenu.linePrefix')}）`
    case RinkMobileOrderTypes.RinkLineUpdatePlan:
      return `${lineEditPrefix}（${t('rinkLines.editMenu.plan')}）`
    case RinkMobileOrderTypes.RinkLineUpdateDeactivate:
      return `${lineEditPrefix}（${t('rinkLines.editMenu.deactivate')}）`
    case RinkMobileOrderTypes.RinkLineUpdateReactivate:
      return `${lineEditPrefix}（${t('rinkLines.editMenu.reactivate')}）`
    case RinkMobileOrderTypes.RinkLineUpdateReissue:
      return `${lineEditPrefix}（${t('rinkLines.editMenu.reissue')}）`
    case RinkMobileOrderTypes.RinkLineDelete:
      return `${t('service.rinkLines')}${t('common.delete')}`
    case RinkMobileOrderTypes.RinkLineGroupCreate:
      return `${t('service.rinkLineGroups')}${t('common.createNew')}`
    case RinkMobileOrderTypes.RinkLineGroupDelete:
      return `${t('service.rinkLineGroups')}${t('common.delete')}`
    case RinkMobileOrderTypes.RinkLineGroupUpdateAdd:
      return t('rinkLineGroups.addLine')
    case RinkMobileOrderTypes.RinkLineGroupUpdateRemove:
      return t('rinkLineGroups.deleteLine')
    default:
      return ''
  }
})

const rinkLineRequest = computed(() => {
  if (
    request.value.orderType === RinkMobileOrderTypes.RinkLineCreate ||
    request.value.orderType === RinkMobileOrderTypes.RinkLineUpdateAdditionalLimit ||
    request.value.orderType === RinkMobileOrderTypes.RinkLineUpdateAuthentication ||
    request.value.orderType === RinkMobileOrderTypes.RinkLineUpdateLinePrefix ||
    request.value.orderType === RinkMobileOrderTypes.RinkLineUpdatePlan ||
    request.value.orderType === RinkMobileOrderTypes.RinkLineUpdateDeactivate ||
    request.value.orderType === RinkMobileOrderTypes.RinkLineUpdateReactivate ||
    request.value.orderType === RinkMobileOrderTypes.RinkLineUpdateReissue ||
    request.value.orderType === RinkMobileOrderTypes.RinkLineDelete
  ) {
    return request.value
  }
  return null
})

const rinkLineGroupRequest = computed(() => {
  if (
    request.value.orderType === RinkMobileOrderTypes.RinkLineGroupCreate ||
    request.value.orderType === RinkMobileOrderTypes.RinkLineGroupDelete ||
    request.value.orderType === RinkMobileOrderTypes.RinkLineGroupUpdateAdd ||
    request.value.orderType === RinkMobileOrderTypes.RinkLineGroupUpdateRemove
  ) {
    return request.value
  }
  return null
})

const connectionRequest = computed(() => {
  if (
    request.value.orderType === RinkMobileOrderTypes.RinkConnectionCreate ||
    request.value.orderType === RinkMobileOrderTypes.RinkConnectionUpdateConnectionType ||
    request.value.orderType === RinkMobileOrderTypes.RinkConnectionUpdateDnsServer ||
    request.value.orderType === RinkMobileOrderTypes.RinkConnectionUpdateLocalBreakOut ||
    request.value.orderType === RinkMobileOrderTypes.RinkConnectionUpdateVpnConnectionPrefix ||
    request.value.orderType === RinkMobileOrderTypes.RinkConnectionDelete
  ) {
    return request.value
  }
  return null
})
</script>

<template>
  <InnerCard :title="t('orders.request')">
    <!-- 申込種別名 -->
    <DetailGrid>
      <div>{{ t('orders.orderType') }}</div>
      <div>{{ orderTypeName }}</div>
    </DetailGrid>

    <!-- 設備オーダー -->
    <OrderRinkConnectionRequest v-if="connectionRequest" :request="connectionRequest" />

    <!-- 機器購入オーダー -->
    <OrderRinkDeviceRequest
      v-else-if="request.orderType === RinkMobileOrderTypes.RinkDeviceCreate"
      :request="request"
    />

    <!-- 回線オーダー -->
    <OrderRinkLineRequest v-else-if="rinkLineRequest" :request="rinkLineRequest" />

    <!-- 容量シェアグループオーダー -->
    <OrderRinkLineGroupRequest v-else-if="rinkLineGroupRequest" :request="rinkLineGroupRequest" />

    <div class="border-bottom" />
    <!-- 希望日 -->
    <DetailGrid v-if="!!orderDates.reservedCompletionDate">
      <div>{{ t('rinkConnections.requestDate') }}</div>
      <div>{{ orderDates.reservedCompletionDate }}</div>
    </DetailGrid>
    <!-- 工事日 -->
    <DetailGrid v-if="!!orderDates.reservedConstructionDate">
      <div>{{ t('rinkConnections.reservedConstructionDate') }}</div>
      <div>{{ orderDates.reservedConstructionDate }}</div>
    </DetailGrid>
    <!-- 取り下げ可能期限 -->
    <DetailGrid v-if="!!orderDates.cancellationDeadline">
      <div>{{ t('rinkConnections.cancellationDeadline') }}</div>
      <div>{{ orderDates.cancellationDeadline }}</div>
    </DetailGrid>
  </InnerCard>
</template>

<style scoped lang="scss">
.border-bottom {
  border-bottom: 1px solid #e5e7eb;
}
</style>
