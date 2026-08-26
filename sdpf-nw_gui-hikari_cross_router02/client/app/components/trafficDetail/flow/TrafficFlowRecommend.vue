<script setup lang="ts">
import { sum } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import { CircuitTypes, TerminalTypes } from '@/api/constants'
import type { TerminalType } from '@/api/types'
import { TrafficFlowRankDirectionTypes, TrafficFlowRankIntervalTypes } from '@/api/trafficFlowRank/constants'
import type {
  TrafficFlowRankQuery,
  TrafficFlowRankType,
  TrafficFlowRankApplicationType,
} from '@/api/trafficFlowRank/types'
import { AccessTypes } from '@/api/trafficTrends/constants'
import { TRAFFIC_DETAIL_LINK } from '@/components/trafficDetail/constants'

type PropType = {
  tenantId: string
  trafficFlowRankQuery: TrafficFlowRankQuery
  trafficFlow: TrafficFlowRankType
  applications: TrafficFlowRankApplicationType[]
  terminalType: TerminalType
  hasBreakOut: boolean
  disabled?: boolean
}
const props = defineProps<PropType>()

const { t } = useI18n()
const { loading } = useLoading()

const { trafficTrends, getTrafficTrends } = useGetTrafficTrends()

const recommendResultItems = ref<
  Array<{
    key: string
    application?: string
    boldText?: { boldText1: string; boldText2?: string }
    colorText?: string
    helpTooltipText?: { helpTooltipText1: string; helpTooltipText2?: string }
    link?: { applicationMethodKey: string; operationPath?: string; guidePath?: string }
  }>
>([])
const recommendResultHeaders = [
  { text: t('trafficFlow.recommendResult'), key: 'result' },
  { text: t('trafficFlow.recommendLink'), key: 'link', width: 280 },
]

function hasConsecutiveMatches<T>(
  dataArray: T[], // 対象のデータ配列
  consecutiveCount: number, // 連続して出現する回数
  condition: (item: T) => boolean, // 条件を満たすかどうかの判定用関数
) {
  return dataArray.reduce(
    (acc, cur) => {
      if (acc.found) {
        return acc
      }
      // 条件に合致すればカウントを増やし、そうでなければリセット
      const counter = condition(cur) ? acc.counter + 1 : 0
      // 連続で consecutiveCount 回以上続いていたら検出フラグを立てる
      const found = consecutiveCount <= counter
      return { counter, found }
    },
    { counter: 0, found: false },
  ).found
}

