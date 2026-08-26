<script lang="ts" setup>
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { CircuitTypes, TerminalTypes } from '@/api/constants'
import { BgpSessionOperationTypes, BgpSessionStatusTypes, ConnectionTypes } from '@/api/guarantees/constants'
import type { ConnectionType } from '@/api/guarantees/types'
import { AccessTypes } from '@/api/trafficTrends/constants'
import type { TrafficTrendsQuery } from '@/api/trafficTrends/types'
import { Situation, HealthStatus } from '@/api/healthStatus/constants'
import type { BgpPingHealthStatusType } from '@/api/healthStatus/types'
import { IconTypes } from '@/components/icons/constants'
import { TenantPages, MonitoringPages } from '@/components/sidebar/constants'

const statusDetailsRef = ref<HTMLElement>()
const alertHistoryRef = ref<HTMLElement>()

const { t } = useI18n()
const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)
const terminalId = computed(() => route.params.id as string)
const guaranteeId = computed(() => healthStatus.value?.guarantee?.guaranteeId ?? '')
const query = computed(() => ({ terminalId: terminalId.value }))

const { moveToSelfCheck } = useHealthStatus()
const { healthStatus, getHealthStatus } = useGetHealthStatus()
const { ficHealthStatuses, getFicHealthStatusList } = useGetFicHealthStatusList()

const { resourceSummaryTerminalList, getAllResourceSummaryTerminalList } = useGetAllResourceSummaryTerminalList()
const { alertHeaders, alertItems, alertSortOption, sortAlert, getAlertList } = useGetAlertList()
const { alertItems: resolvedAlertItems, getAlertList: getResolvedAlertList } = useGetAlertList()
const {
  trafficTrendsQuery: mainTrafficTrendsQuery,
  trafficTrends: mainTrafficTrends,
  getTrafficTrends: getMainTrafficTrends,
} = useGetTrafficTrends()
const {
  trafficTrendsQuery: backupTrafficTrendsQuery,
  trafficTrends: backupTrafficTrends,
  getTrafficTrends: getBackupTrafficTrends,
} = useGetTrafficTrends()
const { bgpSessionClear } = useBgpSessionClear()
const { bgpSessionStatus, getBgpSessionStatus } = useGetBgpSessionStatus()

const isRentalTerminal = computed(
  () => resourceSummaryTerminalList.value.terminals?.[0]?.terminalType === TerminalTypes.Rental,
)
const vpnId = computed(() => healthStatus.value?.vpn?.vpnId)

const convertedAlertItems = computed(() =>
  alertItems.value.map(alert => ({
    ...alert,
    terminalPath: convertTerminalDetailPath(resourceSummaryTerminalList.value, alert.terminalId),
  })),
)
const mainCircuitType = computed(() => {
  if (healthStatus.value?.guarantee?.guaranteeSituation === Situation.Main) {
    return CircuitTypes.Guarantee
  } else if (healthStatus.value?.ipoe?.ipoeSituation === Situation.Main) {
    return CircuitTypes.Ipoe
  } else {
    return CircuitTypes.Mobile
  }
})
const backupCircuitType = computed(() => {
  if (healthStatus.value?.ipoe?.ipoeSituation === Situation.Backup) {
    return CircuitTypes.Ipoe
  } else if (healthStatus.value?.mobile?.mobileSituation === Situation.Backup) {
    return CircuitTypes.Mobile
  } else {
    return null
  }
})

const mainTrafficTrendChart = computed(() => {
  const trendsCircuits =
    mainTrafficTrends.value?.trafficTrends?.filter(trend => trend.terminalId === terminalId.value)?.[0]?.circuits ?? []

  const mainCircuits = trendsCircuits.filter(circuit => circuit.circuitType === mainCircuitType.value)
  if (mainCircuitType.value !== CircuitTypes.Guarantee) {
    return { circuits: mainCircuits }
  }

  // インターネット・VPN両方契約ありの場合は internet+vpn
  const accessTypes = mainCircuits.map(circuit => circuit.accessType).filter(Boolean)
  const guaranteeAccessType = accessTypes.includes(AccessTypes.InternetVpn)
    ? AccessTypes.InternetVpn
    : accessTypes.includes(AccessTypes.Internet)
      ? AccessTypes.Internet
      : AccessTypes.Vpn
  const circuits = mainCircuits.filter(circuit => circuit.accessType === guaranteeAccessType)
  return { circuits, accessType: guaranteeAccessType }
})
const backupTrafficTrendChartCircuits = computed(() => {
  const trends = backupTrafficTrends.value?.trafficTrends.filter(trend => trend.terminalId === terminalId.value)
  const backupCircuits = trends?.[0]?.circuits?.filter(circuit => circuit.circuitType === backupCircuitType.value)
  return backupCircuits ?? []
})

