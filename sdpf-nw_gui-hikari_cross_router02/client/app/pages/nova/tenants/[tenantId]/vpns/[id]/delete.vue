<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ResourceStatusTypes } from '@/api/constants'
import { RouteName } from '@/route/constants'

definePageMeta({
  name: RouteName.Vpn.Delete,
  middleware: ['navigation'],
  params: ['tenantId', 'id'],
  fallback: {
    name: RouteName.Vpn.List,
    params: ['tenantId'],
    query: { resourceStatus: [ResourceStatusTypes.Active, ResourceStatusTypes.Inactive] },
  },
})

const route = useRoute()
const { t } = useI18n()

const tenantId = computed(() => route.params.tenantId as string)
const vpnId = computed(() => route.params.id as string)

const { getVpn, vpn } = useGetVpn()

const resourceName = computed(() => {
  if (!vpn.value) {
    return ''
  }
  return `${vpn.value.customerNote}（${vpn.value.vpnId}）`
})

const moveToVpnList = () => {
  return navigateTo({
    name: RouteName.Vpn.List,
    params: { tenantId: tenantId.value },
    query: { resourceStatus: [ResourceStatusTypes.Active, ResourceStatusTypes.Inactive] },
    replace: true,
  })
}
const moveToOrderDetail = (id: string) => {
  return navigateTo({
    name: RouteName.Order.Detail,
    params: { tenantId: tenantId.value, id },
    replace: true,
  })
}

onBeforeMount(() => {
  getVpn(vpnId.value)
})
</script>

<template>
  <div>
    <NovaPageHeader :customer-note="vpn?.customerNote" />
    <v-card class="mt-5">
      <NovaCardTitleWithBorder :title="t('nova.delete.completeTitle')">
        <NovaCardItemCompleted :order-id="vpn?.orderId ?? ''" :message="t('nova.delete.sentMail', { resourceName })" />
        <span class="text-pre-wrap">{{ t('nova.update.completeDescription') }}</span>
      </NovaCardTitleWithBorder>
    </v-card>

    <div class="flex-center-center ga-6 py-4">
      <NovaCustomButton outlined data-cy="vpns-id-delete-cancel-button" @click="moveToVpnList()">
        {{ t('nova.vpn.moveToList') }}
      </NovaCustomButton>
      <NovaCustomButton
        :disabled="!vpn?.orderId"
        data-cy="vpns-id-delete-submit-button"
        @click="moveToOrderDetail(vpn?.orderId ?? '')"
      >
        {{ t('nova.common.moveToOrderDetail') }}
      </NovaCustomButton>
    </div>
  </div>
</template>
