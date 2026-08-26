<script setup lang="ts">
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import { ResourceStatusTypes, SecurityOptionTypes } from '@/api/constants'
import type { TerminalUtilOptionCountFlowCollectorResponse } from '@/api/terminals/types'
import type { BehaviorDetectionPlanType } from '@/api/behaviorDetection/types'
import { TermsOfServiceBasePath } from '@/api/termsOfService/constants'
import { TenantPages, SecurityContractsPages } from '@/components/sidebar/constants'
import type { SecurityContractsPageType } from '@/components/sidebar/types'
import type { MultiLevelHeaderType } from '@/components/table/types'
import { IconTypes } from '@/components/icons/constants'

type ChartOptionPropType = {
  type: 'behaviorDetection' | 'threatDetectionOptions' | 'flowCollectorOptions'
  total: number
  counts?: Partial<TerminalUtilOptionCountFlowCollectorResponse>
}

const route = useRoute()
const { t } = useI18n()
const { $vuetify } = useNuxtApp()
const colors = computed(() => $vuetify.theme.current.value.colors)

const tenantId = computed(() => route.params.tenantId as string)
const terminalListRef = ref<HTMLElement>()
const showDetailDialog = ref(false)
const showPlanChangeDialog = ref(false)

const { terminalUtilOptionCount, getTerminalUtilOptionCount } = useGetTerminalUtilOptionCount()
const { securityHelpDesk, getSecurityHelpDesk } = useGetSecurityHelpDesk()
const { allThreatDetectionSharedTenantList, getAllThreatDetectionSharedTenantList } =
  useGetAllThreatDetectionSharedTenantList()
const { terminalIdOptions, getAllResourceSummaryTerminalList } = useGetAllResourceSummaryTerminalList()
const {
  terminalTableList,
  terminalTableQuery,
  terminalSortOption,
  terminalTablePagination,
  terminalTableItems,
  getTerminalTableList,
  routerPushQuery,
  handleChangeLimit,
  handleChangePage,
  handleSort,
  handleQueryClear,
  updateQueryTerminalId,
} = useGetTerminalTableList()
const { getFlowCollectorPlanText, getThreatDetectionPlanText, getBehaviorDetectionPlanText } = useTerminalInput()
const {
  securityTermsOfServiceAccepted,
  getTermsOfServiceAccepted: getSecurityTermsOfServiceAccepted,
  moveToSecurityTermOfService,
} = useTermsOfService(TermsOfServiceBasePath.Security)

const { updateBehaviorDetection } = useUpdateBehaviorDetection()
const {
  settingsBehaviorDetection,
  currentSettingsBehaviorDetectionPlan,
  getSettingsBehaviorDetection,
  updateSettingsBehaviorDetectionState,
} = useGetSettingsBehaviorDetection()
const { behaviorDetectionSSO, postBehaviorDetectionSSO } = usePostBehaviorDetectionSSO()

const infoColor = computed(() => colors.value.info as string)
const primaryColor = computed(() => colors.value.primary as string)

const terminalBehaviorCount = computed(() => {
  const behaviorData = terminalUtilOptionCount.value?.behaviorDetection
  return behaviorData ? (behaviorData.lite || 0) + (behaviorData.standard || 0) : 0
})

const editBehaviorDetectionPlanDisabled = computed(
  () =>
    settingsBehaviorDetection.value?.nextMonthBehaviorDetectionPlan !==
    settingsBehaviorDetection.value?.thisMonthBehaviorDetectionPlan,
)