const circuitHeaders = [
  { text: t('monitorings.status'), key: 'status' },
  { text: t('monitorings.resources'), key: 'resources' },
]
const circuitItems = computed(() => {
  const mobile = healthStatus.value?.mobile
  const ipoe = healthStatus.value?.ipoe
  const guarantee = healthStatus.value?.guarantee

  const main: Array<{ [key: string]: string }> = []
  const backup: Array<{ [key: string]: string }> = []
  if (mobile?.mobileSituation === Situation.Main) {
    main.push({ status: mobile.mobileStatus, resources: `${t('monitorings.mobile')} / ${mobile.mobileId}` })
  } else if (mobile?.mobileSituation === Situation.Backup) {
    backup.push({ status: mobile.mobileStatus, resources: `${t('monitorings.mobile')} / ${mobile.mobileId}` })
  }
  if (ipoe?.ipoeSituation === Situation.Main) {
    main.push({ status: ipoe.ipoeStatus, resources: `${t('monitorings.ipoe')} / ${ipoe.ipoeId}` })
  } else if (ipoe?.ipoeSituation === Situation.Backup) {
    backup.push({ status: ipoe.ipoeStatus, resources: `${t('monitorings.ipoe')} / ${ipoe.ipoeId}` })
  }
  if (guarantee?.guaranteeSituation === Situation.Main) {
    main.push({
      status: guarantee.guaranteeStatus,
      resources: `${t('monitorings.guarantee')} / ${guarantee.guaranteeId}`,
    })
  }

  return { main, backup }
})

const guaranteeStatusHeaders = [
  { text: t('monitorings.internetBgpStatus'), key: ConnectionTypes.Internet },
  { text: t('monitorings.vpnBgpStatus'), key: ConnectionTypes.Vpn },
]
const getGuaranteeBgpStatus = (bgpStatus?: BgpPingHealthStatusType) => {
  if (bgpStatus?.act === HealthStatus.OK && bgpStatus?.sby === HealthStatus.OK) {
    return HealthStatus.OK
  } else if (bgpStatus?.act === HealthStatus.NG && bgpStatus?.sby === HealthStatus.NG) {
    return HealthStatus.NG
  } else if (!bgpStatus?.act && !bgpStatus?.sby) {
    return '-'
  } else {
    return HealthStatus.Warning
  }
}

const guaranteeStatusItems = computed(() => {
  const guaranteeStatus = healthStatus.value?.guaranteeBgp
  return [
    {
      internet: getGuaranteeBgpStatus(guaranteeStatus?.internetBgpStatus),
      vpn: getGuaranteeBgpStatus(guaranteeStatus?.vpnBgpStatus),
    },
  ]
})

const vpnficHeaders = [
  { text: t('monitorings.status'), key: 'status' },
  { text: t('monitorings.resourceId'), key: 'resourceId' },
]
const vpnItems = computed(() => [
  {
    status: healthStatus.value?.vpn?.vpnStatus ?? '-',
    resourceId: vpnId.value ?? '-',
  },
])
const ficItems = computed(() => {
  const items = ficHealthStatuses.value
    .filter(ficHealthStatus => vpnId.value && ficHealthStatus.vpnId === vpnId.value)
    .map(ficHealthStatus => ({
      status: ficHealthStatus.ficStatus,
      resourceId: ficHealthStatus.ficId,
    }))
  return items.length === 0 ? [{ status: '-', resourceId: '-' }] : items
})

const bgpDisconnected = computed(() =>
  resolvedAlertItems.value.some(alert => alert.alertName === 'bgpDown' && alert.info === 'bgp-max-prefix-exceed'),
)

const scrollToAnchor = (element?: HTMLElement) => {
  const top = element?.offsetTop ?? 0
  scrollTo({ top, behavior: 'smooth' })
}
const reloadStatusData = () => {
  getHealthStatus(terminalId.value)
  getFicHealthStatusList()
  getMainTrafficTrends(mainTrafficTrendsQuery.value)
  if (backupCircuitType.value === CircuitTypes.Ipoe) {
    getBackupTrafficTrends(backupTrafficTrendsQuery.value)
  }
  if (guaranteeId.value) {
    getBgpSessionStatus(guaranteeId.value)
  }
}

