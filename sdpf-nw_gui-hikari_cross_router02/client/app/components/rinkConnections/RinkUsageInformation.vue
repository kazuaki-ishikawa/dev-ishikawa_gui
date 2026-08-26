<script lang="ts" setup>
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import * as Papa from 'papaparse'
import type { RinkLineGroupListType, RinkLineGroupListCurrentUsageType } from '@/api/rinkLineGroups/types'
import { RinkLineStatusTypes } from '@/api/rinkLines/constants'
import type { RinkLineListType } from '@/api/rinkLines/types'

type PropType = {
  rinkLineGroupList: RinkLineGroupListType[]
  rinkLineList: RinkLineListType[]
  rinkLineGroupListCurrentUsageMap: Map<string, RinkLineGroupListCurrentUsageType>
}
const props = defineProps<PropType>()

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const rinkMobileId = computed(() => route.params.id as string)

const { loading } = useLoading()
const { rinkLineGroupUsageMonthMap, getRinkLineGroupUsageMonthMap } = useGetRinkLineGroupUsageMonthMap()
const { rinkLineGroupUsageSummaryMonthMap, getRinkLineGroupUsageSummaryMonthMap } =
  useGetRinkLineGroupUsageSummaryMonthMap()
const { rinkLineUsageSummaryMonthMap, getRinkLinesUsageSummaryMonthMap } = useGetRinkLinesUsageSummaryMonthMap()
const {
  rinkLineUsageMonthMap,
  rinkLineListCurrentUsageMap,
  getCurrentUsageData,
  getRinkLineUsageMonthMap,
  getRinkLineListCurrentUsageMap,
} = useGetRinkLineUsage()
const { rinkLineCurrentUsage, getRinkLineCurrentUsage } = useGetRinkLineCurrentUsage()
const { rinkLineGroupCurrentUsage, getRinkLineGroupCurrentUsage } = useGetRinkLineGroupCurrentUsage()
const { downloadCsv } = useDownloadCsv()

const openTop20Dialog = ref(false)
const openRinkLineUsagesDialog = ref(false)
const openRinkLineGroupUsageDialog = ref(false)
const openCurrentMonthUsageDialog = ref(false)
const currentMonthUsageDialogContent = ref({
  title: '',
  name: '',
  usage: 0,
  remainUsage: 0,
  unit: 'GB' as 'GB' | 'MB',
})

const usageLineList = computed(() => props.rinkLineList.filter(line => line.lineStatus !== RinkLineStatusTypes.Deleted))
const pagination = computed(() => ({
  limit: Number(route.query.limit) || 10,
  page: Number(route.query.page) || 1,
}))

const lineGroupHeaders = [
  {
    text: t('rinkLineGroups.lineGroupName'),
    key: 'lineGroupName',
  },
  {
    text: t('rinkLineGroups.lineCount'),
    key: 'lineCount',
  },
  {
    text: t('rinkLineGroups.lineGroupLimit'),
    key: 'lineGroupLimit',
  },
  { text: t('rinkLines.currentUsage'), key: 'currentUsage', width: 200 },
  { text: t('rinkLines.latestUsage'), key: 'latestUsage', width: 180 },
]

const lineGroupItems = computed(() =>
  props.rinkLineGroupList.map(lineGroup => {
    const usageInfo = props.rinkLineGroupListCurrentUsageMap.get(lineGroup.lineGroupId)
    return {
      lineGroupId: lineGroup.lineGroupId,
      lineGroupName: lineGroup.lineGroupName,
      lineCount: t('rinkLineGroups.count', { count: lineGroup.lineCount }),
      lineGroupLimit:
        usageInfo?.totalLineGroupLimit === undefined
          ? '-'
          : convertByteToUsageUnit(usageInfo.totalLineGroupLimit, 'GB', 'floor'),
      currentUsage: usageInfo?.usage === undefined ? '-' : convertByteToUsageUnit(usageInfo.usage, 'GB', 'ceil'),
    }
  }),
)

const selectedLineGroup = ref<{ id: string; name: string }>()
const handleRinkLineGroupUsageDialogOpen = async (lineGroupId: string) => {
  const found = props.rinkLineGroupList.find(lineGroup => lineGroup.lineGroupId === lineGroupId)
  selectedLineGroup.value = { id: lineGroupId, name: found?.lineGroupName || '' }
  await getRinkLineGroupUsageMonthMap(lineGroupId)
  await getRinkLineGroupUsageSummaryMonthMap(lineGroupId)
  openRinkLineGroupUsageDialog.value = true
}
const handleCloseRinkLineGroupUsageDialog = () => {
  openRinkLineGroupUsageDialog.value = false
  selectedLineGroup.value = undefined
}

