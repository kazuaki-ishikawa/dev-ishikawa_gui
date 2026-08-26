<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { SortDirectionTypes, CircuitTypes } from '@/api/constants'
import type { ResourceSummaryTerminalListResponse } from '@/api/terminals/types'
import { AccessTypes } from '@/api/trafficTrends/constants'
import type { AccessType, TrafficTrendSummaryType, TrafficTrendSummaryCircuitType } from '@/api/trafficTrends/types'
import { IconTypes } from '@/components/icons/constants'
import type { SortOption } from '@/components/table/types'
import { MonitoringPages, TenantPages } from '@/components/sidebar/constants'
import { TrafficDetailChartColors } from '@/components/constants'

type RemovedInternetVpnTrafficTrendSummaryCircuitType = TrafficTrendSummaryCircuitType<
  Exclude<AccessType, typeof AccessTypes.InternetVpn>
>

type PropsType = {
  trafficTrendsSummary: TrafficTrendSummaryType[]
  terminalList: ResourceSummaryTerminalListResponse
  sort: Partial<SortOption>
  tenantId: string
}
const props = defineProps<PropsType>()
type Emits = {
  (e: 'sort', sort?: SortOption): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()

const convertBps = (bpsString?: string) => {
  if (!bpsString) {
    return '-'
  }
  const bps = Number(bpsString)
  const conversionFactor = 1000
  if (bps / conversionFactor < 2) {
    return bps
  }
  if (bps / conversionFactor ** 2 < 2) {
    return Math.round(bps / conversionFactor) + 'k'
  }
  return Math.round((bps * 10) / conversionFactor ** 2) / 10 + 'M'
}

const calculateAverageUsage = (avarage?: string, rateLimit?: string) => {
  if (!avarage || !rateLimit) {
    return '-'
  }
  const rateLimitNumber = convertBandwidthToUnit(rateLimit)
  return Math.round((Number(avarage) * 100) / rateLimitNumber) + '%'
}

const headers = [
  {
    rows: [
      { text: t('summary.terminalId'), key: 'terminalId', sortable: true },
      { text: t('summary.customerNote'), key: 'customerNote', sortable: true },
    ],
  },
  {
    rows: [{ text: t('summary.circuitPriority'), key: 'circuitPriority', sortable: false }],
  },
  {
    rows: [
      { text: t('summary.circuitId'), key: 'circuitId', sortable: false },
      { text: t('summary.circuitType'), key: 'circuitType', sortable: false },
    ],
  },
  {
    rows: [{ text: t('summary.networkType'), key: 'networkType', sortable: false }],
    help: t('summary.help.networkType'),
  },
  {
    rows: [{ text: t('summary.averageBandwidth'), key: 'averageBandwidth', sortable: false }],
    help: t('summary.help.averageBandwidth'),
  },
  {
    rows: [{ text: t('summary.contractBandwidth'), key: 'contractBandwidth', sortable: false }],
  },
  {
    rows: [{ text: t('summary.averageUsage'), key: 'averageUsage', sortable: false }],
    help: t('summary.help.averageUsage'),
  },
  {
    rows: [{ text: t('summary.trafficGraph'), key: 'trafficGraph', sortable: false }],
    help: t('summary.help.trafficGraph'),
    legend: true,
  },
]

const getColor = (accessType?: AccessType): string =>
  accessType === AccessTypes.Internet
    ? TrafficDetailChartColors.guarantee.internet
    : accessType === AccessTypes.Vpn
      ? TrafficDetailChartColors.guarantee.vpn
      : TrafficDetailChartColors.ipoe
const getMarker = (accessType?: AccessType): { symbol: string } | boolean =>
  accessType === AccessTypes.Internet
    ? { symbol: 'square' }
    : accessType === AccessTypes.Vpn
      ? { symbol: 'diamond' }
      : { symbol: 'circle' }

const chartName = {
  ipoe: `${t('summary.ipoe')} ${t('trafficDetails.internet+vpn')} ${t('summary.maxOfDay')}`,
  guarantee: {
    internet: `${t('summary.guarantee')} ${t('trafficDetails.internet')} ${t('summary.maxOfDay')}`,
    vpn: `${t('summary.guarantee')} ${t('trafficDetails.vpn')} ${t('summary.maxOfDay')}`,
  },
  rateLimit: {
    internet: `${t('summary.guarantee')} ${t('trafficDetails.internet')} ${t('trafficDetails.rateLimit')}`,
    vpn: `${t('summary.guarantee')} ${t('trafficDetails.vpn')} ${t('trafficDetails.rateLimit')}`,
  },
}
const legends = computed(() => [
  {
    name: chartName.rateLimit.internet,
    color: getColor(AccessTypes.Internet),
  },
  { name: chartName.guarantee.internet, color: getColor(AccessTypes.Internet), type: 'square' },
  {
    name: chartName.rateLimit.vpn,
    color: getColor(AccessTypes.Vpn),
  },
  { name: chartName.guarantee.vpn, color: getColor(AccessTypes.Vpn), type: 'diamond' },
  { name: chartName.ipoe, color: getColor(), type: 'circle' },
])
const items = computed(() =>
  props.trafficTrendsSummary.map(trend => {
    // ルーターのパス判定
    const terminalPath = convertTerminalDetailPath(props.terminalList, trend.terminalId)

    // accessType = internet+vpn のデータを除外
    const removedInternetVpnTrendCircuits = trend.circuits.filter(
      (circuit): circuit is RemovedInternetVpnTrafficTrendSummaryCircuitType =>
        circuit.accessType !== AccessTypes.InternetVpn,
    )

    // 回線種別毎のcircuitsのリストを作成
    const internet = removedInternetVpnTrendCircuits.find(
      circuit => circuit.circuitType === CircuitTypes.Guarantee && circuit.accessType === AccessTypes.Internet,
    )
    const vpn = removedInternetVpnTrendCircuits.find(
      circuit => circuit.circuitType === CircuitTypes.Guarantee && circuit.accessType === AccessTypes.Vpn,
    )
    const ipoe = removedInternetVpnTrendCircuits.find(circuit => circuit.circuitType === CircuitTypes.Ipoe)
    const guaranteeId = internet?.circuitId || vpn?.circuitId

    // ギャランティアクセス + IPoE の場合
    const showGridRow3 = !!guaranteeId && !!ipoe

    const series = removedInternetVpnTrendCircuits
      .filter(circuit => !showGridRow3 || circuit.circuitType === CircuitTypes.Guarantee) // アクセス回線＜メイン＞のみグラフに表示する
      .map(circuit => {
        const name = circuit?.accessType ? chartName.guarantee[circuit.accessType] : chartName.ipoe
        const data =
          circuit.maxBpsList?.map(maxBps => [
            new Date(`${maxBps.date}T00:00:00+09:00`).getTime(),
            Number(maxBps.max),
          ]) ?? []
        const color = getColor(circuit?.accessType)
        const marker = getMarker(circuit?.accessType)
        return { name, data, color, marker }
      })
    const rateLimitSeries = removedInternetVpnTrendCircuits
      .filter(circuit => !!circuit?.accessType && !!circuit?.rateLimit)
      .map(circuit => {
        const name = chartName.rateLimit[circuit.accessType!]
        const data =
          circuit.maxBpsList?.map(maxBps => [
            new Date(`${maxBps.date}T00:00:00+09:00`).getTime(),
            convertBandwidthToUnit(circuit.rateLimit as string),
          ]) ?? []
        return { name, data, color: TrafficDetailChartColors.guarantee[circuit.accessType!], marker: false }
      })
    const chartOptions = {
      title: '',
      chart: { backgroundColor: 'none', height: 250 },
      accessibility: { enabled: false },
      yAxis: {
        title: { enabled: false },
        min: 0,
      },
      xAxis: {
        type: 'datetime',
        labels: {
          format: '{value:%m/%d}',
          align: 'right',
        },
      },
      legend: { enabled: false },
      series: series.concat(rateLimitSeries),
      tooltip: {
        formatter: highchartsUnitFormatter(undefined, false),
      },
      navigation: {
        buttonOptions: {
          enabled: false,
        },
      },
      credits: {
        enabled: false,
      },
    }

    return { ...trend, terminalPath, chartOptions, guaranteeId, internet, vpn, ipoe, showGridRow3 }
  }),
)

const handleAscClick = (sortKey: string) => {
  const clear = props.sort?.direction === SortDirectionTypes.Asc && props.sort?.sortKey === sortKey
  const option = clear ? undefined : { sortKey, direction: SortDirectionTypes.Asc }
  emits('sort', option)
}
const handlDescClick = (sortKey: string) => {
  const clear = props.sort?.direction === SortDirectionTypes.Desc && props.sort?.sortKey === sortKey
  const option = clear ? undefined : { sortKey, direction: SortDirectionTypes.Desc }
  emits('sort', option)
}

const moveToTrafficDetails = async (terminalId: string) => {
  await navigateTo({
    path: `/tenants/${props.tenantId}/${TenantPages.Monitoring}/${MonitoringPages.TrafficDetails}`,
    query: { terminalId },
  })
}
</script>

<template>
  <div class="overflow-x-auto">
    <div class="header grid-gap">
      <div
        v-for="header in headers"
        :key="header.rows.map(row => row.key).join('-')"
        class="header-cell flex-flex-start-center pl-2"
      >
        <div class="flex-grow-1" :class="{ 'flex-flex-start-center': header.legend || !!header.help }">
          <div v-for="row in header.rows" :key="row.key" class="flex-flex-start-center">
            <div class="flex-grow-1">{{ row.text }}</div>
            <IconButton
              v-if="row.sortable"
              :type="IconTypes.ArrowUp"
              :color="sort?.direction !== SortDirectionTypes.Asc || sort?.sortKey !== row.key ? undefined : 'primary'"
              size="small"
              class="mr-1"
              @click="handleAscClick(row.key)"
            />
            <IconButton
              v-if="row.sortable"
              :type="IconTypes.ArrowDown"
              :color="sort?.direction !== SortDirectionTypes.Desc || sort?.sortKey !== row.key ? undefined : 'primary'"
              size="small"
              class="mr-1"
              @click="handlDescClick(row.key)"
            />
          </div>
          <HelpTooltip v-if="header.help" color="white" size="smallMiddle" class="px-2 d-flex">
            {{ header.help }}
          </HelpTooltip>
          <div v-if="header.legend" class="legend ml-auto bg-white pt-1">
            <div
              v-for="legend in legends"
              :key="legend.name"
              class="text-black text-xs pb-1 px-2 flex-flex-start-center"
            >
              <LegendBar :type="legend.type" :color="legend.color" class="bar" />
              <div>{{ legend.name }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="table-container overflow-hidden">
      <div v-for="row in items" :key="row.terminalId" class="row">
        <div class="body-cell flex-flex-start-center px-2">
          <div>
            <!-- ルーターID -->
            <NuxtLink v-if="row.terminalPath" :to="row.terminalPath">{{ row.terminalId }}</NuxtLink>
            <span v-else>{{ row.terminalId }}</span>
            <!-- ルーター名 -->
            <div class="break-all">{{ row.customerNote }}</div>
          </div>
        </div>
        <!-- メイン/バックアップ -->
        <div class="grid-gap" :class="{ 'grid-rows-3': row.showGridRow3 }">
          <div class="body-cell flex-flex-start-center px-2" :class="{ 'row-span-2': row.showGridRow3 }">
            {{ t('terminals.primary') }}
          </div>
          <div v-if="!!row.guaranteeId && !!row.ipoe" class="body-cell flex-flex-start-center px-2">
            {{ t('terminals.secondary') }}
          </div>
        </div>
        <!-- アクセス回線ID -->
        <!-- アクセス回線種別 -->
        <div class="grid-gap" :class="{ 'grid-rows-3': row.showGridRow3 }">
          <!-- ギャランティアクセス -->
          <div
            v-if="!!row.guaranteeId"
            class="body-cell px-2 flex-flex-start-center"
            :class="{ 'row-span-2': row.showGridRow3 }"
          >
            <div>
              <NuxtLink :to="`/tenants/${tenantId}/guarantees/circuits/${row.guaranteeId}`">
                {{ row.guaranteeId }}
              </NuxtLink>
              <div class="text-sm text-pre-wrap">
                {{ t('trafficDetails.guarantee') }}
              </div>
            </div>
          </div>
          <!-- ベストエフォートIPoEアクセス -->
          <div v-if="!!row.ipoe" class="body-cell px-2 flex-flex-start-center">
            <div>
              <NuxtLink :to="`/tenants/${tenantId}/ipoes/${row.ipoe?.circuitId}`">{{ row.ipoe?.circuitId }}</NuxtLink>
              <div class="text-sm text-pre-wrap">{{ t('trafficDetails.ipoe') }}</div>
            </div>
          </div>
        </div>
        <!-- 接続先ネットワーク -->
        <div class="grid-gap" :class="{ 'grid-rows-3': row.showGridRow3 }">
          <template v-if="row.guaranteeId">
            <div class="body-cell flex-flex-start-center text-sm px-2">
              {{ t('terminals.internet') }}
            </div>
            <div class="body-cell flex-flex-start-center text-sm px-2">
              {{ t('terminals.vpn') }}
            </div>
          </template>
          <div v-if="!!row.ipoe" class="body-cell flex-flex-start-center text-sm px-2">
            {{ `${t('terminals.internet')}+${t('terminals.vpn')}` }}
          </div>
        </div>
        <!-- 週平均帯域(bps) -->
        <div class="grid-gap" :class="{ 'grid-rows-3': row.showGridRow3 }">
          <template v-if="row.guaranteeId">
            <div class="body-cell flex-flex-start-center text-sm px-2">
              {{ convertBps(row.internet?.average) }}
            </div>
            <div class="body-cell flex-flex-start-center text-sm px-2">
              {{ convertBps(row.vpn?.average) }}
            </div>
          </template>
          <div v-if="!!row.ipoe" class="body-cell flex-flex-start-center text-sm px-2">
            {{ convertBps(row.ipoe?.average) }}
          </div>
        </div>
        <!-- 契約帯域(bps) -->
        <div class="grid-gap" :class="{ 'grid-rows-3': row.showGridRow3 }">
          <template v-if="row.guaranteeId">
            <div class="body-cell flex-flex-start-center text-sm px-2">
              {{ row.internet?.rateLimit ?? '0M' }}
            </div>
            <div class="body-cell flex-flex-start-center text-sm px-2">
              {{ row.vpn?.rateLimit ?? '0M' }}
            </div>
          </template>
          <div v-if="!!row.ipoe" class="body-cell flex-flex-start-center px-2">-</div>
        </div>
        <!-- 週平均利用率 -->
        <div class="grid-gap" :class="{ 'grid-rows-3': row.showGridRow3 }">
          <template v-if="row.guaranteeId">
            <div class="body-cell flex-flex-start-center text-sm px-2">
              {{ calculateAverageUsage(row.internet?.average, row.internet?.rateLimit) }}
            </div>
            <div class="body-cell flex-flex-start-center text-sm px-2">
              {{ calculateAverageUsage(row.vpn?.average, row.vpn?.rateLimit) }}
            </div>
          </template>
          <div v-if="!!row.ipoe" class="body-cell flex-flex-start-center px-2">-</div>
        </div>
        <!-- グラフ -->
        <div class="body-cell">
          <CustomButton
            class="ma-1 ml-auto"
            :width="200"
            icon="right-arrow"
            :text="t('sideBar.trafficDetails')"
            @click="() => moveToTrafficDetails(row.terminalId)"
          />
          <highcharts class="mt-3" :options="row.chartOptions" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
$grid-columns: 130px 115px 130px 120px repeat(3, 82px) minmax(450px, 1fr);
$light-primary-color: rgb(var(--v-theme-light-primary));
$light-secondary-color: rgb(var(--v-theme-light-secondary));

.header {
  grid-template-columns: $grid-columns;
  color: #fff;
  font-size: 0.85rem;
}
.header-cell {
  border-left: 0.125rem solid $light-primary-color;
  margin-bottom: 0.5rem;
  margin-left: -0.2rem;
  &:first-child {
    border-left-color: transparent;
  }
}
.table-container {
  min-width: fit-content;
  border-radius: 0.75rem;
}
.row {
  display: grid;
  grid-template-columns: $grid-columns;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
  &:nth-child(odd) {
    .body-cell {
      background-color: $light-secondary-color;
    }
  }
  &:nth-child(even) {
    .body-cell {
      background-color: #fff;
    }
  }
  &:last-of-type {
    margin-bottom: 0;
  }
}
.break-all {
  word-break: break-all;
}
.grid-gap {
  display: grid;
  gap: 0.25rem;
}
.grid-rows-3 {
  grid-template-rows: repeat(3, minmax(0, 1fr));
}
.row-span-2 {
  grid-row: span 2 / span 2;
}

.legend {
  min-width: 320px;
  border-radius: 0.75rem;
  .bar {
    min-width: 32px;
    margin-right: 0.25rem;
  }
}
</style>
