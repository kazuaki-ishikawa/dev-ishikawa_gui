<script setup lang="ts">
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { ResourceStatusTypes } from '@/api/constants'
import { TermsOfServiceBasePath } from '@/api/termsOfService/constants'
import type { ThreatDetectionsQuery } from '@/api/threatDetections/types'
import { PeriodTypes, PeriodMinutesGapMap } from '@/components/search/constants'
import type { PeriodType } from '@/components/search/types'
import type { SortOption } from '@/components/table/types'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenantId as string)

const threatDetectionsFilter = ref<Omit<ThreatDetectionsQuery, 'limit' | 'offset'>>({})
const pagination = computed(() => ({
  limit: Number(route.query.limit) || 10,
  page: Number(route.query.page) || 1,
}))
const { getThreatDetectionsTableList, threatDetectionsTableList } = useGetThreatDetectionsTableList()
const { terminalIdOptions, resourceSummaryTerminalList, getAllResourceSummaryTerminalList } =
  useGetAllResourceSummaryTerminalList()
const { customerNoteList: guaranteeList, getAllResourceSummaryGuaranteeList } = useGetAllResourceSummaryGuaranteeList()
const { customerNoteList: ipoeList, getAllSummaryIpoeList } = useGetAllSummaryIpoeList()
const {
  securityTermsOfServiceAccepted,
  getTermsOfServiceAccepted: getSecurityTermsOfServiceAccepted,
  moveToSecurityTermOfService,
} = useTermsOfService(TermsOfServiceBasePath.Security)

const periodType = ref<PeriodType>(PeriodTypes.Last1Day)

const searchDisabled = computed(
  () =>
    !threatDetectionsFilter.value.startTime ||
    !threatDetectionsFilter.value.endTime ||
    !securityTermsOfServiceAccepted.value,
)

const circuitIdOptions = computed(() => {
  const primaryList = resourceSummaryTerminalList.value.terminals
    .map(terminal => {
      const id = terminal.primaryCircuit.circuitId
      if (terminal.primaryCircuit.circuitType === 'ipoe') {
        const customerNote = ipoeList.value.find(ipoe => ipoe.id === id)?.customerNote
        return { text: customerNote ? `${id} / ${customerNote}` : id, value: id }
      }
      if (terminal.primaryCircuit.circuitType === 'guarantee') {
        const customerNote = guaranteeList.value.find(guarantee => guarantee.id === id)?.customerNote
        return { text: customerNote ? `${id} / ${customerNote}` : id, value: id }
      }
      return { text: `${id} / ${t('service.mobile')}`, value: id }
    })
    .filter(({ value }) => !!value)
  const secondaryList = resourceSummaryTerminalList.value.terminals
    .map(terminal => {
      const id = terminal.secondaryCircuit?.circuitId ?? ''
      if (terminal.secondaryCircuit?.circuitType === 'ipoe') {
        const customerNote = ipoeList.value.find(ipoe => ipoe.id === id)?.customerNote
        return { text: customerNote ? `${id} / ${customerNote}` : id, value: id }
      }
      return { text: `${id} / ${t('service.mobile')}`, value: id }
    })
    .filter(({ value }) => !!value)
  return [...primaryList, ...secondaryList]
})

const handleSearch = () => {
  router.push({
    query: {
      ...threatDetectionsFilter.value,
      limit: pagination.value.limit,
      page: 1,
      periodType: periodType.value,
    },
  })
}

const handleThreatDetectionTableChange = (data: { page: number; limit?: number; sortOption?: Partial<SortOption> }) => {
  router.push({
    query: {
      ...threatDetectionsFilter.value,
      ...data.sortOption,
      limit: data.limit,
      page: data.page,
      periodType: periodType.value,
    },
  })
}