const handleGetLineGroupLatestUsage = async (lineGroupId: string) => {
  const lineGroupName =
    props.rinkLineGroupList.find(lineGroup => lineGroup.lineGroupId === lineGroupId)?.lineGroupName || ''

  try {
    await getRinkLineGroupCurrentUsage(lineGroupId)
    currentMonthUsageDialogContent.value = {
      title: t('rinkLines.currentUsageTitle', { type: t('service.rinkLineGroups') }),
      name: lineGroupName,
      usage: rinkLineGroupCurrentUsage.value.usage,
      remainUsage: rinkLineGroupCurrentUsage.value.remainUsage,
      unit: 'GB',
    }
    openCurrentMonthUsageDialog.value = true
  } catch {
    // エラー時は何もしない
  }
}

const lineHeaders = [
  { text: t('rinkLines.lineNumber'), key: 'lineNumber', width: 180 },
  { text: t('rinkLines.plan'), key: 'planName', width: 200, class: 'text-sm' },
  { text: t('rinkLines.restrictionStatus'), key: 'restrictionStatus', width: 180 },
  { text: t('rinkLineGroups.lineGroupName'), key: 'lineGroupName', minWidth: 180, class: 'text-sm' },
  { text: t('rinkLines.currentUsage'), key: 'currentUsage', width: 260 },
  { text: t('rinkLines.latestUsage'), key: 'latestUsage', width: 180 },
]

const lineItems = computed(() =>
  usageLineList.value.map(line => {
    // 当月利用量
    const usageInfo = rinkLineListCurrentUsageMap.value.get(line.lineNumber)
    const lineGroupName = props.rinkLineGroupList.find(
      lineGroup => lineGroup.lineGroupId === line.lineGroupId,
    )?.lineGroupName

    return {
      lineNumber: line.lineNumber,
      planName: line.planName,
      restrictionStatus:
        usageInfo?.remainUsage === undefined
          ? '-'
          : usageInfo.remainUsage <= 0
            ? t('rinkLines.restriction')
            : t('rinkLines.noRestriction'),
      lineGroupName: lineGroupName || '-',
      currentUsage: usageInfo?.usage === undefined ? '-' : convertByteToMBWithGB(usageInfo.usage, 'ceil'),
    }
  }),
)

const handleChangeLimit = (limit: number) => {
  router.push({ query: { ...route.query, limit, page: 1 } })
}
const handleChangePage = (page: number) => {
  router.push({ query: { ...route.query, page } })
}

const tableItems = computed(() => {
  const startIndex = (pagination.value.page - 1) * pagination.value.limit
  const endIndex = startIndex + pagination.value.limit
  return lineItems.value.slice(startIndex, endIndex)
})

const handleGetLineLatestUsage = async (lineNumber: string) => {
  const name = `${t('service.rinkLines')}（${lineNumber}）`

  try {
    await getRinkLineCurrentUsage(lineNumber)
    currentMonthUsageDialogContent.value = {
      title: t('rinkLines.currentUsageTitle', { type: t('service.rinkLines') }),
      name,
      usage: rinkLineCurrentUsage.value.usage,
      remainUsage: rinkLineCurrentUsage.value.remainUsage,
      unit: 'MB',
    }
    openCurrentMonthUsageDialog.value = true
  } catch {
    // エラー時は何もしない
  }
}