const getChartsConfig = (data: ChartOptionPropType) => {
  if (data.type === 'behaviorDetection') {
    const behaviorSeries = [
      {
        name: t('common.disuse'),
        y: data.total - terminalBehaviorCount.value,
        color: infoColor.value,
      },
      {
        name: t('common.use'),
        y: terminalBehaviorCount.value,
        color: primaryColor.value,
      },
    ].filter(item => item.y > 0)

    const behaviorLegendConfig = {
      align: 'center',
      alignColumns: false,
      verticalAlign: 'bottom',
    }
    return { series: behaviorSeries, counts: terminalBehaviorCount.value, legendConfig: behaviorLegendConfig }
  } else {
    const securitySeries = Object.values(SecurityOptionTypes)
      .map(value => {
        if (data.counts?.[value] === undefined) {
          return
        }
        const name = t(`terminals.${data.type}.${value}`)
        const color =
          value === SecurityOptionTypes.NoSubscription
            ? infoColor.value
            : value === SecurityOptionTypes.Plan6Months
              ? (colors.value.secondary as string)
              : value === SecurityOptionTypes.Plan3Months
                ? (colors.value.success as string)
                : primaryColor.value
        return { name, y: data.counts[value], color }
      })
      .filter(Boolean)

    const securityCounts =
      (data.counts?.[SecurityOptionTypes.Plan3Months] ?? 0) +
      (data.counts?.[SecurityOptionTypes.Plan6Months] ?? 0) +
      (data.counts?.[SecurityOptionTypes.Plan12Months] ?? 0)

    const securityLegendConfig = {
      align: 'center',
      alignColumns: false,
      verticalAlign: 'bottom',
      y: 20,
    }
    return { series: securitySeries, counts: securityCounts, legendConfig: securityLegendConfig }
  }
}

const getChartOptions = (data: ChartOptionPropType) => {
  const { series, counts, legendConfig } = getChartsConfig(data)

  return {
    chart: { type: 'pie', backgroundColor: colors.value.highlight as string },
    accessibility: { enabled: false },
    title: { text: '' },
    subtitle: {
      useHTML: true,
      text: `<br/><span>${counts}/${data.total}</span>`,
      style: {
        fontWeight: 500,
        fontSize: '50px',
      },
      verticalAlign: 'middle',
      y: -5,
    },
    legend: legendConfig,
    tooltip: {
      headerFormat: '',
      pointFormat: '<b style="font-size: 16px"><span style="color:{point.color}">{point.name}</span>: {point.y}</b>',
    },
    plotOptions: {
      pie: {
        showInLegend: true,
        colorByPoint: true,
        size: '100%',
        innerSize: '80%',
        dataLabels: {
          enabled: true,
          crop: false,
          distance: '-10%',
          format: '{point.y}',
          style: {
            fontWeight: 'bold',
            color: '#fff',
            fontSize: '20px',
          },
          connectorWidth: 0,
        },
      },
    },
    series: [{ data: series, color: infoColor.value }],
    navigation: {
      buttonOptions: {
        enabled: false,
      },
    },
    credits: {
      enabled: false,
    },
  }
}
const threatDetectionsChartOptions = computed(() => {
  return getChartOptions({
    type: 'threatDetectionOptions',
    total: terminalUtilOptionCount.value?.total ?? 0,
    counts: terminalUtilOptionCount.value?.threatDetection,
  })
})
const flowCollectorsChartOptions = computed(() => {
  return getChartOptions({
    type: 'flowCollectorOptions',
    total: terminalUtilOptionCount.value?.total ?? 0,
    counts: terminalUtilOptionCount.value?.flowCollector,
  })
})
const flowCollectorTotalUsage = computed(() => {
  const totalUsage = terminalUtilOptionCount.value?.flowCollector?.totalUsage ?? 0
  return convertByteToString(totalUsage)
})
const behaviorDetectionChartOptions = computed(() => {
  return getChartOptions({
    type: 'behaviorDetection',
    total: terminalUtilOptionCount.value?.total ?? 0,
  })
})

const moveToSubMenu = async (subMenu: SecurityContractsPageType, childSubMenu?: SecurityContractsPageType) => {
  const subMenuPath = [subMenu, childSubMenu].filter(Boolean).join('/')
  await navigateTo(`/tenants/${tenantId.value}/${TenantPages.SecurityContracts}/${subMenuPath}`)
}
const moveToTerminalEditBulk = async () => {
  await navigateTo(`/tenants/${tenantId.value}/${TenantPages.Terminals}/edit-bulk`)
}

const openDetailDialog = async () => {
  await postBehaviorDetectionSSO()
  if (behaviorDetectionSSO.value) {
    showDetailDialog.value = true
  }
}

const openPlanChangeDialog = () => {
  showPlanChangeDialog.value = true
}