const handleRecommendClick = async () => {
  await getTrafficTrends({
    terminalId: props.trafficFlow.terminalId,
    startTime: props.trafficFlowRankQuery.startTime,
    endTime: props.trafficFlowRankQuery.endTime,
    interval: props.trafficFlowRankQuery.interval,
  })
  const trafficTrendCircuits = trafficTrends.value?.trafficTrends?.[0]?.circuits ?? []

  // 直前までの内容は初期化しておく
  recommendResultItems.value = []
  // 30分以上を判定するbpsのデータカウント数
  const intervalCounts = props.trafficFlowRankQuery.interval === TrafficFlowRankIntervalTypes.Interval5Minutes ? 6 : 2

  // trafficTrendCircuits のデータ
  const internet = trafficTrendCircuits.find(
    circuit => circuit.circuitType === CircuitTypes.Guarantee && circuit.accessType === AccessTypes.Internet,
  )
  const vpn = trafficTrendCircuits.find(
    circuit => circuit.circuitType === CircuitTypes.Guarantee && circuit.accessType === AccessTypes.Vpn,
  )

  // rateLimit (Mbps->bps) の 80% と 5% を計算する
  const internetRateLimitThreshold = convertBandwidthToUnit(internet?.rateLimit ?? '') * 0.8
  const vpnRateLimitThreshold = convertBandwidthToUnit(vpn?.rateLimit ?? '') * 0.8
  const vpnBreakOutThreshold = convertBandwidthToUnit(vpn?.rateLimit ?? '') * 0.05

  // bps のデータを取得
  const [internetBitPerSec, vpnBitPerSec] =
    props.trafficFlowRankQuery.direction === TrafficFlowRankDirectionTypes.In
      ? [internet?.bitPerSecIn ?? [], vpn?.bitPerSecIn ?? []]
      : [internet?.bitPerSecOut ?? [], vpn?.bitPerSecOut ?? []]

  // internet で rateLimit の 80%以上 の流量が 30分以上 続くか確認する
  const isInternetRateLimitOver80Percent = hasConsecutiveMatches(
    internetBitPerSec,
    intervalCounts,
    bps => internetRateLimitThreshold <= bps,
  )
  // vpn で rateLimit の 80%以上 の流量が 30分以上 続くか確認する
  const isVpnRateLimitOver80Percent = hasConsecutiveMatches(
    vpnBitPerSec,
    intervalCounts,
    bps => vpnRateLimitThreshold <= bps,
  )

  // internet も vpn も 80%以上の流量 が 30分以上 続いていない場合、メッセージ(No.1)表示して終了
  if (!isInternetRateLimitOver80Percent && !isVpnRateLimitOver80Percent) {
    recommendResultItems.value = [{ key: 'recommend-1' }]
    return
  }
  // internet で 80%以上の流量 が 30分以上 続いた場合、メッセージ(No.2)表示
  if (isInternetRateLimitOver80Percent) {
    recommendResultItems.value = [
      {
        key: 'recommend-2',
        boldText: { boldText1: t('trafficFlow.recommend.highlightText.internetBandwidthExpansion') },
        helpTooltipText: { helpTooltipText1: t('trafficFlow.recommend.helpTooltipText.exceedBandwidthWarning') },
        link: {
          applicationMethodKey: 'guarantee',
          operationPath: `guarantees/circuits/${internet?.circuitId}`,
          guidePath: TRAFFIC_DETAIL_LINK.CHANGE_IWAN,
        },
      },
    ]
  }

  // vpn で 80%以上の流量 が 30分以上 続いてない場合は終了
  if (!isVpnRateLimitOver80Percent) {
    return
  }

  // breakOut:true の applicationId を取得
  const applicationIdList = props.applications.filter(app => app.breakOut).map(app => app.applicationId)
  const traffics = props.trafficFlow.circuits
    .find(circuit => circuit.accessType === AccessTypes.Vpn)
    ?.traffics?.filter(traffic => {
      // breakOut:true の applicationId が含まれる 場合
      if (applicationIdList.includes(traffic.group.applicationId ?? '')) {
        // VPN契約帯域の 5%以上 が 30分以上 続く データがあるか検証する
        return hasConsecutiveMatches(traffic.rates.bitPerSec, intervalCounts, bps => vpnBreakOutThreshold <= bps)
      } else {
        return false
      }
    })

  // traffics が undefined or 空配列の場合 メッセージ(No.3)表示して終了
  if (!traffics || traffics.length === 0) {
    recommendResultItems.value = [
      ...recommendResultItems.value, // recommend-2 が入っている場合を想定
      {
        key: 'recommend-3',
        boldText: { boldText1: t('trafficFlow.recommend.highlightText.vpnBandwidthExpansion') },
        helpTooltipText: { helpTooltipText1: t('trafficFlow.recommend.helpTooltipText.exceedBandwidthWarning') },
        link: {
          applicationMethodKey: 'guarantee',
          operationPath: `guarantees/circuits/${vpn?.circuitId}`,
          guidePath: TRAFFIC_DETAIL_LINK.CHANGE_IWAN,
        },
      },
    ]
    return
  }

  const intervalSeconds =
    props.trafficFlowRankQuery.interval === TrafficFlowRankIntervalTypes.Interval5Minutes ? 60 * 5 : 60 * 15
  // traffics の rates.bitPerSec のデータを合計表示用データを作成する
  const applicationList = traffics.map(traffic => {
    const rankByValue =
      props.applications.find(app => app.applicationId === traffic.group.applicationId)?.applicationName ??
      traffic.group.applicationId
    const sumBitPerSec = sum(traffic.rates.bitPerSec)
    // 通信量(Mbyte) = bitPerSec * 期間(秒) ÷ 8 ÷ 1000 ÷ 1000
    const mbyte = ((sumBitPerSec * intervalSeconds) / 8 / 10 ** 6).toFixed(3)
    return `  ${rankByValue}: ${mbyte}Mbytes`
  })

  // VPN契約帯域の 5%以上 の トラフィック が 30分以上 続く場合
  if (!internet) {
    // インターネット契約がない場合
    recommendResultItems.value = [
      ...recommendResultItems.value, // recommend-2 が入っている場合を想定
      {
        key: 'recommend-3',
        boldText: { boldText1: t('trafficFlow.recommend.highlightText.vpnBandwidthExpansion') },
        helpTooltipText: { helpTooltipText1: t('trafficFlow.recommend.helpTooltipText.exceedBandwidthWarning') },
        link: {
          applicationMethodKey: 'guarantee',
          operationPath: `guarantees/circuits/${vpn?.circuitId}`,
          guidePath: TRAFFIC_DETAIL_LINK.CHANGE_IWAN,
        },
      },
      {
        key: 'recommend-4',
        application: applicationList.join('\n'),
        boldText: { boldText1: t('trafficFlow.recommend.highlightText.applyBreakoutNotice') },
        helpTooltipText: { helpTooltipText1: t('trafficFlow.recommend.helpTooltipText.breakOutRecommendation') },
        colorText: t('trafficFlow.recommend.highlightText.checkDetails'),
        link: { applicationMethodKey: 'breakOutDetails', guidePath: TRAFFIC_DETAIL_LINK.OPTION_DETAIL_LBO },
      },
    ]
  } else {
    // インターネット契約がある場合
    const terminalPath = `${
      props.terminalType === TerminalTypes.Rental ? 'terminals' : 'self-terminals'
    }/${props.trafficFlow.terminalId}`
    recommendResultItems.value = [
      ...recommendResultItems.value, // recommend-2 が入っている場合を想定
      {
        key: props.hasBreakOut ? 'recommend-6' : 'recommend-5',
        application: applicationList.join('\n'),
        boldText: {
          boldText1: t('trafficFlow.recommend.highlightText.recommendedBreakoutTraffic'),
          boldText2: t('trafficFlow.recommend.highlightText.applyBreakout'),
        },
        helpTooltipText: {
          helpTooltipText1: t('trafficFlow.recommend.helpTooltipText.exceedBandwidthWarning'),
          helpTooltipText2: t('trafficFlow.recommend.helpTooltipText.breakOutRecommendation'),
        },
        colorText: t('trafficFlow.recommend.highlightText.checkDetails'),
        link: {
          applicationMethodKey: 'breakOutApply',
          operationPath: terminalPath,
          guidePath: TRAFFIC_DETAIL_LINK.CHANGE_LBO,
        },
      },
      {
        key: 'recommend-7',
        boldText: { boldText1: t('trafficFlow.recommend.highlightText.vpnBandwidthExpansion') },
        link: {
          applicationMethodKey: 'guarantee',
          operationPath: `guarantees/circuits/${vpn?.circuitId}`,
          guidePath: TRAFFIC_DETAIL_LINK.CHANGE_IWAN,
        },
      },
    ]
  }
}
watch(
  () => props.trafficFlow,
  () => {
    // trafficFlow が更新されたらレコメンド結果をクリア
    recommendResultItems.value = []
  },
)
</script>

