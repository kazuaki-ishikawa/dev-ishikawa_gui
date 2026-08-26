<script lang="ts" setup>
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import { AlertNameTypes, AlertResourceTypes } from '@/api/alerts/constants'
import type { AlertListQuery, AlertNameType } from '@/api/alerts/types'
import { HealthStatus } from '@/api/healthStatus/constants'
import { IconTypes } from '@/components/icons/constants'
import type { QueryType } from '@/components/monitoring/types'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const { terminalIdOptions, resourceSummaryTerminalList, getAllResourceSummaryTerminalList } =
  useGetAllResourceSummaryTerminalList()
const { alertList, alertListQuery, alertHeaders, alertItems, alertSortOption, sortAlert, getAlertList } =
  useGetAlertList()
const { getHealthStatus } = useGetHealthStatus()

const Tabs = {
  Unsolved: { text: t('alerts.unsolvedAlerts'), name: 'unsolved', bg: 'error' as const },
  Resolved: { text: t('alerts.resolvedAlerts'), name: 'resolved', bg: 'info' as const },
} as const
const tabName = computed(() => (route.query.resolved === 'true' ? Tabs.Resolved.name : Tabs.Unsolved.name))
const handleTabNameChange = (value: 'unsolved' | 'resolved') => {
  routerPushQuery({ ...alertListQuery.value, resolved: `${value === Tabs.Resolved.name}`, offset: 0 })
}

const pagination = computed(() => ({
  limit: Number(route.query.limit) || 10,
  page: Number(route.query.page) || 1,
}))
const selectedTerminal = computed(
  () => terminalIdOptions.value.find(option => option.value === query.value.terminalId)?.text,
)

type TableItemType = {
  timestamp: string
  resolvedTime: string
  resourceType: string
  resourceLink: string
  info: string
  terminalId: string
  customerNote: string
  resourceId: string
  alertName: AlertNameType
  resolved: boolean
  terminalPath?: string
}
const convertedAlertItems = ref<TableItemType[]>([])
watch(
  () => alertItems.value,
  async () => {
    // alertName: IpsecDown かつ healthStatus.guarantee.guaranteeStatus === OK のものを除外
    // ipsecDown アラートの terminalId 一覧を取得
    const ipsecAlertTerminalIds = [
      ...new Set(
        alertItems.value.filter(alert => alert.alertName === AlertNameTypes.IpsecDown).map(alert => alert.terminalId),
      ),
    ]
    // ipsecDown アラートが起きている terminalId の terminal の guaranteeStatus を取得
    const healthStatuses = await Promise.all(
      ipsecAlertTerminalIds.map(async terminalId => {
        try {
          const response = await getHealthStatus(terminalId)
          const status = response.healthStatuses.find(hs => hs.terminal.terminalId === terminalId)
          return { terminalId, guaranteeStatus: status?.guarantee?.guaranteeStatus }
        } catch {
          return { terminalId, guaranteeStatus: undefined }
        }
      }),
    )
    // guaranteeStatus が OK の terminalId を持つ alertItems を除外
    const filtered = alertItems.value.filter(alert => {
      if (alert.alertName !== AlertNameTypes.IpsecDown) {
        return true
      }
      const status = healthStatuses.find(s => s.terminalId === alert.terminalId)
      return status?.guaranteeStatus !== HealthStatus.OK
    })
    convertedAlertItems.value = filtered.map(alert => ({
      ...alert,
      terminalPath: convertTerminalDetailPath(resourceSummaryTerminalList.value, alert.terminalId),
    }))
  },
)

const query = computed(() => ({
  service: alertListQuery.value.resourceType ?? [],
  keyword: alertListQuery.value.customerNote ?? '',
  terminalId: alertListQuery.value.terminalId ?? '',
}))
const handleQueryUpdate = (newQuery: QueryType) => {
  if (!Array.isArray(newQuery.service)) {
    return
  }
  const resourceType = Object.values(AlertResourceTypes).filter(type => newQuery.service?.includes(type))
  alertListQuery.value = {
    ...alertListQuery.value,
    resourceType: 0 < resourceType.length ? resourceType : undefined,
    customerNote: newQuery.keyword || undefined,
  }
}
const handleTerminalIdChange = (terminalId?: string | string[]) => {
  if (Array.isArray(terminalId)) {
    return
  }
  alertListQuery.value = {
    ...alertListQuery.value,
    terminalId: terminalId || undefined,
  }
}
const handleQueryClear = () => {
  alertListQuery.value = {
    ...alertListQuery.value,
    resourceType: undefined,
    customerNote: undefined,
    terminalId: undefined,
  }
}

