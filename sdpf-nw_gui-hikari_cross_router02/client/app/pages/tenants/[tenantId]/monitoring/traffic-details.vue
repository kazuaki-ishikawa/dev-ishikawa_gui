<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CircuitTypes, ResourceStatusTypes, TerminalTypes, TrafficReportFlowAnalyzerPlanTypes } from '@/api/constants'
import { TrafficFlowRankRankByTypes, TrafficFlowRankTabValues } from '@/api/trafficFlowRank/constants'
import { IconTypes } from '@/components/icons/constants'
import { TenantPages } from '@/components/sidebar/constants'
import { TRAFFIC_DETAIL_LINK } from '@/components/trafficDetail/constants'
import type { SortOption } from '@/components/table/types'

const TabNameList = ['traffic', ...TrafficFlowRankTabValues] as const

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenantId as string)
const terminalId = computed(() => (route.query.terminalId as string) || '')
const currentTabName = computed(() => TabNameList.find(name => name === route.query.tab) ?? TabNameList[0])

const { loading } = useLoading()
// 端末テーブル
const { terminalIdOptions, resourceSummaryTerminalList, getAllResourceSummaryTerminalList } =
  useGetAllResourceSummaryTerminalList()
const {
  terminalTableQuery,
  terminalTableList,
  terminalSortOption,
  terminalTablePagination,
  getTerminalTableList,
  updateQueryTerminalId,
  handleQueryClear,
} = useGetTerminalTableList()
const { terminal: rentalTerminal, getTerminal: getRentalTerminal } = useGetTerminal()

const terminalType = computed(
  () => resourceSummaryTerminalList.value.terminals.find(t => t.terminalId === terminalId.value)?.terminalType,
)
const terminal = computed(() =>
  resourceSummaryTerminalList.value.terminals.find(terminal => terminal.terminalId === terminalId.value),
)
const guaranteeId = computed(() =>
  terminal.value?.primaryCircuit?.circuitType === CircuitTypes.Guarantee ? terminal.value.primaryCircuit.circuitId : '',
)

const viewPattern = computed(() => {
  const plan = terminal.value?.trafficReportFlowAnalyzer?.trafficReportFlowAnalyzerPlan ?? ''
  return {
    isMobile: terminal.value?.primaryCircuit?.circuitType === CircuitTypes.Mobile,
    isIPoE: terminal.value?.primaryCircuit?.circuitType === CircuitTypes.Ipoe,
    isNoSubscription: plan === TrafficReportFlowAnalyzerPlanTypes.NoSubscription,
    isFreePlan: plan === TrafficReportFlowAnalyzerPlanTypes.FreePlan,
    isPaidPlan: TrafficReportFlowAnalyzerPlanTypes.PaidPlan.includes(plan),
  }
})
const trafficReportFlowAnalyzerMessage = computed(() => {
  if (viewPattern.value.isMobile || viewPattern.value.isIPoE || viewPattern.value.isPaidPlan) {
    // IPoE か モバイル がメイン回線、paidPlan の場合は 追加の文言は不要
    return undefined
  }
  return viewPattern.value.isNoSubscription
    ? { noteKeyPath: 'trafficDetails.note.noSubscription' }
    : { noteKeyPath: 'trafficDetails.note.freePlan' }
})
const terminalDetailLink = computed(() => {
  const type = terminalType.value === TerminalTypes.Self ? TenantPages.SelfTerminals : TenantPages.Terminals
  return `/tenants/${tenantId.value}/${type}/${terminalId.value}`
})

const tabs = computed(() =>
  TabNameList.map(name => {
    const disabled = viewPattern.value.isMobile || (name !== TabNameList[0] && viewPattern.value.isIPoE)
    const icon =
      viewPattern.value.isNoSubscription ||
      (viewPattern.value.isFreePlan && name !== 'communication' && name !== TrafficFlowRankRankByTypes.ApplicationId)
        ? IconTypes.Lock
        : undefined
    return { text: t(`trafficDetails.tabs.${name}`), name, disabled, icon: name !== TabNameList[0] ? icon : undefined }
  }),
)

const showTrafficFlow = computed(() => !!guaranteeId.value && TrafficFlowRankTabValues.includes(currentTabName.value))
const handleTabChange = (tabName: string) => {
  if (tabName === TabNameList[0]) {
    // traffic タブに戻る場合は不要な要素を削除する
    router.push({
      query: {
        terminalId: terminalId.value,
        interval: route.query.interval,
        periodType: route.query.periodType,
        startTime: route.query.startTime,
        endTime: route.query.endTime,
        tab: tabName,
      },
    })
  } else {
    router.push({ query: { ...route.query, tab: tabName } })
  }
}