const handleDownloadCsv = async () => {
  const csvData = usageLineList.value.map(async line => {
    // 必要なデータの取得
    await getRinkLineUsageMonthMap(line.lineNumber)

    const thisMonthUsages = rinkLineUsageMonthMap.value.get(dayjs().format('YYYY-MM'))
    const lastMonthUsages = rinkLineUsageMonthMap.value.get(dayjs().subtract(1, 'months').format('YYYY-MM'))
    const twoMonthAgoUsages = rinkLineUsageMonthMap.value.get(dayjs().subtract(2, 'months').format('YYYY-MM'))

    // 当月利用量
    const currentUsageData = getCurrentUsageData(thisMonthUsages)
    const lastMonthUsageTotal = getCurrentUsageData(lastMonthUsages).usage
    const twoMonthAgoUsageTotal = getCurrentUsageData(twoMonthAgoUsages).usage
    // TODO: 回答次第で修正 https://redmine.tok.access-company.com/nwvpn/issues/16310#note-13
    const updatedUsageDate = thisMonthUsages?.lineUsageList?.toSorted((a, b) => (a.date < b.date ? 1 : -1))[0]?.date
    const restrictedMonth = thisMonthUsages?.lineUsageList?.reduce(
      (acc, cur) => {
        const totalUsages = acc.totalUsages + cur.usage
        if (!acc.date && (thisMonthUsages?.totalLimit ?? 0) <= totalUsages) {
          return { date: cur.date, totalUsages }
        }
        return { ...acc, totalUsages }
      },
      { date: '', totalUsages: 0 },
    )

    const dailyUsages = [...Array(31)].reduce<{ [key: string]: number }>((acc, _, index) => {
      const date = dayjs().subtract(index, 'day')
      const usageData = [
        // 全ての lineUsageList から該当日の usage を探す
        ...(thisMonthUsages?.lineUsageList ?? []),
        ...(lastMonthUsages?.lineUsageList ?? []),
        ...(twoMonthAgoUsages?.lineUsageList ?? []),
      ].find(usage => date.isSame(usage.date, 'day'))
      const label =
        index === 0 ? t('rinkLines.csvHeader.todayDailyUsages') : t('rinkLines.csvHeader.dailyUsages', { date: index })
      return {
        ...acc,
        [label]: usageData ? usageData.usage : 0,
      }
    }, {})
    return {
      [t('rinkLines.lineNumber')]: line.lineNumber,
      [t('rinkLines.restrictionStatus')]:
        currentUsageData.remainUsage <= 0 ? t('rinkLines.restriction') : t('rinkLines.noRestriction'),
      [t('rinkLines.csvHeader.restrictedMonth')]: restrictedMonth?.date ? restrictedMonth.date : '-',
      [t('rinkLines.csvHeader.restrictedDate')]: restrictedMonth?.date ? restrictedMonth.date : '-',
      [t('rinkLines.csvHeader.updatedUsageDate')]: updatedUsageDate ?? '-',
      [t('rinkLines.csvHeader.thisMonthUsages')]: currentUsageData.usage,
      [t('rinkLines.csvHeader.lastMonthUsages')]: lastMonthUsageTotal,
      [t('rinkLines.csvHeader.twoMonthAgoUsages')]: twoMonthAgoUsageTotal,
      ...dailyUsages,
      [t('rinkLines.csvHeader.contractNumber')]: rinkMobileId.value,
      [t('rinkLineGroups.lineGroupName')]:
        props.rinkLineGroupList.find(lineGroup => lineGroup.lineGroupId === line.lineGroupId)?.lineGroupName || '-',
    }
  })

  try {
    const response = await Promise.all(csvData)
    const fileName = `RINK_Mobile_LineTraffic_${rinkMobileId.value}_${dayjs().format('YYYYMMDDHHmmss')}`
    const csv = Papa.unparse(response)
    await downloadCsv(csv, fileName)
  } catch {
    // ダウンロード失敗時は何もしない
  }
}

const handleRinkLineUsagesDialogOpen = async (lineNumber: string) => {
  await getRinkLineUsageMonthMap(lineNumber)
  openRinkLineUsagesDialog.value = true
}
const handleOpenUsageTop20Dialog = async () => {
  await getRinkLinesUsageSummaryMonthMap(rinkMobileId.value)
  openTop20Dialog.value = true
}

const lineNumberList = computed(() => usageLineList.value.map(line => line.lineNumber))
watch(lineNumberList, () => getRinkLineListCurrentUsageMap(lineNumberList.value), { immediate: true })
</script>