const reloadMainChartData = (chartQuery: TrafficTrendsQuery) => {
  getMainTrafficTrends({ ...mainTrafficTrendsQuery.value, ...chartQuery })
}
const reloadBackupChartData = (chartQuery: TrafficTrendsQuery) => {
  getBackupTrafficTrends({ ...backupTrafficTrendsQuery.value, ...chartQuery })
}

const moveToAlertDetails = async () => {
  await navigateTo({
    path: `/tenants/${tenantId.value}/${TenantPages.Monitoring}/${MonitoringPages.AlertDetails}`,
    query: query.value,
  })
}
const handelMoveToSelfCheck = () => {
  moveToSelfCheck(tenantId.value, terminalId.value)
}
const moveToTrafficDetails = async () => {
  await navigateTo({
    path: `/tenants/${tenantId.value}/${TenantPages.Monitoring}/${MonitoringPages.TrafficDetails}`,
    query: query.value,
  })
}
const moveToMydocomo = async () => {
  await navigateTo('https://www.docomo.ne.jp/mydocomo/', {
    external: true,
    open: { target: '_blank', windowFeatures: { noopener: true, noreferrer: true } },
  })
}

const headerType = ref<ConnectionType>()
const handleHeaderClick = (clickedHeader: ConnectionType) => {
  headerType.value = headerType.value !== clickedHeader ? clickedHeader : undefined
}

// BGPセッションクリア不可条件
// vpnBgpStatusがact,sbyどちらかがNG以外となっていること
// bgpSessionStatusがprocessingであること
// requestTimeから1時間経過していないこと
const bgpSessionClearButtonDisabled = computed(() => {
  const requestTime = bgpSessionStatus.value?.requestTime
  return (
    healthStatus.value?.guaranteeBgp?.vpnBgpStatus?.act !== HealthStatus.NG ||
    healthStatus.value?.guaranteeBgp?.vpnBgpStatus?.sby !== HealthStatus.NG ||
    bgpSessionStatus.value?.status === BgpSessionStatusTypes.Processing ||
    (!!requestTime && dayjs().diff(dayjs(requestTime), 'hour') < 1)
  )
})
const handleBgpSessionClear = async () => {
  bgpSessionStatus.value = await bgpSessionClear(guaranteeId.value, { operation: BgpSessionOperationTypes.Reset })
}

onMounted(async () => {
  getAlertList({ ...query.value })

  await getHealthStatus(terminalId.value)
  await getMainTrafficTrends({ terminalId: terminalId.value })
  if (backupCircuitType.value === CircuitTypes.Ipoe) {
    await getBackupTrafficTrends({ terminalId: terminalId.value })
  }
  getFicHealthStatusList()
  getAllResourceSummaryTerminalList({ terminalId: [terminalId.value] })
  if (guaranteeId.value) {
    getBgpSessionStatus(guaranteeId.value)

    // BGP断メッセージの表示判定のために未回復のアラートを取得する
    await getResolvedAlertList({ ...query.value, resolved: 'false' })
  }
})
</script>