const handleTrafficDetailChange = (data: { page: number; limit?: number; sortOption?: Partial<SortOption> }) => {
  getTerminalTableList({ ...terminalTableQuery.value, limit: data.limit, offset: data.page - 1, ...data.sortOption })
}
const handleTerminalSearch = () => {
  // トラフィックトレンドのデータ初期化用
  router.push({ query: {} })

  // 端末テーブルの更新用
  getTerminalTableList({ ...terminalTableQuery.value, offset: 0 })
}
const updateCheckedId = (terminalId: string) => {
  // terminalId が変更された場合、初期タブに戻す
  router.push({ query: { terminalId, tab: TabNameList[0] } })
}

watch(terminalId, next => {
  if (!terminalType.value || !next) {
    // データを初期化する
    rentalTerminal.value = null
    return
  }
  // 端末情報の取得
  if (terminalType.value === TerminalTypes.Rental) {
    getRentalTerminal(terminalId.value)
  }
})

onBeforeMount(async () => {
  const query = { resourceStatus: [ResourceStatusTypes.Active] }
  await getAllResourceSummaryTerminalList(query)
  if (route.query?.terminalId && typeof route.query.terminalId === 'string') {
    terminalTableQuery.value.terminalId = [route.query.terminalId]

    // 端末情報の取得
    if (terminalType.value === TerminalTypes.Rental) {
      getRentalTerminal(terminalId.value)
    }
  }
  getTerminalTableList({ ...terminalTableQuery.value, ...query })
})
</script>

<template>
  <CardContainer>
    <div class="mb-3 flex-flex-start-center">
      <SvgIcon class="pt-1" :type="IconTypes.Monitoring" color="secondary" />
      <div class="flex-grow-1 ml-2 text-lg">{{ t('sideBar.trafficDetails') }}</div>
    </div>

    <SearchFilter @search="handleTerminalSearch" @clear="handleQueryClear">
      <InputGrid :label="t('terminals.name')">
        <InputForm
          :model-value="terminalTableQuery?.customerNote ?? ''"
          :placeholder="t('terminals.name')"
          @update:model-value="(value: string) => (terminalTableQuery.customerNote = value || undefined)"
        />
      </InputGrid>
      <InputGrid :label="t('terminals.terminalId')">
        <MultipleSelectForm
          :model-value="terminalTableQuery?.terminalId ?? []"
          :options="terminalIdOptions"
          placeholder="Z000000001 / ルーター名1, Z000000002 / ルーター名2,..."
          @update:model-value="updateQueryTerminalId"
        />
      </InputGrid>
    </SearchFilter>
    <div class="text-pre-wrap text-warning my-4">{{ t('trafficDetails.note.header') }}</div>
    <TrafficDetailTable
      :checked-id="terminalId ?? ''"
      :terminal-list="terminalTableList"
      :limit="terminalTablePagination.limit"
      :page="terminalTablePagination.page"
      :sort-option="terminalSortOption"
      :tenant-id="tenantId"
      @change="handleTrafficDetailChange"
      @update:checked-id="updateCheckedId"
    />

    <div v-if="!!terminal" class="my-4">
      <div class="text-pre-wrap">
        {{
          viewPattern.isMobile
            ? t('trafficDetails.note.mobile')
            : viewPattern.isIPoE
              ? t('trafficDetails.note.ipoe')
              : ''
        }}
      </div>
      <i18n-t
        v-if="trafficReportFlowAnalyzerMessage"
        :keypath="trafficReportFlowAnalyzerMessage.noteKeyPath"
        class="text-pre-wrap"
        tag="div"
        scope="global"
      >
        <template #icon>
          <SvgIcon :type="IconTypes.Lock" size="small" class="mx-1" />
        </template>
        <template #here>
          <NuxtLink :to="terminalDetailLink" target="_blank">
            {{ t('common.here') }}
          </NuxtLink>
        </template>
        <template #helpTooltip>
          <HelpTooltip class="d-inline-flex align-middle pb-1" size="smallMiddle">
            <i18n-t keypath="trafficDetails.checkApplicationMethod" tag="div" scope="global">
              <template #here>
                <NuxtLink :to="TRAFFIC_DETAIL_LINK.CHANGE_TRAFFIC" target="_blank">
                  {{ t('common.here') }}
                </NuxtLink>
              </template>
            </i18n-t>
          </HelpTooltip>
        </template>
      </i18n-t>
    </div>
    <SimpleTab
      v-if="!!terminal && !viewPattern.isMobile"
      :disabled="loading"
      :tabs="tabs"
      :current-tab-name="currentTabName"
      @click="handleTabChange"
    >
      <TrafficFlow
        v-if="showTrafficFlow"
        :guarantee-id="guaranteeId"
        :terminal="terminal"
        :has-break-out="!!rentalTerminal?.breakOut"
      />
      <template #traffic>
        <TrafficDetail :terminal="terminal" :show-loading="loading" />
      </template>
    </SimpleTab>
  </CardContainer>
</template>

<style lang="scss" scoped>
.charts {
  display: grid;
  grid-template-columns: repeat(1, minmax(280px, 1fr));
  gap: 0 0.5rem;
}
.align-middle {
  vertical-align: middle;
}
</style>