<template>
  <!-- 容量シェアグループ -->
  <InnerCard :title="t('service.rinkLineGroups')">
    <SeparatedTable :headers="lineGroupHeaders" :items="lineGroupItems">
      <template #lineGroupName="{ row }">
        <div class="pa">{{ row.lineGroupName }}</div>
      </template>
      <template #currentUsage="{ row }">
        <div class="flex-flex-end-center w-100 mr-3">
          <div class="px-5">{{ row.currentUsage }}</div>
          <CustomButton
            :text="t('common.graph')"
            :width="80"
            @click="handleRinkLineGroupUsageDialogOpen(row.lineGroupId)"
          />
        </div>
      </template>
      <template #latestUsage="{ row }">
        <CustomButton
          :text="t('rinkLines.showLatestUsage')"
          :width="160"
          @click="handleGetLineGroupLatestUsage(row.lineGroupId)"
        />
      </template>
    </SeparatedTable>
  </InnerCard>

  <!-- 回線一覧 -->
  <div class="flex-space-between-center mb-4 mt-8">
    <div class="text-lg">{{ t('service.rinkLines') }} {{ t('common.list') }}</div>
    <div class="flex-space-between-center">
      <CustomButton
        :text="t('rinkLines.usagesTop20Button')"
        :width="300"
        :disabled="!lineItems.length || loading"
        @click="handleOpenUsageTop20Dialog"
      />
      <CustomButton
        icon="download"
        :text="t('common.download')"
        :disabled="!lineItems.length || loading"
        :width="180"
        class="ml-4"
        @click="handleDownloadCsv"
      />
    </div>
  </div>
  <PaginationHeader
    :page="pagination.page"
    :limit="pagination.limit"
    :total="lineItems.length"
    @update:limit="handleChangeLimit"
  />
  <StripedTable :headers="lineHeaders" :items="tableItems" :key-items="['lineNumber']">
    <template #currentUsage="{ row }">
      <div class="min-w-full flex-flex-end-center">
        <div class="mr-auto">{{ row.currentUsage }}</div>
        <CustomButton :text="t('common.graph')" :width="80" @click="handleRinkLineUsagesDialogOpen(row.lineNumber)" />
      </div>
    </template>
    <template #latestUsage="{ row }">
      <CustomButton
        :text="t('rinkLines.showLatestUsage')"
        :width="160"
        @click="handleGetLineLatestUsage(row.lineNumber)"
      />
    </template>
  </StripedTable>
  <PaginationFooter
    :page="pagination.page"
    :limit="pagination.limit"
    :total="lineItems.length"
    @update:page="handleChangePage"
  />

  <!-- 当月利用量表示ダイアログ -->
  <DialogBase
    :open="openCurrentMonthUsageDialog"
    :title="currentMonthUsageDialogContent.title"
    @close="openCurrentMonthUsageDialog = false"
  >
    <div class="text-center text-xl mt-8">
      <div>
        {{
          t('rinkLines.message.currentUsage', {
            name: currentMonthUsageDialogContent.name,
            currentUsage:
              currentMonthUsageDialogContent.unit === 'MB'
                ? convertByteToMBWithGB(currentMonthUsageDialogContent.usage, 'ceil')
                : convertByteToUsageUnit(
                    currentMonthUsageDialogContent.usage,
                    currentMonthUsageDialogContent.unit,
                    'ceil',
                  ),
          })
        }}
      </div>
      <div>
        {{
          t('rinkLines.message.remainUsage', {
            remainUsage:
              currentMonthUsageDialogContent.unit === 'MB'
                ? convertByteToMBWithGB(currentMonthUsageDialogContent.remainUsage, 'floor')
                : convertByteToUsageUnit(
                    currentMonthUsageDialogContent.remainUsage,
                    currentMonthUsageDialogContent.unit,
                    'floor',
                  ),
          })
        }}
      </div>
    </div>
  </DialogBase>
  <!-- 容量シェアグループ当月利用量グラフ表示ダイアログ -->
  <RinkLineGroupUsageDialog
    :open="openRinkLineGroupUsageDialog"
    :line-group-name="selectedLineGroup?.name || ''"
    :rink-line-group-usage-month-map="rinkLineGroupUsageMonthMap"
    :rink-line-group-usage-summary-month-map="rinkLineGroupUsageSummaryMonthMap"
    @close="handleCloseRinkLineGroupUsageDialog"
  />
  <!-- 利用量上位20回線表示ダイアログ -->
  <RinkLineUsagesTop20Dialog
    :open="openTop20Dialog"
    :rink-line-usage-summary-month-map="rinkLineUsageSummaryMonthMap"
    @close="openTop20Dialog = false"
  />
  <!-- 回線当月利用量グラフ表示ダイアログ -->
  <RinkLineUsagesDialog
    :open="openRinkLineUsagesDialog"
    :rink-line-usage-month-map="rinkLineUsageMonthMap"
    @close="openRinkLineUsagesDialog = false"
  />
</template>

<style lang="scss" scoped>
.pa {
  padding: 0.625rem;
}
.min-w-full {
  min-width: 100%;
}
</style>