<template>
  <div>
    <!-- アンカーボタン -->
    <div class="mb-3 flex-flex-start-center">
      <AnchorButton
        class="mr-3"
        :icon="IconTypes.SearchData"
        :label="t('monitorings.statusDetails')"
        @click="scrollToAnchor(statusDetailsRef)"
      />
      <AnchorButton
        :icon="IconTypes.Alert"
        :label="t('monitorings.alertHistory')"
        @click="scrollToAnchor(alertHistoryRef)"
      />
    </div>
    <!-- 基本情報 -->
    <CardContainer class="mb-5">
      <div class="mb-3 flex-flex-start-center">
        <SvgIcon :type="IconTypes.Note" color="secondary" />
        <div class="flex-grow-1 ml-2 text-lg">{{ t('monitorings.basicInformation') }}</div>
      </div>
      <BasicInformationTable :health-status="healthStatus" />
    </CardContainer>

    <!-- ステータス詳細 -->
    <CardContainer class="mb-5">
      <div ref="statusDetailsRef" class="mb-3 flex-flex-start-center">
        <SvgIcon class="pt-1" :type="IconTypes.SearchData" color="secondary" />
        <div class="flex-grow-1 ml-2 text-lg">{{ t('monitorings.statusDetails') }}</div>
        <CustomButton icon="reload" :text="t('monitorings.reloadStatusData')" :width="180" @click="reloadStatusData" />
      </div>

      <!-- アクセス回線＜メイン＞ -->
      <div class="status-card mb-3 pa-4">
        <div class="text-secondary pb-3">{{ t('monitorings.primaryCircuit') }}</div>
        <div class="grid-cols-2 ga-4">
          <div>
            <SeparatedTable :headers="circuitHeaders" :items="circuitItems.main" :key-items="['resources']">
              <template #status="{ data }">
                <StatusIndicator v-if="data === HealthStatus.OK || data === HealthStatus.NG" :status="data" />
                <div v-else>{{ data }}</div>
              </template>
            </SeparatedTable>
            <div v-if="mainCircuitType !== CircuitTypes.Mobile" class="my-6 d-flex justify-center">
              <CustomButton icon="right-arrow" :text="t('sideBar.trafficDetails')" @click="moveToTrafficDetails" />
            </div>

            <!-- ギャランティBGP接続のステータス -->
            <div v-if="healthStatus?.guaranteeBgp">
              <div class="text-secondary pb-3">{{ t('monitorings.guaranteeStatus') }}</div>
              <SeparatedTable :headers="guaranteeStatusHeaders" :items="guaranteeStatusItems">
                <template #header="{ data }">
                  <div class="flex-space-between-center position-relative">
                    <div class="pl-3 flex-grow-1 text-pre-wrap">{{ data.text }}</div>
                    <SvgIcon
                      class="mr-3 cursor-pointer"
                      :type="IconTypes.CaretDown"
                      size="small"
                      color="secondary"
                      @click="handleHeaderClick(data.key as ConnectionType)"
                    />
                  </div>
                  <div v-if="headerType === data.key" class="bgp-status-table position-absolute">
                    <BgpStatusTable :header-type="headerType" :health-status="healthStatus" />
                  </div>
                </template>
                <template #internet="{ data }">
                  <StatusIndicator
                    v-if="data === HealthStatus.OK || data === HealthStatus.NG || data === HealthStatus.Warning"
                    :status="data"
                  />
                  <div v-else>{{ data }}</div>
                </template>
                <template #vpn="{ data }">
                  <StatusIndicator
                    v-if="data === HealthStatus.OK || data === HealthStatus.NG || data === HealthStatus.Warning"
                    :status="data"
                  />
                  <div v-else>{{ data }}</div>
                </template>
              </SeparatedTable>
              <div v-if="bgpDisconnected" class="text-error">
                <div>{{ t('monitorings.bgpDisconnected.note-1') }}</div>
                <div>{{ t('monitorings.bgpDisconnected.note-2') }}</div>
                <i18n-t keypath="monitorings.bgpDisconnected.note-3" tag="div" scope="global">
                  <template #here>
                    <NuxtLink
                      to="https://sdpf.ntt.com/services/docs/rink/tutorials/portal/monitoring/maintenance.html#id1"
                      target="_blank"
                    >
                      {{ t('common.here') }}
                    </NuxtLink>
                  </template>
                </i18n-t>
              </div>
              <div class="mt-6 flex-flex-end-center">
                <CustomButton
                  icon="right-arrow"
                  :text="t('monitorings.bgpSessionClear')"
                  :disabled="bgpSessionClearButtonDisabled || !guaranteeId"
                  :width="310"
                  @click="handleBgpSessionClear"
                />
              </div>
            </div>
          </div>
          <div v-if="mainCircuitType === CircuitTypes.Mobile">
            <div class="flex-center-center">{{ t('message.mydocomo') }}</div>
            <div class="mt-3 d-flex justify-center">
              <CustomButton icon="up-right-square" :text="t('monitorings.moveToMydocomo')" @click="moveToMydocomo" />
            </div>
          </div>
          <TrafficTrendChart
            v-else
            :traffic-trend-circuits="mainTrafficTrendChart.circuits"
            :circuit-type="mainCircuitType"
            :access-type="mainTrafficTrendChart.accessType"
            @reload="reloadMainChartData"
          />
        </div>
      </div>

      <!-- アクセス回線＜バックアップ＞ -->
      <div v-if="backupCircuitType" class="status-card mb-3 pa-4">
        <div class="text-secondary pb-3">{{ t('monitorings.secondaryCircuit') }}</div>
        <div class="grid-cols-2 ga-4">
          <div>
            <SeparatedTable :headers="circuitHeaders" :items="circuitItems.backup" :key-items="['resources']">
              <template #status="{ data }">
                <StatusIndicator v-if="data === HealthStatus.OK || data === HealthStatus.NG" :status="data" />
                <div v-else>{{ data }}</div>
              </template>
            </SeparatedTable>
            <div v-if="backupCircuitType === CircuitTypes.Ipoe" class="my-6 d-flex justify-center">
              <CustomButton icon="right-arrow" :text="t('sideBar.trafficDetails')" @click="moveToTrafficDetails" />
            </div>
          </div>
          <TrafficTrendChart
            v-if="backupCircuitType === CircuitTypes.Ipoe"
            :traffic-trend-circuits="backupTrafficTrendChartCircuits"
            :circuit-type="backupCircuitType"
            @reload="reloadBackupChartData"
          />
          <div v-if="backupCircuitType === CircuitTypes.Mobile">
            <div class="flex-center-center">{{ t('message.mydocomo') }}</div>
            <div class="mt-3 d-flex justify-center">
              <CustomButton icon="up-right-square" :text="t('monitorings.moveToMydocomo')" @click="moveToMydocomo" />
            </div>
          </div>
        </div>
      </div>

      <div class="grid-cols-2 ga-4">
        <!-- VPN接続 -->
        <div class="status-card pa-4">
          <div class="text-secondary pb-3">{{ t('monitorings.vpn') }}</div>
          <SeparatedTable :headers="vpnficHeaders" :items="vpnItems" :key-items="['resourceId']">
            <template #status="{ data }">
              <StatusIndicator v-if="data === HealthStatus.OK || data === HealthStatus.NG" :status="data" />
              <div v-else>{{ data }}</div>
            </template>
          </SeparatedTable>
        </div>
        <!-- FIC接続 -->
        <div class="status-card pa-4">
          <div class="text-secondary pb-3">{{ t('monitorings.fic') }}</div>
          <SeparatedTable :headers="vpnficHeaders" :items="ficItems" :key-items="['resourceId']">
            <template #status="{ data }">
              <StatusIndicator
                v-if="data === HealthStatus.OK || data === HealthStatus.NG || data === HealthStatus.Warning"
                :status="data"
              />
              <div v-else>{{ data }}</div>
            </template>
          </SeparatedTable>
        </div>
      </div>
    </CardContainer>

    <!-- アラート履歴 -->
    <CardContainer class="mb-5">
      <div ref="alertHistoryRef" class="flex-flex-start-center mb-2">
        <SvgIcon class="pt-1" :type="IconTypes.Alert" color="secondary" />
        <div class="mx-2 text-lg">{{ t('monitorings.alertHistory') }}</div>
        <div class="flex-grow-1 text-sm">{{ t('monitorings.latest') }}</div>
        <CustomButton icon="right-arrow" :text="t('monitorings.more')" :width="180" @click="moveToAlertDetails" />
      </div>
      <SortableTable
        :headers="alertHeaders"
        :items="convertedAlertItems"
        :key-items="['timestamp', 'alertName', 'terminalId']"
        :sort="alertSortOption"
        @sort="sortAlert"
      >
        <template #terminalId="{ row }">
          <NuxtLink v-if="row.terminalPath" :to="row.terminalPath">{{ row.terminalId }}</NuxtLink>
          <span v-else>{{ row.terminalId }}</span>
        </template>
        <template #resourceId="{ row }">
          <NuxtLink :to="row.resourceLink">{{ row.resourceId }}</NuxtLink>
        </template>
        <template #customerNote="{ row }">
          <div class="text-truncate" :title="row.customerNote">{{ row.customerNote }}</div>
        </template>
      </SortableTable>
    </CardContainer>
    <div class="d-flex justify-center">
      <CustomButton
        v-if="isRentalTerminal"
        icon="right-arrow"
        :text="t('monitorings.selfCheck')"
        @click="handelMoveToSelfCheck"
      />
      <div v-else class="text-warning">{{ t('monitorings.unableSelfCheck') }}</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.grid-cols-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.status-card {
  border-radius: v.$child-border-radius;
  background-color: rgb(var(--v-theme-highlight));
}
.bgp-status-table {
  z-index: 10;
  margin-top: 15px;
  margin-left: 34px;
}
</style>
