<script setup lang="ts">
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import { ResourceStatusTypes } from '@/api/constants'
import type { UnoConnectionListQuery } from '@/api/unoConnections/types'
import { OrderResourceTypes } from '@/api/orders/constants'
import { RouteName } from '@/route/constants'

definePageMeta({
  name: RouteName.UnoConnection.List,
})

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const resourceStatusOptions = useNovaResourceStatusOptions()
const tenantId = computed(() => route.params.tenantId as string)

const { unoConnectionsQuery, unoConnections, getUnoConnectionList } = useUnoConnections()

const openCreateConfirmDialog = ref(false)

const headers = [
  {
    title: `${t('nova.unoConnections.unoConnectionId')}\n${t('nova.unoConnections.customerNote')}`,
    key: 'unoConnectionId',
    sortable: false,
  },
  { title: t('nova.unoConnections.sourceVpnId'), key: 'vpnId', sortable: false, width: 130 },
  { title: t('nova.unoConnections.destinationVpnId'), key: 'unoVpnId', sortable: false, width: 130 },
  { title: t('nova.details.resourceStatus'), key: 'resourceStatus', sortable: false, width: 130 },
  { title: t('nova.details.orderId'), key: 'orderId', sortable: false },
  { title: t('nova.details.updateTime'), key: 'updateTime', sortable: false },
  { title: '', key: 'action', sortable: false, width: 100 },
]
const items = computed(() =>
  unoConnections.value.map(unoConnection => ({
    unoConnectionId: unoConnection.unoConnectionId,
    customerNote: unoConnection.customerNote,
    vpnId: unoConnection.vpnId,
    unoVpnId: unoConnection.unoVpnId,
    resourceStatus: unoConnection.resourceStatus,
    orderId: unoConnection.orderId,
    updateTime: formatDateTime(unoConnection.updateTime),
  })),
)

const moveToOrder = () => {
  return navigateTo({
    name: RouteName.Order.List,
    params: { tenantId: tenantId.value },
    query: { resourceType: OrderResourceTypes.UnoConnection },
  })
}

const moveToCreate = () => {
  openCreateConfirmDialog.value = false
  return navigateTo({ name: RouteName.UnoConnection.Create, params: { tenantId: tenantId.value } })
}

const moveToDetail = (id: string) => {
  return navigateTo({ name: RouteName.UnoConnection.Detail, params: { tenantId: tenantId.value, id } })
}

const handleSearch = () => {
  if (isEqual(routeQuery.value, unoConnectionsQuery.value)) {
    // パスクエリの変更がない場合は直接 getUnoConnectionList を実行する
    getUnoConnectionList(unoConnectionsQuery.value)
  } else {
    router.push({ query: unoConnectionsQuery.value })
  }
}
const handleQueryClear = () => {
  unoConnectionsQuery.value = { resourceStatus: undefined }
}

const updateQueryResourceStatus = (status: string | string[]) => {
  unoConnectionsQuery.value = {
    resourceStatus: Object.values(ResourceStatusTypes).filter(v => status.includes(v)),
  }
}

const routeQuery = computed<UnoConnectionListQuery>(() =>
  ['resourceStatus'].reduce(
    (q, key) => {
      const value = route.query[key]
      if (key === 'resourceStatus') {
        return Object.assign(q, { [key]: typeof value === 'string' ? [value] : value })
      }
      return Object.assign(q, { [key]: value })
    },
    { ...unoConnectionsQuery.value },
  ),
)
const changeRouteQuery = () => {
  getUnoConnectionList(routeQuery.value)
}

watch(() => route.query, changeRouteQuery, { immediate: true })
</script>

<template>
  <div>
    <NovaPageHeader>
      <div class="d-flex">
        <NovaCustomButton outlined prepend-icon="nova:clock" @click="moveToOrder">
          {{ t('nova.sideBar.other.orders') }}
        </NovaCustomButton>
        <NovaCustomButton
          class="ml-4"
          append-icon="mdi-chevron-right"
          data-cy="uno-connections-index-create-button"
          @click="openCreateConfirmDialog = true"
        >
          {{ t('nova.common.createNew') }}
        </NovaCustomButton>
      </div>
    </NovaPageHeader>

    <NovaSearchFilter @clear="handleQueryClear" @search="handleSearch">
      <NovaSearchInput
        :model-value="unoConnectionsQuery.resourceStatus ?? []"
        type="checkbox"
        :options="resourceStatusOptions"
        :label="t('nova.details.resourceStatus')"
        @update:model-value="updateQueryResourceStatus"
      />
    </NovaSearchFilter>

    <NovaPaginationHeader :total="unoConnections.length" />

    <NovaDataTable :headers="headers" :items="items" height="68vh">
      <template #[`item.unoConnectionId`]="{ item }">
        <NuxtLink :to="{ name: RouteName.UnoConnection.Detail, params: { tenantId, id: item.unoConnectionId } }">
          {{ item.unoConnectionId }}
        </NuxtLink>
        <div class="text-break">{{ item.customerNote }}</div>
      </template>
      <template #[`item.vpnId`]="{ item }">
        <NuxtLink :to="{ name: RouteName.Vpn.Detail, params: { tenantId, id: item.vpnId } }">
          {{ item.vpnId }}
        </NuxtLink>
      </template>
      <template #[`item.resourceStatus`]="{ item }">
        <NovaResourceStatusTag :status="item.resourceStatus" />
      </template>
      <template #[`item.orderId`]="{ item }">
        <NuxtLink v-if="item.orderId" :to="{ name: RouteName.Order.Detail, params: { tenantId, id: item.orderId } }">
          {{ item.orderId }}
        </NuxtLink>
        <span v-else>-</span>
      </template>
      <template #[`item.action`]="{ item }">
        <NovaCustomButton
          append-icon="mdi-chevron-right"
          outlined
          size="small"
          @click="moveToDetail(item.unoConnectionId)"
        >
          {{ t('nova.common.detail') }}
        </NovaCustomButton>
      </template>
    </NovaDataTable>

    <NovaDialogBase
      v-model="openCreateConfirmDialog"
      :title="t('nova.unoConnections.createConfirmTitle')"
      icon="alert-circle"
      :width="612"
    >
      <div class="text-pre-wrap">
        <i18n-t keypath="nova.unoConnections.message.beforeCreation" scope="global">
          <template #boldText>
            <span class="font-weight-bold">{{ t('nova.unoConnections.message.rinkAndUno') }}</span>
          </template>
        </i18n-t>
        <span class="text-xs">（※1）</span>

        <div class="mt-4">
          {{ t('nova.unoConnections.message.ficConnection') }}
          <span class="text-xs">（※2）</span>
        </div>
        <div>{{ t('nova.unoConnections.message.unavailableCommunication') }}</div>

        <div class="mt-4">{{ t('nova.unoConnections.message.ficAndOtherConnectionNotes') }}</div>
      </div>

      <template #actions>
        <NovaCustomButton
          outlined
          data-cy="uno-connections-index-create-dialog-cancel-button"
          @click="openCreateConfirmDialog = false"
        >
          {{ t('nova.common.cancel') }}
        </NovaCustomButton>
        <NovaCustomButton
          class="ml-4"
          data-cy="uno-connections-index-create-dialog-move-to-create-button"
          @click="moveToCreate"
        >
          {{ t('nova.unoConnections.moveToCreate') }}
        </NovaCustomButton>
      </template>
    </NovaDialogBase>
  </div>
</template>
