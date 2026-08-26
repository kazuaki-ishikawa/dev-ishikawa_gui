<script setup lang="ts">
import dayjs from 'dayjs'
import * as Papa from 'papaparse'
import { useI18n } from 'vue-i18n'
import type { TerminalType } from '@/api/types'
import type { GuaranteeResponse } from '@/api/guarantees/types'
import { TrafficFlowRankRankByTypes } from '@/api/trafficFlowRank/constants'
import type {
  TrafficFlowRankQuery,
  TrafficFlowRankType,
  TrafficFlowRankApplicationType,
} from '@/api/trafficFlowRank/types'
import { AccessTypes } from '@/api/trafficTrends/constants'
import { DownloadTypes } from '@/components/button/constants'
import { ChartStyleTypes, ChartUnitTypes, ProtocolIdNameMap } from '@/components/trafficDetail/constants'
import type { ChartStyleType, ChartUnitType } from '@/components/trafficDetail/types'
import { IconTypes } from '@/components/icons/constants'

type PropType = {
  trafficFlowRankQuery: TrafficFlowRankQuery
  trafficFlow: TrafficFlowRankType
  guarantee: GuaranteeResponse
  applications: TrafficFlowRankApplicationType[]
  isPaidPlan: boolean
  isApplicationTab: boolean
  terminalType: TerminalType
  hasBreakOut: boolean
}
const props = defineProps<PropType>()

const { t } = useI18n()
const { translateFilterType, intervalOptions, directionOptions } = useTrafficFlowRank()
const { targetRef, downloadPdf } = useDownloadHtmlToPdf()
const { downloadCsv } = useDownloadCsv()

const showPdfPreview = ref(false)
const downloadFailed = ref(false)

const rateLimit = computed(() => {
  const internet = props.guarantee.internet?.rateLimit ?? t('trafficFlow.noContract')
  const vpn = props.guarantee.vpn?.rateLimit ?? t('trafficFlow.noContract')
  return `${t('trafficDetails.internet')}: ${internet} / VPN: ${vpn}`
})
const interval = computed(
  () => intervalOptions.find(option => option.value === props.trafficFlowRankQuery.interval)?.text,
)
const direction = computed(
  () => directionOptions.find(option => option.value === props.trafficFlowRankQuery.direction)?.text,
)
const filters = computed(() => {
  const filterTypeValue = Object.values(TrafficFlowRankRankByTypes).reduce<string[]>((acc, type) => {
    const list = props.trafficFlowRankQuery?.[type] ?? []
    acc.push(
      ...list.map(value => {
        const translated = translateFilterType(type, value, props.applications)
        return `${translated.type} = ${translated.value}`
      }),
    )
    return acc
  }, [])
  return 0 < filterTypeValue.length ? [{ label: t('trafficFlow.filter'), value: filterTypeValue.join(', ') }] : []
})

const dataList = computed(() => {
  const common = [
    {
      label: t('trafficFlow.selectedTerminal'),
      value: `${props.trafficFlow.terminalId} (${props.trafficFlow.customerNote})`,
    },
    {
      label: t('trafficFlow.selectedCircuit'),
      value: `${props.guarantee.guaranteeId} (${props.guarantee.customerNote})`,
    },
    { label: t('trafficFlow.rateLimit'), value: rateLimit.value },
  ]
  if (showPdfPreview.value) {
    return [
      {
        label: t('period.label'),
        value: `${formatDateTime(props.trafficFlowRankQuery.startTime, false)} ~ ${formatDateTime(props.trafficFlowRankQuery.endTime, false)}`,
      },
      {
        label: t('trafficDetails.interval'),
        value: interval.value ?? t('trafficDetails.15m'),
      },
      { label: t('trafficFlow.direction'), value: direction.value ?? t('trafficFlow.directionIn') },
      { label: t('details.tenantId'), value: props.guarantee.tenantId },
      ...common,
      ...filters.value,
    ]
  }
  return common
})

const chartType = ref<ChartStyleType>(ChartStyleTypes.Area)
const chartUnit = ref<ChartUnitType>(ChartUnitTypes.BitPerSec)
const chartTypeOptions = Object.values(ChartStyleTypes).map(value => ({ text: t(`trafficFlow.${value}`), value }))
const chartUnitOptions = Object.values(ChartUnitTypes).map(value => ({ text: t(`trafficFlow.${value}`), value }))

const dropdownOpen = ref(false)
const dropdownOptions = computed(() => [
  {
    text: t('trafficDetails.downloadCsv'),
    value: DownloadTypes.Csv,
    disabled: !props.isPaidPlan,
    icon: !props.isPaidPlan ? IconTypes.Lock : undefined,
  },
  {
    text: t('trafficDetails.downloadPdf'),
    value: DownloadTypes.Pdf,
  },
])

const applicationIdNameMap = computed(() =>
  Object.fromEntries(props.applications.map(a => [a.applicationId, a.applicationName])),
)

const formattedTrafficFlowToJsonList = computed(() =>
  props.trafficFlow.circuits
    .flatMap(circuit => {
      const timestamps = circuit.traffics.flatMap(traffic =>
        traffic.rates.timestamp.map((time, index) => ({
          timestamp: formatDateTime(time, false),
          terminalId: props.trafficFlow.terminalId,
          customerNote: props.trafficFlow.customerNote,
          circuitId: circuit.circuitId,
          network: circuit.accessType,
          direction: circuit.direction,
          rank: traffic.rank,
          value: (() => {
            switch (circuit.rankBy) {
              case TrafficFlowRankRankByTypes.ApplicationId:
                return applicationIdNameMap.value[traffic.group?.applicationId ?? ''] || traffic.group?.applicationId
              case TrafficFlowRankRankByTypes.Protocol:
                return ProtocolIdNameMap[traffic.group?.protocol ?? ''] || traffic.group?.protocol
              default:
                return traffic.group?.[circuit.rankBy]
            }
          })(),
          bitPerSec: traffic.rates.bitPerSec[index],
          packetPerSec: traffic.rates.packetPerSec[index],
        })),
      )
      return timestamps
    })
    .sort((a, b) =>
      // inernet > vpn で timstamp 昇順に並べ替え
      a.network.localeCompare(b.network) === 0
        ? a.timestamp.localeCompare(b.timestamp)
        : a.network.localeCompare(b.network),
    ),
)