const columnWidth = [
  { key: 'terminalId', width: 125 },
  { key: 'terminalType', width: 145 },
  { key: 'customerNote' },
  { key: 'primaryCircuit', width: 144 },
  { key: 'primaryCircuitId', width: 121 },
  { key: 'secondaryCircuit', width: 144 },
  { key: 'secondaryCircuitId', width: 121 },
  { key: 'threatDetectionPlan', width: 130 },
  { key: 'flowCollectorPlan', width: 130 },
  { key: 'behaviorDetectionPlan', width: 140 },
]
const multiLevelHeaders: MultiLevelHeaderType[][] = [
  [
    { key: 'terminalId', text: t('terminals.terminalId'), colSpan: 1, rowSpan: 2, bottom: true, class: 'text-sm mr-1' },
    {
      key: 'terminalType',
      text: t('guarantees.terminalType'),
      colSpan: 1,
      rowSpan: 2,
      bottom: true,
      class: 'text-sm mr-1',
    },
    { key: 'customerNote', text: t('terminals.name'), colSpan: 1, rowSpan: 2, bottom: true, class: 'text-sm mr-1' },
    { key: undefined, text: t('terminals.primary'), colSpan: 2, rowSpan: 1, class: 'text-sm' },
    { key: undefined, text: t('terminals.secondary'), colSpan: 2, rowSpan: 1, class: 'text-sm' },
    {
      key: 'threatDetectionPlan',
      text: t('terminals.threatDetectionPlan'),
      colSpan: 1,
      rowSpan: 2,
      bottom: true,
      class: 'text-sm mr-1',
    },
    {
      key: 'flowCollectorPlan',
      text: t('terminals.flowCollectorPlan'),
      colSpan: 1,
      rowSpan: 2,
      bottom: true,
      class: 'text-pre-wrap text-sm mr-1',
    },
    {
      key: 'behaviorDetectionPlan',
      text: t('terminals.behaviorDetection'),
      colSpan: 1,
      rowSpan: 2,
      bottom: true,
      class: 'text-pre-wrap text-sm mr-1',
    },
  ],
  [
    { key: 'primaryCircuit', text: t('terminals.circuitType'), colSpan: 1, rowSpan: 1, bottom: true, class: 'text-sm' },
    { key: 'primaryCircuitId', text: t('terminals.circuitId'), colSpan: 1, rowSpan: 1, bottom: true, class: 'text-sm' },
    {
      key: 'secondaryCircuit',
      text: t('terminals.circuitType'),
      colSpan: 1,
      rowSpan: 1,
      bottom: true,
      class: 'text-sm',
    },
    {
      key: 'secondaryCircuitId',
      text: t('terminals.circuitId'),
      colSpan: 1,
      rowSpan: 1,
      bottom: true,
      class: 'text-sm',
    },
  ],
]
const slotNames = [
  'terminalId',
  'terminalType',
  'customerNote',
  'primaryCircuit',
  'primaryCircuitId',
  'secondaryCircuit',
  'secondaryCircuitId',
  'threatDetectionPlan',
  'flowCollectorPlan',
  'behaviorDetectionPlan',
]

const routeQuery = computed(() =>
  ['limit', 'page', 'terminalId', 'customerNote', 'sortKey', 'direction'].reduce(
    (q, key) => {
      const value = route.query[key]
      if (['limit', 'page'].includes(key) && !isNaN(Number(value))) {
        if (key === 'page') {
          return Object.assign(q, { offset: Number(value) < 2 ? 0 : Number(value) - 1 })
        }
        return Object.assign(q, { [key]: Number(value) })
      } else if (key === 'terminalId' && typeof value === 'string') {
        return Object.assign(q, { [key]: [value] })
      } else if (key === 'sortKey') {
        // デフォルトは"updateTime"を指定
        return Object.assign(q, { [key]: value || 'updateTime' })
      } else if (key === 'direction') {
        // デフォルトは"desc"を指定
        return Object.assign(q, { [key]: value || 'desc' })
      } else {
        return Object.assign(q, { [key]: value })
      }
    },
    { ...terminalTableQuery.value, resourceStatus: [ResourceStatusTypes.Active] },
  ),
)

const handleSearch = () => {
  terminalTableQuery.value = { ...terminalTableQuery.value, offset: 0 }
  if (isEqual(routeQuery.value, terminalTableQuery.value)) {
    // パスクエリの変更がない場合は直接 getTerminalTableList を実行する
    getTerminalTableList(routeQuery.value)
  } else {
    routerPushQuery(terminalTableQuery.value)
  }
}

