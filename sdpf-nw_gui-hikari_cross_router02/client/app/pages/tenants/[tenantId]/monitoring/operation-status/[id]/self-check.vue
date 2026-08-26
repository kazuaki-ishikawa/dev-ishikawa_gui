<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { CircuitTypes, TerminalTypes } from '@/api/constants'
import { AlertResourceTypes } from '@/api/alerts/constants'
import { CommunicationStatus } from '@/api/healthDiagnosis/constants'
import type { TrafficTrendsQuery } from '@/api/trafficTrends/types'
import { IconTypes } from '@/components/icons/constants'
import { TenantPages, MonitoringPages } from '@/components/sidebar/constants'

const { t } = useI18n()
const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)
const terminalId = computed(() => route.params.id as string)

const circuitOperationStatusRef = ref<HTMLElement>()
const comTerminalInformationRef = ref<HTMLElement>()

const { resourceSummaryTerminalList, getAllResourceSummaryTerminalList } = useGetAllResourceSummaryTerminalList()
const { healthStatus, getHealthStatus } = useGetHealthStatus()
const { healthDiagnosis, getHealthDiagnosis } = useGetHealthDiagnosis()
const { alertItems, getAlertList } = useGetAlertList()
const { alertItems: nonVpnAlertItems, getAlertList: getNonVpnAlertList } = useGetAlertList()
const { ficHealthStatuses, getFicHealthStatusList } = useGetFicHealthStatusList()
const {
  trafficTrendsQuery: guaranteeTrafficTrendsQuery,
  trafficTrends: guaranteeTrafficTrends,
  getTrafficTrends: getGuaranteeTrafficTrends,
} = useGetTrafficTrends()
const {
  trafficTrendsQuery: ipoeTrafficTrendsQuery,
  trafficTrends: ipoeTrafficTrends,
  getTrafficTrends: getIpoeTrafficTrends,
} = useGetTrafficTrends()
const { terminal: rentalTerminal, getTerminal: getRentalTerminal, inProgressSwitchover } = useGetTerminal()

const alert = computed(() => {
  if (!alertItems.value[0]) {
    return
  }
  // ギャランティ回線が通信OKかつ、vpn(=IPsec)以外のアラートが存在しない場合は非表示
  const isGuaranteeStatusOK = !!healthDiagnosis.value?.responseBody?.communicationStatus.some(
    status => status.circuitType === CircuitTypes.Guarantee && status.status === CommunicationStatus.OK,
  )
  if (isGuaranteeStatusOK && !nonVpnAlertItems.value[0]) {
    return
  }
  return { timestamp: alertItems.value[0].timestamp, info: alertItems.value[0].info }
})

const terminal = computed(() =>
  resourceSummaryTerminalList.value.terminals.find(terminal => terminal.terminalId === terminalId.value),
)
const isSelfTerminal = computed(() => terminal.value?.terminalType === TerminalTypes.Self)
const showTrafficStatus = computed(() => {
  const circuitTypes = [
    terminal.value?.primaryCircuit.circuitType,
    terminal.value?.secondaryCircuit?.circuitType,
  ].filter(Boolean)
  return {
    guarantee: circuitTypes.includes(CircuitTypes.Guarantee),
    ipoe: circuitTypes.includes(CircuitTypes.Ipoe),
    mobile: circuitTypes.includes(CircuitTypes.Mobile),
  }
})
const mainGuaranteeConnected = computed(
  () =>
    !!healthDiagnosis.value?.responseBody?.communicationStatus.find(
      status => status.circuitType === CircuitTypes.Guarantee && status.status === CommunicationStatus.OK,
    ),
)

// サービスルーター かつ lanPorts か wanPorts が存在する場合に表示する
const showTerminalInformation = computed(() => {
  return (
    !isSelfTerminal.value &&
    (!!healthDiagnosis.value?.responseBody?.lanPorts || !!healthDiagnosis.value?.responseBody?.wanPorts)
  )
})

