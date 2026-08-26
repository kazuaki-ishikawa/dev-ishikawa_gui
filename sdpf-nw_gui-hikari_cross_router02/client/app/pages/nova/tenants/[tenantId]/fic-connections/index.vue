<script setup lang="ts">
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import { ResourceStatusTypes } from '@/api/constants'
import { OrderResourceTypes } from '@/api/orders/constants'
import { RouteName } from '@/route/constants'

definePageMeta({
  name: RouteName.FicConnection.List,
})

const route = useRoute()
const router = useRouter()

const { t } = useI18n()
const resourceStatusOptions = useNovaResourceStatusOptions()
const tenantId = computed(() => route.params.tenantId as string)

// fic一覧取得
const { ficConnectionsQuery, getFicConnectionList, ficConnections } = useGetFicConnectionList()

// フロントエンド側でフィルタする項目（バックエンド未対応のため）
const ficIdFilterInput = ref<string[]>([])
const ficNameFilterInput = ref('')
const appliedFicId = ref<string[]>([])
const appliedFicName = ref('')

const ficIdOptions = computed(() =>
  ficConnections.value.map(fic => ({ text: fic.ficConnectionId, value: fic.ficConnectionId })),
)

const filteredFicConnections = computed(() =>
  ficConnections.value.filter(fic => {
    const terms = [] as boolean[]
    if (appliedFicId.value.length) {
      terms.push(appliedFicId.value.includes(fic.ficConnectionId))
    }
    if (appliedFicName.value) {
      terms.push((fic.customerNote ?? '').includes(appliedFicName.value))
    }
    return terms.every(term => term)
  }),
)

const headers = [
  {
    title: `${t('nova.fic.ficId')}\n${t('nova.fic.customerNote')}`,
    key: 'ficConnectionId',
    sortable: false,
  },
  { title: 'VPN ID', key: 'vpnId', sortable: false, width: 120 },
  {
    title: t('nova.fic.referenceFicConnectionId'),
    key: 'referenceFicConnectionId',
    sortable: false,
    width: 130,
  },
  { title: t('nova.details.orderId'), key: 'orderId', sortable: false },
  { title: t('nova.details.resourceStatus'), key: 'resourceStatus', sortable: false, width: 130 },
  { title: t('nova.details.updateTime'), key: 'updateTime', sortable: false },
  { title: '', key: 'action', sortable: false, width: 100 },
]
const items = computed(() =>
  filteredFicConnections.value.map(fic => ({
    ficConnectionId: fic.ficConnectionId,
    customerNote: fic.customerNote,
    vpnId: fic?.vpnId,
    referenceFicConnectionId: fic?.referenceFicConnectionId,
    orderId: fic?.orderId,
    resourceStatus: fic.resourceStatus,
    updateTime: formatDateTime(fic.updateTime),
  })),
)

const moveToOrder = () => {
  return navigateTo({
    name: RouteName.Order.List,
    params: { tenantId: tenantId.value },
    query: { resourceType: OrderResourceTypes.Fic },
  })
}
const moveToCreate = () => {
  return navigateTo({ name: RouteName.FicConnection.Create, params: { tenantId: tenantId.value } })
}
const handleSearch = () => {
  appliedFicId.value = [...ficIdFilterInput.value]
  appliedFicName.value = ficNameFilterInput.value

  if (isEqual(routeQuery.value, ficConnectionsQuery.value)) {
    // パスクエリの変更がない場合は直接 getFicConnectionList を実行する
    getFicConnectionList(ficConnectionsQuery.value)
  } else {
    router.push({ query: ficConnectionsQuery.value })
  }
}
const handleQueryClear = () => {
  // クリアボタン押下後、検索ボタン押下時にはじめてフィルタが実行される
  ficConnectionsQuery.value = { resourceStatus: undefined }
  ficIdFilterInput.value = []
  ficNameFilterInput.value = ''
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
    { ...ficConnectionsQuery.value },
  ),
)
const changeRouteQuery = () => {
  getFicConnectionList(routeQuery.value)
}
const updateQueryResourceStatus = (status: string | string[]) => {
  ficConnectionsQuery.value = { resourceStatus: Object.values(ResourceStatusTypes).filter(v => status.includes(v)) }
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
        <NovaCustomButton class="ml-4" append-icon="mdi-chevron-right" @click="moveToCreate">
          {{ t('nova.common.createNew') }}
        </NovaCustomButton>
      </div>
    </NovaPageHeader>

    <NovaSearchFilter class="search-filter" @clear="handleQueryClear" @search="handleSearch">
      <div class="d-flex flex-column align-start ga-4">
        <div class="flex-flex-start-center ga-4">
          <NovaSearchInput
            v-model="ficIdFilterInput"
            type="select"
            :options="ficIdOptions"
            :label="t('nova.fic.ficId')"
          />
          <NovaSearchInput v-model="ficNameFilterInput" type="input" :label="t('nova.fic.customerNote')" />
        </div>
        <NovaSearchInput
          :model-value="ficConnectionsQuery.resourceStatus ?? []"
          type="checkbox"
          :options="resourceStatusOptions"
          :label="t('nova.details.resourceStatus')"
          multiple
          @update:model-value="updateQueryResourceStatus"
        />
      </div>
    </NovaSearchFilter>

    <NovaPaginationHeader :total="filteredFicConnections.length" />

    <NovaDataTable :headers="headers" :items="items" height="67vh">
      <template #[`header.referenceFicConnectionId`]="{ column }">
        <span class="d-inline-flex align-center ga-1">
          {{ column.title }}
          <NovaHelpTooltip icon="help" size="15">
            {{ t('nova.fic.help.referenceFicConnectionId') }}
          </NovaHelpTooltip>
        </span>
      </template>
      <template #[`item.ficConnectionId`]="{ item }">
        <NuxtLink :to="{ name: RouteName.FicConnection.Detail, params: { tenantId, id: item.ficConnectionId } }">
          {{ item.ficConnectionId }}
        </NuxtLink>
        <div class="text-break">{{ item.customerNote }}</div>
      </template>
      <template #[`item.vpnId`]="{ item }">
        <NuxtLink v-if="item.vpnId" :to="{ name: RouteName.Vpn.Detail, params: { tenantId, id: item.vpnId } }">
          {{ item.vpnId }}
        </NuxtLink>
        <span v-else>-</span>
      </template>
      <template #[`item.referenceFicConnectionId`]="{ item }">
        {{ item.referenceFicConnectionId || '-' }}
      </template>
      <template #[`item.orderId`]="{ item }">
        <NuxtLink v-if="item.orderId" :to="{ name: RouteName.Order.Detail, params: { tenantId, id: item.orderId } }">
          {{ item.orderId }}
        </NuxtLink>
        <span v-else>-</span>
      </template>
      <template #[`item.resourceStatus`]="{ item }">
        <NovaResourceStatusTag v-if="item.resourceStatus" :status="item.resourceStatus" />
        <span v-else>-</span>
      </template>
      <template #[`item.action`]="{ item }">
        <NovaCustomButton
          append-icon="mdi-chevron-right"
          outlined
          size="small"
          @click="navigateTo({ name: RouteName.FicConnection.Detail, params: { tenantId, id: item.ficConnectionId } })"
        >
          {{ t('nova.common.detail') }}
        </NovaCustomButton>
      </template>
    </NovaDataTable>
  </div>
</template>
