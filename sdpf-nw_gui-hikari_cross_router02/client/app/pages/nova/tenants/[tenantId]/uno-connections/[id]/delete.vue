<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ResourceStatusTypes } from '@/api/constants'
import { RouteName } from '@/route/constants'

definePageMeta({
  name: RouteName.UnoConnection.Delete,
  middleware: ['navigation'],
  params: ['tenantId', 'id'],
  fallback: {
    name: RouteName.UnoConnection.List,
    params: ['tenantId'],
    query: { resourceStatus: [ResourceStatusTypes.Active, ResourceStatusTypes.Inactive] },
  },
})

const route = useRoute()
const { t } = useI18n()

const tenantId = computed(() => route.params.tenantId as string)
const unoConnectionId = computed(() => route.params.id as string)

const { getUnoConnection, unoConnection } = useGetUnoConnection()

const resourceName = computed(() => {
  if (!unoConnection.value) {
    return ''
  }
  return `${unoConnection.value.customerNote}（${unoConnection.value.unoConnectionId}）`
})

const moveToUnoConnectionList = () => {
  return navigateTo({
    name: RouteName.UnoConnection.List,
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
  getUnoConnection(unoConnectionId.value)
})
</script>

<template>
  <div>
    <NovaPageHeader :customer-note="unoConnection?.customerNote" />
    <v-card class="mt-5">
      <NovaCardTitleWithBorder :title="t('nova.delete.completeTitle')">
        <NovaCardItemCompleted
          :order-id="unoConnection?.orderId ?? ''"
          :message="t('nova.unoConnections.message.deleted', { resourceName })"
        />
        <span class="text-pre-wrap">{{ t('nova.update.completeDescription') }}</span>
      </NovaCardTitleWithBorder>
    </v-card>

    <div class="flex-center-center ga-6 py-4">
      <NovaCustomButton outlined data-cy="uno-connections-id-delete-cancel-button" @click="moveToUnoConnectionList()">
        {{ t('nova.unoConnections.moveToList') }}
      </NovaCustomButton>
      <NovaCustomButton
        :disabled="!unoConnection?.orderId"
        data-cy="uno-connections-id-delete-submit-button"
        @click="moveToOrderDetail(unoConnection?.orderId ?? '')"
      >
        {{ t('nova.common.moveToOrderDetail') }}
      </NovaCustomButton>
    </div>
  </div>
</template>