const routeQuery = computed(() =>
  [
    'terminalId',
    'circuitId',
    'threatLevel',
    'threatType',
    'detectionType',
    'blockingStatus',
    'sortKey',
    'direction',
    'trafficDirection',
  ].reduce((q, key) => {
    const value = route.query[key]
    const firstValue = Array.isArray(value) ? value[0] : value
    if (['terminalId', 'circuitId', 'threatLevel', 'threatType', 'detectionType', 'blockingStatus'].includes(key)) {
      // 配列になりうる要素
      return value ? Object.assign(q, { [key]: typeof value === 'string' ? [value] : value }) : q
    } else if (key === 'sortKey') {
      // デフォルトは"timestamp"を指定
      return Object.assign(q, { [key]: firstValue || 'timestamp' })
    } else if (key === 'direction') {
      // デフォルトは"desc"を指定
      return Object.assign(q, { [key]: firstValue || 'desc' })
    } else if (firstValue !== undefined) {
      return Object.assign(q, { [key]: firstValue })
    }
    return q
  }, {}),
)

const changeRouteQuery = () => {
  // セキュリティ利用規約に同意していない場合は、検索を行わない
  if (!securityTermsOfServiceAccepted.value) {
    return
  }

  // リロード等の場合のために初期値の設定を行う
  periodType.value = Object.values(PeriodTypes).find(v => v === route.query.periodType) ?? PeriodTypes.Last1Day
  // periodType が Free 以外の場合はここで終了
  if (periodType.value !== PeriodTypes.Free) {
    threatDetectionsFilter.value = {
      ...routeQuery.value,
      startTime: dayjs().subtract(PeriodMinutesGapMap[periodType.value], 'minutes').format(),
      endTime: dayjs().format(),
    }
    getThreatDetectionsTableList({
      ...threatDetectionsFilter.value,
      limit: pagination.value.limit,
      offset: pagination.value.page - 1,
    })
    return
  }

  // periodType.value === PeriodTypes.Free の場合は、startTime と endTime をクエリパラメータから取得
  const startTimeValue = route.query.startTime
  const endTimeValue = route.query.endTime
  const startTimeDayjs =
    startTimeValue && !Array.isArray(startTimeValue) && dayjs(startTimeValue).isValid()
      ? dayjs(startTimeValue)
      : dayjs().subtract(PeriodMinutesGapMap[PeriodTypes.Last1Day], 'minutes')
  const endTimeDayjs =
    endTimeValue && !Array.isArray(endTimeValue) && dayjs(endTimeValue).isValid() ? dayjs(endTimeValue) : dayjs()

  threatDetectionsFilter.value = {
    ...routeQuery.value,
    startTime: startTimeDayjs.format(),
    endTime: endTimeDayjs.format(),
  }
  getThreatDetectionsTableList({
    ...threatDetectionsFilter.value,
    limit: pagination.value.limit,
    offset: pagination.value.page - 1,
  })
}

watch(
  () => route.query,
  () => {
    changeRouteQuery()
  },
)

onBeforeMount(async () => {
  getAllSummaryIpoeList()
  getAllResourceSummaryGuaranteeList()
  await getAllResourceSummaryTerminalList({ resourceStatus: [ResourceStatusTypes.Active] })
  await getSecurityTermsOfServiceAccepted()
  changeRouteQuery()
})
</script>

<template>
  <CardContainer>
    <div class="flex-flex-start-center">
      <div class="text-lg">{{ t('sideBar.threatDetections') }}</div>
      <CustomButton
        v-if="!securityTermsOfServiceAccepted"
        class="ml-auto"
        icon="up-right-square"
        :text="t('terms.confirmation')"
        :width="180"
        data-cy="security-contracts-threat-detections-terms-of-service-button"
        @click="() => moveToSecurityTermOfService(tenantId)"
      />
    </div>
    <div v-if="!securityTermsOfServiceAccepted" class="text-warning">
      {{ t('threatDetections.message.requiredSecurityAccepted') }}
    </div>

    <ThreatDetectionFilter
      v-model:filter="threatDetectionsFilter"
      v-model:period-type="periodType"
      :terminal-id-options="terminalIdOptions"
      :circuit-id-options="circuitIdOptions"
      :search-disabled="searchDisabled"
      @search="handleSearch"
    />
    <ThreatDetectionTable
      :page="pagination.page"
      :limit="pagination.limit"
      :sort-option="{ sortKey: threatDetectionsFilter.sortKey, direction: threatDetectionsFilter.direction }"
      :threat-detection-list="threatDetectionsTableList"
      :terminal-list="resourceSummaryTerminalList"
      @change="handleThreatDetectionTableChange"
    />
  </CardContainer>
</template>