const scrollToAnchor = (element?: HTMLElement) => {
  const top = element?.offsetTop ?? 0
  scrollTo({ top, behavior: 'smooth' })
}
const moveToAlertDetails = async () => {
  await navigateTo(
    {
      path: `/tenants/${tenantId.value}/${TenantPages.Monitoring}/${MonitoringPages.AlertDetails}`,
      query: { terminalId: terminalId.value },
    },
    { open: { target: '_blank', windowFeatures: { noopener: true, noreferrer: true } } },
  )
}
const moveToTrafficDetails = async () => {
  await navigateTo(
    {
      path: `/tenants/${tenantId.value}/${TenantPages.Monitoring}/${MonitoringPages.TrafficDetails}`,
      query: { terminalId: terminalId.value },
    },
    { open: { target: '_blank', windowFeatures: { noopener: true, noreferrer: true } } },
  )
}
const moveToMydocomo = async () => {
  await navigateTo('https://www.docomo.ne.jp/mydocomo/', {
    external: true,
    open: { target: '_blank', windowFeatures: { noopener: true, noreferrer: true } },
  })
}
const reloadGuaranteeChartData = (chartQuery: TrafficTrendsQuery) => {
  getGuaranteeTrafficTrends({ ...guaranteeTrafficTrendsQuery.value, ...chartQuery })
}
const reloadIpoeChartData = (chartQuery: TrafficTrendsQuery) => {
  getIpoeTrafficTrends({ ...ipoeTrafficTrendsQuery.value, ...chartQuery })
}

const reload = async () => {
  getHealthStatus(terminalId.value)
  getFicHealthStatusList()
  // 未解決の最新アラート1件（表示用）
  getAlertList({ terminalId: terminalId.value, resolved: 'false', direction: 'desc', sortKey: 'timestamp', limit: 1 })
  // vpn(=IPsec)以外の未解決アラート1件（IPsecアラートのみかの判定用）
  getNonVpnAlertList({
    terminalId: terminalId.value,
    resolved: 'false',
    limit: 1,
    resourceType: [
      AlertResourceTypes.Mobile,
      AlertResourceTypes.Ipoe,
      AlertResourceTypes.Fic,
      AlertResourceTypes.Guarantee,
    ],
  })
  await getAllResourceSummaryTerminalList({ terminalId: [terminalId.value] })
  await getHealthDiagnosis(terminalId.value)
  if (terminal.value?.terminalType === TerminalTypes.Rental) {
    await getRentalTerminal(terminalId.value)
  }

  // グラフデータの取得
  if (showTrafficStatus.value.guarantee) {
    reloadGuaranteeChartData({ terminalId: terminalId.value })
  }
  if (showTrafficStatus.value.ipoe) {
    reloadIpoeChartData({ terminalId: terminalId.value })
  }
}
onBeforeMount(reload)
</script>

