<script lang="ts" setup>
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { CircuitTypes } from '@/api/constants'
import { IconTypes } from '@/components/icons/constants'
import { TenantPages, MonitoringPages } from '@/components/sidebar/constants'
import type { SortOption } from '@/components/table/types'
import type { QueryType } from '@/components/monitoring/types'

const ServiceList = [CircuitTypes.Ipoe, CircuitTypes.Guarantee]

const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)
const { t } = useI18n()

const { alertCount, getAlertCount } = useGetAlertCount()
const { healthStatusCount, getHealthStatusCount } = useGetHealthStatusCount()
const { trafficTrendsSummary, trafficTrendsSummaryQuery, getTrafficTrendsSummary } = useGetTrafficTrendsSummary()
const { terminalIdOptions, resourceSummaryTerminalList, getAllResourceSummaryTerminalList } =
  useGetAllResourceSummaryTerminalList()

const pagination = computed(() => ({
  limit: trafficTrendsSummaryQuery.value.limit || 10,
  page: (trafficTrendsSummaryQuery.value.offset ?? 0) + 1,
}))
const sortOption = computed<Partial<SortOption>>(() => ({
  sortKey: trafficTrendsSummaryQuery.value?.sortKey,
  direction: trafficTrendsSummaryQuery.value?.direction,
}))
const query = computed(() => ({
  service: trafficTrendsSummaryQuery.value?.circuitType,
  keyword: trafficTrendsSummaryQuery.value?.customerNote || '',
  terminalId: trafficTrendsSummaryQuery.value?.terminalId,
}))

const filteredTerminalListOptions = computed(() =>
  terminalIdOptions.value.filter(option => query.value.terminalId?.includes(option.value)).map(option => option.text),
)

const handleQueryUpdate = (newQuery: QueryType) => {
  if (Array.isArray(newQuery.service)) {
    return
  }
  trafficTrendsSummaryQuery.value = {
    ...trafficTrendsSummaryQuery.value,
    circuitType: ServiceList.find(key => newQuery.service === key),
    customerNote: newQuery.keyword || undefined,
  }
}
const handleQueryClear = () => {
  trafficTrendsSummaryQuery.value = {
    ...trafficTrendsSummaryQuery.value,
    circuitType: undefined,
    customerNote: undefined,
    terminalId: undefined,
  }
}
const handleTerminalIdChange = (terminalId?: string | string[]) => {
  const newTerminalId = (Array.isArray(terminalId) ? terminalId : [terminalId]).filter(Boolean)
  trafficTrendsSummaryQuery.value = {
    ...trafficTrendsSummaryQuery.value,
    terminalId: 0 < newTerminalId.length ? newTerminalId : undefined,
  }
}

const handleSearch = () => {
  getTrafficTrendsSummary({
    ...trafficTrendsSummaryQuery.value,
    offset: 0,
  })
}
const handleSort = (option?: SortOption) => {
  getTrafficTrendsSummary({
    ...trafficTrendsSummaryQuery.value,
    sortKey: option?.sortKey,
    direction: option?.direction,
  })
}
const handleChangePage = (page: number) => {
  getTrafficTrendsSummary({ ...trafficTrendsSummaryQuery.value, offset: page - 1 })
}

const moveToOperationStatus = async () => {
  await navigateTo({ path: `/tenants/${tenantId.value}/${TenantPages.Monitoring}/${MonitoringPages.OperationStatus}` })
}
const moveToAlert = async () => {
  await navigateTo({ path: `/tenants/${tenantId.value}/${TenantPages.Monitoring}/${MonitoringPages.AlertDetails}` })
}

onBeforeMount(() => {
  getAlertCount({ startDate: dayjs().subtract(1, 'months').format('YYYY-MM-DD') })
  getHealthStatusCount()
  getTrafficTrendsSummary({})
  getAllResourceSummaryTerminalList()
})
</script>

<template>
  <div>
    <CardContainer class="mb-5">
      <div class="mb-3 flex-flex-start-center">
        <SvgIcon :type="IconTypes.AlertChart" color="secondary" />
        <div class="ml-2 text-lg">{{ t('summary.alertStatus') }}</div>
      </div>
      <div class="grid">
        <!-- 運用状況 -->
        <CircuitStatusCard :title="t('summary.operationStatus')" @click="moveToOperationStatus">
          <HealthStatusCountChart v-if="!!healthStatusCount" :data="healthStatusCount" />
        </CircuitStatusCard>
        <!-- 1か月のアラート発生状況 -->
        <CircuitStatusCard :title="t('summary.alert')" @click="moveToAlert">
          <AlertCountChart v-if="!!alertCount" :data="alertCount" />
        </CircuitStatusCard>
      </div>
    </CardContainer>
    <CardContainer>
      <div class="mb-2 flex-flex-start-center">
        <SvgIcon class="pt-1" :type="IconTypes.TrafficStatus" color="secondary" />
        <div class="ml-2 text-lg">{{ t('summary.trafficStatus') }}</div>
      </div>
      <div class="mb-5 flex-flex-start-center">
        <div class="text-secondary">{{ t('summary.trafficTrends') }}</div>
        <HelpTooltip class="ml-2 mt-1" size="smallMiddle" :content-width="430">
          <div class="text-pre-wrap text-sm">{{ t('summary.help.trafficTrends') }}</div>
        </HelpTooltip>
      </div>
      <!-- 検索 -->
      <MonitoringFilter
        :service-type-list="ServiceList"
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
          <span>{{ filteredTerminalListOptions.join(', ') }}</span>
        </template>
      </MonitoringFilter>
      <div class="overflow-auto pa-5 bg-secondary text-black rounded-lg">
        <TrafficTrendSummaryTable
          :traffic-trends-summary="trafficTrendsSummary?.trafficTrends ?? []"
          :terminal-list="resourceSummaryTerminalList"
          :sort="sortOption"
          :tenant-id="tenantId"
          @sort="handleSort"
        />
        <PaginationFooter
          :page="pagination.page"
          :limit="pagination.limit"
          :total="trafficTrendsSummary?.total"
          @update:page="handleChangePage"
        />
      </div>
    </CardContainer>
  </div>
</template>

<style lang="scss" scoped>
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 0.75rem;
}
</style>