const handleResultDownload = async (value: typeof DownloadTypes.Csv | typeof DownloadTypes.Pdf) => {
  try {
    showPdfPreview.value = value === DownloadTypes.Pdf
    const fileSuffix =
      props.trafficFlowRankQuery.rankBy === TrafficFlowRankRankByTypes.ApplicationId
        ? 'applicationName'
        : props.trafficFlowRankQuery.rankBy
    const fileName = `traffic_flow_${props.trafficFlow.terminalId}_${fileSuffix}`
    if (value === DownloadTypes.Pdf) {
      // PDF 画面が表示されるまで少し待機
      await sleep(500)
      await downloadPdf(fileName)
    }
    if (value === DownloadTypes.Csv) {
      const csv = Papa.unparse(formattedTrafficFlowToJsonList.value)
      await downloadCsv(csv, fileName)
    }
  } catch {
    downloadFailed.value = true
  } finally {
    showPdfPreview.value = false
  }
}

const recommendButtonDisabled = computed(() => {
  if (!props.isApplicationTab) {
    return true
  }
  const diffHours = dayjs(props.trafficFlowRankQuery.endTime).diff(dayjs(props.trafficFlowRankQuery.startTime), 'hours')
  return 24 < diffHours
})
</script>

<template>
  <div :class="{ 'pdf-preview': showPdfPreview }">
    <div ref="targetRef" class="a4-card">
      <div v-show="showPdfPreview">
        <div class="mb-4 text-xl font-weight-bold">
          {{ t('trafficFlow.pdfTitle', { rankBy: t(`trafficFlow.${trafficFlowRankQuery.rankBy}`) }) }}
        </div>
        <div class="font-weight-bold">{{ t('trafficDetails.filterTitle') }}</div>
        <div v-for="data in dataList" :key="data.value" class="grid-cols">
          <div>{{ data.label }}</div>
          <div>{{ data.value }}</div>
        </div>
        <div class="mt-4 font-weight-bold">{{ t('trafficFlow.result') }}</div>
      </div>
      <InnerCard v-show="!showPdfPreview" :title="t('trafficFlow.result')">
        <template #button>
          <DropDown v-model:dropdown-open="dropdownOpen" :options="dropdownOptions" @click="handleResultDownload">
            <CustomButton
              icon="download"
              :text="t('trafficDetails.download')"
              :width="180"
              @click.stop="dropdownOpen = true"
            />
          </DropDown>
        </template>
        <div v-for="data in dataList" :key="data.value" class="grid-cols mt-4">
          <div>{{ data.label }}</div>
          <div>{{ data.value }}</div>
        </div>
        <div class="mt-4 text-secondary text-lg">{{ t('trafficFlow.chartStyle') }}</div>
        <SeparatedGrid class="mt-2" :label="t('trafficFlow.chartType')">
          <RadioForm v-model="chartType" :options="chartTypeOptions" col-min-width="180px" />
        </SeparatedGrid>
        <SeparatedGrid class="mt-2" :label="t('trafficFlow.chartUnit')">
          <RadioForm v-model="chartUnit" :options="chartUnitOptions" col-min-width="180px" />
        </SeparatedGrid>
        <!-- レコメンドボタン -->
        <TrafficFlowRecommend
          v-if="isApplicationTab"
          class="mt-5"
          :tenant-id="guarantee.tenantId"
          :traffic-flow-rank-query="trafficFlowRankQuery"
          :traffic-flow="trafficFlow"
          :terminal-type="terminalType"
          :applications="applications"
          :has-break-out="hasBreakOut"
          :disabled="recommendButtonDisabled"
        />
      </InnerCard>
      <TrafficFlowChart
        v-for="accessType in [AccessTypes.Internet, AccessTypes.Vpn]"
        :key="accessType"
        :access-type="accessType"
        :traffic-flow="trafficFlow"
        :interval="trafficFlowRankQuery.interval"
        :rate-limit="guarantee[accessType]?.rateLimit ?? ''"
        :chart-type="chartType"
        :chart-unit="chartUnit"
        :applications="applications"
        :pdf-preview="showPdfPreview"
      />
    </div>
    <DialogBase :open="showPdfPreview" @close="showPdfPreview = false">
      <div class="text-2xl h-100 text-center flex-center-center text-pre-wrap">
        {{ t('trafficFlow.message.downloading') }}
      </div>
    </DialogBase>
    <DialogBase :open="downloadFailed" :cancel-label="t('common.close')" @close="downloadFailed = false">
      <div class="text-2xl h-100 text-center flex-center-center text-pre-wrap">
        {{ t('trafficFlow.message.downloadFailed') }}
      </div>
    </DialogBase>
  </div>
</template>

<style lang="scss" scoped>
.grid-cols {
  display: grid;
  grid-template-columns: 200px 1fr;
}
.pdf-preview {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-size: cover;
  background-image: url(v.$bg-image);
  background-attachment: fixed;
  z-index: v.$pdf-preview-z-index;

  .a4-card {
    overflow-y: scroll;
    background-color: #fff;
    margin: 1.5rem auto;
    padding: 1.75rem;
    width: 80%;
    height: 90%;
  }
}
</style>