<template>
  <div>
    <div class="pb-4 flex-flex-end-center">
      <div class="d-flex flex-grow-1">
        <AnchorButton
          class="mr-3"
          :icon="IconTypes.CircleArrows"
          :label="t('selfCheck.circuitOperationStatus')"
          @click="scrollToAnchor(circuitOperationStatusRef)"
        />
        <AnchorButton
          v-if="showTerminalInformation"
          :icon="IconTypes.Database"
          :label="t('selfCheck.comTerminalInformation')"
          @click="scrollToAnchor(comTerminalInformationRef)"
        />
      </div>
      <CustomButton icon="reload" :text="t('monitorings.reloadStatusData')" :width="180" @click="reload" />
    </div>
    <!-- 回線運用状態 -->
    <CardContainer class="mb-5">
      <div ref="circuitOperationStatusRef" class="mb-3 flex-flex-start-center">
        <SvgIcon :type="IconTypes.CircleArrows" color="secondary" />
        <div class="ml-2 text-lg">
          {{ t('selfCheck.circuitOperationStatus') }}
        </div>
        <div class="ml-3">
          {{ healthStatus?.terminal.customerNote ?? '' }}
        </div>
      </div>
      <div class="status-card mb-5">
        <CircuitOperationStatus :health-diagnosis="healthDiagnosis?.responseBody" />
        <!-- 構成図 -->
        <div class="mt-3 bg-white rounded-lg pa-4">
          <CircuitOperationImages
            v-if="!!healthDiagnosis?.responseBody"
            :health-diagnosis="healthDiagnosis.responseBody"
            :is-self-terminal="isSelfTerminal"
          />
        </div>
        <FicVpnConnection
          v-if="!!healthDiagnosis?.responseBody"
          class="py-3"
          :tenant-id="tenantId"
          :is-self-terminal="isSelfTerminal"
          :health-diagnosis="healthDiagnosis.responseBody"
          :health-status="healthStatus"
          :fic-health-statuses="ficHealthStatuses"
          :main-guarantee-connected="mainGuaranteeConnected"
          :in-progress-switchover="inProgressSwitchover"
        />
        <div class="mt-3 text-secondary text-lg">{{ t('selfCheck.diagnosisResults') }}</div>
        <DiagnosisResults
          class="mt-3"
          :diagnosis-results="healthDiagnosis?.responseBody?.diagnosisResults"
          :main-guarantee-connected="mainGuaranteeConnected"
          :in-progress-switchover="inProgressSwitchover"
        />
      </div>
      <AlertCard v-if="!!alert" class="mb-5" :alert="alert" @click="moveToAlertDetails" />
      <div class="statuses-grid mb-5">
        <AlertLogs class="status-card" :tenant-id="tenantId" :terminal-id="terminalId" />
        <ConstructionMaintenance class="status-card" />
        <TrafficStatus
          v-if="showTrafficStatus.guarantee"
          class="status-card"
          :type="CircuitTypes.Guarantee"
          :health-status="healthStatus"
          :traffic-trend="guaranteeTrafficTrends?.trafficTrends[0]"
          @click="moveToTrafficDetails"
          @reload="reloadGuaranteeChartData"
        />
        <TrafficStatus
          v-if="showTrafficStatus.ipoe"
          class="status-card"
          :type="CircuitTypes.Ipoe"
          :health-status="healthStatus"
          :traffic-trend="ipoeTrafficTrends?.trafficTrends[0]"
          @click="moveToTrafficDetails"
          @reload="reloadIpoeChartData"
        />
        <TrafficStatus
          v-if="showTrafficStatus.mobile"
          class="status-card"
          :type="CircuitTypes.Mobile"
          :health-status="healthStatus"
          @click="moveToMydocomo"
        />
      </div>
    </CardContainer>
    <!-- Rルータ01情報 -->
    <CardContainer v-if="showTerminalInformation">
      <div ref="comTerminalInformationRef" class="mb-3 flex-flex-start-center">
        <SvgIcon :type="IconTypes.Database" color="secondary" />
        <div class="ml-2 text-lg">{{ t('selfCheck.comTerminalInformation') }}</div>
      </div>
      <CpeInformation
        class="status-card mb-5"
        :health-diagnosis="healthDiagnosis?.responseBody"
        :model="rentalTerminal?.terminalDevices?.find(device => device.deviceAttribute === 'active')?.model"
      />
      <InterfaceInformation
        class="status-card"
        :health-diagnosis="healthDiagnosis?.responseBody"
        :terminal="rentalTerminal"
      />
    </CardContainer>
  </div>
</template>

<style lang="scss" scoped>
$gap: 1.5rem;

.statuses-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $gap * 0.75;
}
.status-card {
  padding: $gap * 0.75;
  border-radius: v.$child-border-radius;
  background-color: rgb(var(--v-theme-highlight));
}
</style>
