<script setup lang="ts">
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import { ResourceStatusTypes } from '@/api/constants'
import { RouteName } from '@/route/constants'

definePageMeta({
  name: RouteName.Vpn.List,
})

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const resourceStatusOptions = useNovaResourceStatusOptions()
const tenantId = computed(() => route.params.tenantId as string)

// vpn一覧取得
const { vpnQuery, vpnList, getVpnList } = useGetVpnList()

const headers = [
  { title: `${t('nova.vpn.vpnId')}\n${t('nova.vpn.name')}`, key: 'vpnId', sortable: false },
  { title: t('nova.details.resourceStatus'), key: 'resourceStatus', sortable: false, width: 130 },
  { title: t('nova.vpn.routeCount'), key: 'routeCount', sortable: false, width: 100 },
  { title: t('nova.details.orderId'), key: 'orderId', sortable: false },
  { title: t('nova.details.updateTime'), key: 'updateTime', sortable: false },
  { title: '', key: 'action', sortable: false, width: 100 },
]
const items = computed(() =>
  vpnList.value.map(vpn => ({
    vpnId: vpn.vpnId,
    customerNote: vpn.customerNote,
    routeCount: vpn?.routeCount,
    resourceStatus: vpn.resourceStatus,
    orderId: vpn?.orderId,
    updateTime: formatDateTime(vpn.updateTime),
  })),
)

const moveToCreate = () => {
  return navigateTo({ name: RouteName.Vpn.Create, params: { tenantId: tenantId.value } })
}

const handleSearch = () => {
  if (isEqual(routeQuery.value, vpnQuery.value)) {
    // パスクエリの変更がない場合は直接 getVpnList を実行する
    getVpnList(vpnQuery.value)
  } else {
    router.push({ query: vpnQuery.value })
  }
}
const handleQueryClear = () => {
  vpnQuery.value = { resourceStatus: undefined }
}

const routeQuery = computed(() =>
  ['resourceStatus'].reduce(
    (q, key) => {
      const value = route.query[key]
      if (['resourceStatus'].includes(key) && typeof value === 'string') {
        return Object.assign(q, { [key]: [value] })
      } else {
        return Object.assign(q, { [key]: value })
      }
    },
    { ...vpnQuery.value },
  ),
)
const changeRouteQuery = () => {
  getVpnList(routeQuery.value)
}
const updateQueryResourceStatus = (status: string | string[]) => {
  vpnQuery.value = { resourceStatus: Object.values(ResourceStatusTypes).filter(v => status.includes(v)) }
}

watch(() => route.query, changeRouteQuery, { immediate: true })
</script>

<template>
  <div>
    <NovaPageHeader>
      <NovaCustomButton data-cy="vpns-index-create-button" @click="moveToCreate">
        {{ t('nova.vpn.apply') }}
      </NovaCustomButton>
    </NovaPageHeader>

    <NovaSearchFilter @clear="handleQueryClear" @search="handleSearch">
      <NovaSearchInput
        :model-value="vpnQuery.resourceStatus ?? []"
        type="checkbox"
        :options="resourceStatusOptions"
        :label="t('nova.details.resourceStatus')"
        @update:model-value="updateQueryResourceStatus"
      />
    </NovaSearchFilter>

    <NovaPaginationHeader :total="vpnList.length" />

    <NovaDataTable :headers="headers" :items="items" height="68vh">
      <template #[`item.vpnId`]="{ item }">
        <NuxtLink :to="{ name: RouteName.Vpn.Detail, params: { tenantId, id: item.vpnId } }">{{ item.vpnId }}</NuxtLink>
        <div class="text-break">{{ item.customerNote }}</div>
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
          @click="navigateTo({ name: RouteName.Vpn.Detail, params: { tenantId, id: item.vpnId } })"
        >
          {{ t('nova.common.detail') }}
        </NovaCustomButton>
      </template>
    </NovaDataTable>
  </div>
</template>