const routerPushQuery = (query: AlertListQuery) => {
  router.push({ query: { ...query, offset: undefined, page: (query.offset ?? 0) + 1 } })
}
const handleSearch = () => {
  const newQuery = { ...alertListQuery.value, offset: 0 }
  // パスクエリの変更がない場合は直接 getAlertList を実行する
  if (isEqual(routeQuery.value, newQuery)) {
    getAlertList(newQuery)
  } else {
    routerPushQuery(newQuery)
  }
}

const handleChangeLimit = (limit?: number) => {
  routerPushQuery({ ...alertListQuery.value, limit, offset: 0 })
}
const handleChangePage = (page: number) => {
  routerPushQuery({ ...alertListQuery.value, offset: page - 1 })
}

const routeQuery = computed(() =>
  ['limit', 'page', 'resourceType', 'terminalId', 'resolved', 'customerNote', 'sortKey', 'direction'].reduce(
    (query, key) => {
      const value = route.query[key]
      if (['limit', 'page'].includes(key) && !isNaN(Number(value))) {
        if (key === 'page') {
          return Object.assign(query, { offset: Number(value) < 2 ? 0 : Number(value) - 1 })
        }
        return Object.assign(query, { [key]: Number(value) })
      } else if (key === 'resolved') {
        return Object.assign(query, { [key]: value ?? `${tabName.value === 'resolved'}` })
      } else if (key === 'resourceType' && typeof value === 'string') {
        return Object.assign(query, { [key]: [value] })
      } else {
        return Object.assign(query, { [key]: value })
      }
    },
    {},
  ),
)

watch(
  () => route.query,
  () => {
    getAlertList(routeQuery.value)
  },
  { immediate: true },
)
onBeforeMount(() => {
  getAllResourceSummaryTerminalList()
})
</script>

<template>
  <CardContainer>
    <div class="mb-3 flex-flex-start-center">
      <SvgIcon :type="IconTypes.Alert" color="secondary" />
      <div class="ml-2 text-lg">{{ t('sideBar.alertDetails') }}</div>
    </div>

    <!-- 検索 -->
    <MonitoringFilter
      :service-type-list="Object.values(AlertResourceTypes)"
      :query="query"
      @update:query="handleQueryUpdate"
      @clear="handleQueryClear"
      @search="handleSearch"
    >
      <template #input>
        <NoBorderSelectForm
          size="middle"
          :value="query.terminalId"
          :options="terminalIdOptions"
          :placeholder="`${t('monitorings.terminalId')} / ${t('monitorings.terminalName')}`"
          @update:value="handleTerminalIdChange"
        />
      </template>
      <template #text>
        <span>{{ t('monitorings.terminalId') }}</span>
        <span class="px-1">:</span>
        <span>{{ selectedTerminal }}</span>
      </template>
    </MonitoringFilter>

    <CustomTab :tabs="Object.values(Tabs)" :current-tab-name="tabName" divider @click="handleTabNameChange">
      <div class="pt-3">
        <PaginationHeader
          :page="pagination.page"
          :limit="pagination.limit"
          :total="alertList?.total ?? 0"
          @update:limit="handleChangeLimit"
        />
        <SortableTable
          :headers="alertHeaders"
          :items="convertedAlertItems"
          :key-items="['timestamp', 'alertName', 'terminalId']"
          :sort="alertSortOption"
          @sort="sortAlert"
        >
          <template #terminalId="{ row }">
            <NuxtLink v-if="!!row.terminalPath" :to="row.terminalPath">{{ row.terminalId }}</NuxtLink>
            <span v-else>{{ row.terminalId }}</span>
          </template>
          <template #resourceId="{ row }">
            <NuxtLink :to="row.resourceLink">{{ row.resourceId }}</NuxtLink>
          </template>
          <template #customerNote="{ row }">
            <div class="text-truncate" :title="row.customerNote">{{ row.customerNote }}</div>
          </template>
          <template #resourceType="{ data }">
            <div class="text-xs">{{ data }}</div>
          </template>
          <template #info="{ data }">
            <div class="text-truncate">{{ data }}</div>
          </template>
        </SortableTable>
        <PaginationFooter
          :page="pagination.page"
          :limit="pagination.limit"
          :total="alertList?.total ?? 0"
          @update:page="handleChangePage"
        />
      </div>
    </CustomTab>
  </CardContainer>
</template>