<template>
  <div>
    <CustomButton
      icon="light"
      :width="180"
      :text="t('trafficFlow.recommendResult')"
      :disabled="disabled || loading"
      @click="handleRecommendClick"
    />
    <SeparatedTable
      v-if="recommendResultItems.length > 0"
      class="mt-2"
      :headers="recommendResultHeaders"
      :items="recommendResultItems"
    >
      <template #result="{ row }">
        <i18n-t
          :keypath="`trafficFlow.recommend.${row.key}`"
          tag="div"
          scope="global"
          class="text-pre-wrap text-start text-sm w-100 pa-2"
        >
          <template #application>
            {{ row.application }}
          </template>
          <template #boldText1>
            <strong>{{ row.boldText?.boldText1 }}</strong>
          </template>
          <template #boldText2>
            <strong>{{ row.boldText?.boldText2 }}</strong>
          </template>
          <template #colorText>
            <span class="text-info">{{ row.colorText }}</span>
          </template>
          <template #helpTooltip1>
            <HelpTooltip class="d-inline-flex align-middle pb-1" size="smallMiddle">
              {{ row.helpTooltipText?.helpTooltipText1 }}
            </HelpTooltip>
          </template>
          <template #helpTooltip2>
            <HelpTooltip class="d-inline-flex align-middle pb-1" size="smallMiddle">
              {{ row.helpTooltipText?.helpTooltipText2 }}
            </HelpTooltip>
          </template>
        </i18n-t>
      </template>
      <template #link="{ row }">
        <i18n-t
          v-if="row.link"
          :keypath="`trafficFlow.recommend.applicationMethod.${row.link.applicationMethodKey}`"
          tag="div"
          scope="global"
          class="text-pre-wrap text-start text-sm w-100 pa-2"
        >
          <template #operation>
            <NuxtLink :to="`/tenants/${tenantId}/${row.link.operationPath}`" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
          <template #guide>
            <NuxtLink :to="row.link.guidePath" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
        </i18n-t>
      </template>
    </SeparatedTable>
  </div>
</template>

<style lang="scss" scoped>
.align-middle {
  vertical-align: middle;
}
</style>
