<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)
const ficConnectionId = computed(() => route.params.id as string)

const { getRouteAdvertisementText } = useFicConnections()
const { ficConnection, getFicConnection } = useGetFicConnection()
const { ficRoutes, getFicRoutes } = useGetFicRoutes()

const basicInformationHeaders = [
  { text: t('fic.ficId'), key: 'ficConnectionId' },
  { text: t('fic.customerNote'), key: 'customerNote' },
  { text: 'VPN ID', key: 'vpnId' },
  { text: t('fic.routeAdvertisement'), key: 'routeAdvertisement', width: 230 },
  { text: t('fic.referenceFicConnectionId'), key: 'referenceFicConnectionId' },
  { text: t('fic.bandwidth'), key: 'bandwidth' },
]

const RouterHeaders = [
  { text: t('fic.prefix'), key: 'prefix', width: 300 },
  { text: t('fic.nextHop'), key: 'nextHop' },
  { text: t('fic.asPath'), key: 'asPath' },
  { text: t('fic.med'), key: 'med', width: 180 },
]

const activeRouterPagination = ref({ limit: 10, page: 1 })
const activeRouterList = computed(() => ficRoutes.value?.responseBody?.activeRouterReceiveRoutes ?? [])
const activeRouterTableList = computed(() => {
  const start = (activeRouterPagination.value.page - 1) * activeRouterPagination.value.limit
  const end = start + activeRouterPagination.value.limit
  return activeRouterList.value.slice(start, end)
})
const handleActiveRouterLimitChange = (limit: number) => {
  activeRouterPagination.value = { limit, page: 1 }
}

const standbyRouterPagination = ref({ limit: 10, page: 1 })
const standbyRouterList = computed(() => ficRoutes.value?.responseBody?.standbyRouterReceiveRoutes ?? [])
const standbyRouterTableList = computed(() => {
  const start = (standbyRouterPagination.value.page - 1) * standbyRouterPagination.value.limit
  const end = start + standbyRouterPagination.value.limit
  return standbyRouterList.value.slice(start, end)
})
const handleStandbyRouterLimitChange = (limit: number) => {
  standbyRouterPagination.value = { limit, page: 1 }
}

onBeforeMount(() => {
  getFicConnection(ficConnectionId.value)
  getFicRoutes(ficConnectionId.value)
})
</script>

<template>
  <CardContainer>
    <!-- 基本情報 -->
    <InnerCard :title="t('monitorings.basicInformation')">
      <SeparatedTable
        v-if="ficConnection"
        :headers="basicInformationHeaders"
        :items="[ficConnection]"
        :key-items="['ficConnectionId']"
      >
        <template #ficConnectionId="{ data }">
          <NuxtLink :to="`/tenants/${tenantId}/fic-connections/${data}`">{{ data }}</NuxtLink>
        </template>
        <template #vpnId="{ data }">
          <NuxtLink :to="`/tenants/${tenantId}/vpns/${data}`">{{ data }}</NuxtLink>
        </template>
        <template #routeAdvertisement="{ row }">
          <div>{{ getRouteAdvertisementText(row.routeAdvertisement) }}</div>
        </template>
      </SeparatedTable>
    </InnerCard>
    <!-- アクティブルーター -->
    <InnerCard :title="t('monitorings.activeRouter')">
      <PaginationHeader
        class="pt-3"
        :limit="activeRouterPagination.limit"
        :page="activeRouterPagination.page"
        :total="activeRouterList.length"
        @update:limit="handleActiveRouterLimitChange"
      />
      <StripedTable :headers="RouterHeaders" :items="activeRouterTableList" />
      <PaginationFooter
        v-model:page="activeRouterPagination.page"
        :limit="activeRouterPagination.limit"
        :total="activeRouterList.length"
      />
    </InnerCard>
    <!-- スタンバイルーター -->
    <InnerCard :title="t('monitorings.standbyRouter')">
      <PaginationHeader
        class="pt-3"
        :limit="standbyRouterPagination.limit"
        :page="standbyRouterPagination.page"
        :total="standbyRouterList.length"
        @update:limit="handleStandbyRouterLimitChange"
      />
      <StripedTable :headers="RouterHeaders" :items="standbyRouterTableList" />
      <PaginationFooter
        v-model:page="standbyRouterPagination.page"
        :limit="standbyRouterPagination.limit"
        :total="standbyRouterList.length"
      />
    </InnerCard>
  </CardContainer>
</template>