watch(
  () => route.query,
  () => {
    getTerminalTableList(routeQuery.value)
  },
  { immediate: true },
)

const handleBehaviorDetectionPlanSubmit = async (behaviorDetectionPlan: BehaviorDetectionPlanType) => {
  try {
    const response = await updateBehaviorDetection({ behaviorDetectionPlan })
    updateSettingsBehaviorDetectionState(response)
  } finally {
    showPlanChangeDialog.value = false
  }
}

onMounted(async () => {
  // terminalListRef.value が表示されるまで少し待つ
  await sleep(300)
  if (!!route.query.terminalId && terminalListRef.value) {
    terminalListRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
})
onBeforeMount(async () => {
  getAllResourceSummaryTerminalList({ resourceStatus: [ResourceStatusTypes.Active] })
  getTerminalUtilOptionCount()
  getSecurityHelpDesk()
  getSettingsBehaviorDetection()

  await getSecurityTermsOfServiceAccepted()
  if (securityTermsOfServiceAccepted.value) {
    getAllThreatDetectionSharedTenantList()
  }
})
</script>

<template>
  <div>
    <CardContainer class="mb-5">
      <div class="flex-flex-start-center">
        <!-- TODO アイコン変更 -->
        <!-- <SvgIcon :type="IconTypes.AlertChart" color="secondary" /> -->
        <div class="text-lg">{{ t('securityContracts.securityList') }}</div>
        <CustomButton
          class="ml-auto"
          icon="up-right-square"
          :text="t('terms.confirmation')"
          :width="180"
          @click="() => moveToSecurityTermOfService(tenantId)"
        />
      </div>
      <div v-if="!securityTermsOfServiceAccepted" class="text-warning">
        {{ t('securityContracts.message.requiredSecurityAccepted') }}
      </div>
      <div class="security-contracts-summary-grid mt-3">
        <InnerCard>
          <div class="text-secondary">{{ t('securityContracts.threatDetections') }}</div>
          <div class="my-2">
            <highcharts :options="threatDetectionsChartOptions" />
          </div>
          <div class="h-60px flex-center-flex-end">
            <CustomButton
              class="mr-2"
              icon="right-arrow"
              :text="t('common.detail')"
              :width="130"
              @click="moveToSubMenu(SecurityContractsPages.ThreatDetections)"
            />
            <CustomButton
              icon="right-arrow"
              :text="t('securityContracts.updateContracts')"
              :width="130"
              :disabled="!securityTermsOfServiceAccepted"
              @click="moveToTerminalEditBulk"
            />
          </div>
        </InnerCard>
        <InnerCard>
          <div class="text-secondary">{{ t('securityContracts.flowCollectors') }}</div>
          <div class="my-2">
            <highcharts :options="flowCollectorsChartOptions" />
            <div class="text-center">
              {{ t('securityContracts.flowCollectorTotalUsage') }}: {{ flowCollectorTotalUsage }}
            </div>
          </div>
          <div class="flex-center-center">
            <CustomButton
              class="mr-2"
              icon="right-arrow"
              :text="t('common.detail')"
              :width="130"
              @click="moveToSubMenu(SecurityContractsPages.FlowCollectors)"
            />
            <CustomButton
              icon="right-arrow"
              :text="t('securityContracts.updateContracts')"
              :width="130"
              :disabled="!securityTermsOfServiceAccepted"
              @click="moveToTerminalEditBulk"
            />
          </div>
        </InnerCard>
        <InnerCard>
          <div class="text-secondary">{{ t('securityContracts.behaviorDetection') }}</div>
          <div class="my-2">
            <highcharts :options="behaviorDetectionChartOptions" />
            <div v-if="currentSettingsBehaviorDetectionPlan" class="text-center">
              {{
                t('securityContracts.currentPlan', {
                  plan: t(`securityContracts.behaviorDetectionPlan.${currentSettingsBehaviorDetectionPlan}`),
                })
              }}
            </div>
          </div>
          <div class="flex-center-center">
            <CustomButton
              class="mr-2"
              icon="right-arrow"
              :text="t('common.detail')"
              :width="130"
              @click="openDetailDialog"
            />
            <CustomButton
              icon="right-arrow"
              :text="t('securityContracts.updateContracts')"
              :width="130"
              :disabled="editBehaviorDetectionPlanDisabled"
              @click="openPlanChangeDialog"
            />
          </div>
        </InnerCard>
        <div class="security-contracts-summary-side">
          <InnerCard class="max-h-200px">
            <div class="text-secondary">{{ t('securityContracts.securityHelpDesk') }}</div>
            <div class="min-h-125px my-2">
              <div class="text-center pt-9">
                {{ securityHelpDesk?.enabled ? t('securityHelpDesk.using') : t('securityHelpDesk.notUsing') }}
              </div>
              <div v-if="securityHelpDesk?.enabled" class="text-center">
                {{
                  t('securityContracts.securityHelpDeskStartDate', {
                    date: formatDate(securityHelpDesk?.effectiveDate),
                  })
                }}
              </div>
            </div>
            <CustomButton
              class="mx-auto"
              icon="right-arrow"
              :text="t('securityContracts.updateContracts')"
              :width="130"
              :disabled="!securityTermsOfServiceAccepted"
              @click="moveToSubMenu(SecurityContractsPages.SecurityHelpDesk)"
            />
          </InnerCard>
          <InnerCard class="max-h-200px">
            <div class="text-secondary">{{ t('securityContracts.threatDetectionShared') }}</div>
            <div class="min-h-125px my-2">
              <div class="text-center pt-9">
                {{
                  (allThreatDetectionSharedTenantList?.total ?? 0) > 0
                    ? t('securityHelpDesk.using')
                    : t('securityHelpDesk.notUsing')
                }}
              </div>
            </div>
            <div class="flex-center-center">
              <CustomButton
                class="mr-2"
                icon="right-arrow"
                :text="t('common.detail')"
                :width="130"
                @click="
                  moveToSubMenu(SecurityContractsPages.ThreatDetectionShared, SecurityContractsPages.ThreatDetections)
                "
              />
              <CustomButton
                icon="right-arrow"
                :text="t('securityContracts.updateContracts')"
                :width="130"
                :disabled="!securityTermsOfServiceAccepted"
                @click="moveToSubMenu(SecurityContractsPages.ThreatDetectionShared)"
              />
            </div>
          </InnerCard>
        </div>
      </div>
    </CardContainer>
    <CardContainer>
      <div ref="terminalListRef" class="flex-flex-start-center">
        <SvgIcon :type="IconTypes.Terminal" color="secondary" />
        <div class="text-lg ml-2">{{ t('securityContracts.terminalList') }}</div>
      </div>
      <div class="flex-space-between-flex-end flex-wrap mt-3">
        <SearchFilter @search="handleSearch" @clear="handleQueryClear">
          <InputGrid :label="t('terminals.name')" :label-width="180">
            <InputForm
              :model-value="terminalTableQuery?.customerNote ?? ''"
              :placeholder="t('terminals.name')"
              @update:model-value="(value: string) => (terminalTableQuery.customerNote = value || undefined)"
            />
          </InputGrid>
          <InputGrid :label="t('terminals.terminalId')" :label-width="180">
            <MultipleSelectForm
              :model-value="terminalTableQuery?.terminalId ?? []"
              :options="terminalIdOptions"
              placeholder="Z000000001 / ルーター名1, Z000000002 / ルーター名2,..."
              @update:model-value="updateQueryTerminalId"
            />
          </InputGrid>
        </SearchFilter>
      </div>
      <CustomButton
        class="mb-2"
        icon="right-arrow"
        :text="t('securityContracts.updateBulkContracts')"
        :width="180"
        :disabled="!securityTermsOfServiceAccepted"
        @click="moveToTerminalEditBulk"
      />
      <div class="text-error mb-3">{{ t('securityContracts.message.updateBulkContracts') }}</div>
      <PaginationHeader
        :page="terminalTablePagination.page"
        :limit="terminalTablePagination.limit"
        :total="terminalTableList.total"
        @update:limit="handleChangeLimit"
      />
      <MultiLevelHeaderSortableTable
        :multi-level-headers="multiLevelHeaders"
        :column-widths="columnWidth"
        :items="terminalTableItems"
        :slot-names="slotNames"
        :key-items="['terminalId']"
        :sort="terminalSortOption"
        :unsortable-keys="['primaryCircuit', 'primaryCircuitId', 'secondaryCircuit', 'secondaryCircuitId']"
        @sort="handleSort"
      >
        <template #terminalId="{ row }">
          <NuxtLink :to="`/tenants/${tenantId}/${row.terminalPath}/${row.terminalId}`">{{ row.terminalId }}</NuxtLink>
        </template>
        <template #terminalType="{ data }">
          <div class="text-xs">{{ data }}</div>
        </template>
        <template #customerNote="{ row }">
          <div class="text-truncate" :title="row.customerNote">{{ row.customerNote }}</div>
        </template>
        <template #primaryCircuit="{ data }">
          <div class="text-xs text-pre-wrap">{{ !!data ? t(`service.${data}`) : '-' }}</div>
        </template>
        <template #primaryCircuitId="{ row, data }">
          <NuxtLink v-if="row.primaryCircuitPath" :to="`/tenants/${tenantId}/${row.primaryCircuitPath}/${data}`">
            {{ data }}
          </NuxtLink>
          <div v-else>
            {{ data }}
          </div>
        </template>
        <template #secondaryCircuit="{ data }">
          <div class="text-xs text-pre-wrap">{{ !!data ? t(`service.${data}`) : '-' }}</div>
        </template>
        <template #secondaryCircuitId="{ row, data }">
          <NuxtLink v-if="row.secondaryCircuitPath" :to="`/tenants/${tenantId}/${row.secondaryCircuitPath}/${data}`">
            {{ data }}
          </NuxtLink>
          <div v-else>
            {{ data || '-' }}
          </div>
        </template>
        <template #threatDetectionPlan="{ row }">
          <div class="text-sm">
            {{ getThreatDetectionPlanText(row.threatDetectionPlan) }}
          </div>
        </template>
        <template #flowCollectorPlan="{ row }">
          <div class="text-sm">
            {{ getFlowCollectorPlanText(row.flowCollectorPlan) }}
          </div>
        </template>
        <template #behaviorDetectionPlan="{ row }">
          <div class="text-sm">
            {{ getBehaviorDetectionPlanText(row.behaviorDetectionPlan) }}
          </div>
        </template>
      </MultiLevelHeaderSortableTable>
      <PaginationFooter
        :page="terminalTablePagination.page"
        :limit="terminalTablePagination.limit"
        :total="terminalTableList.total"
        @update:page="handleChangePage"
      />
    </CardContainer>
    <DialogBase
      :width="650"
      :open="showDetailDialog"
      :cancel-label="t('common.close')"
      @close="showDetailDialog = false"
      @cancel="showDetailDialog = false"
    >
      <div class="text-center">
        <div class="text-pre-wrap pb-4">{{ t('securityContracts.message.console') }}</div>
        <div>
          <NuxtLink :to="behaviorDetectionSSO?.url" target="_blank">
            {{ t('securityContracts.behaviorDetectionConsole') }}
          </NuxtLink>
        </div>
      </div>
    </DialogBase>

    <BehaviorDetectionPlanEditDialog
      :open="showPlanChangeDialog"
      :original-plan="currentSettingsBehaviorDetectionPlan"
      :terminal-count="terminalBehaviorCount"
      @submit="handleBehaviorDetectionPlanSubmit"
      @close="showPlanChangeDialog = false"
      @cancel="showPlanChangeDialog = false"
    />
  </div>
</template>

<style lang="scss" scoped>
$summary-card-min-width: 320px;
$summary-grid-column-gap: 1rem;
$summary-three-column-min-width: calc($summary-card-min-width * 3 + $summary-grid-column-gap * 2);
$summary-three-column-max-width: calc($summary-card-min-width * 4 + $summary-grid-column-gap * 3 - 1px);

.security-contracts-summary-grid {
  container-type: inline-size;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax($summary-card-min-width, 1fr));
  gap: 0 $summary-grid-column-gap;
}
@container (min-width: #{$summary-three-column-min-width}) and (max-width: #{$summary-three-column-max-width}) {
  .security-contracts-summary-side {
    display: contents;
  }
}
.max-h-200px {
  max-height: 200px;
}
.min-h-125px {
  min-height: 125px;
}
.h-60px {
  height: 60px;
}
</style>
