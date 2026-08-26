<script setup lang="ts">
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import type { ThreatDetectionsQuery } from '@/api/threatDetections/types'
import { ThreatDetectionSharedTerminalDirectionTypes } from '@/api/threatDetectionShared/constants'
import { TermsOfServiceBasePath } from '@/api/termsOfService/constants'
import { PeriodTypes, PeriodMinutesGapMap } from '@/components/search/constants'
import type { PeriodType } from '@/components/search/types'
import type { SortOption } from '@/components/table/types'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenantId as string)

const {
  securityTermsOfServiceAccepted,
  getTermsOfServiceAccepted: getSecurityTermsOfServiceAccepted,
  moveToSecurityTermOfService,
} = useTermsOfService(TermsOfServiceBasePath.Security)
const { allThreatDetectionSharedTenantList, getAllThreatDetectionSharedTenantList, tenantIdOptions } =
  useGetAllThreatDetectionSharedTenantList()
const { getThreatDetectionsTableList, threatDetectionsTableList } = useGetThreatDetectionsTableList()

const selectedTenantId = ref('')
const threatDetectionsFilter = ref<Omit<ThreatDetectionsQuery, 'limit' | 'offset'>>({})
const periodType = ref<PeriodType>(PeriodTypes.Last1Day)

const pagination = computed(() => ({
  limit: Number(route.query.limit) || 10,
  page: Number(route.query.page) || 1,
}))
const searchDisabled = computed(
  () =>
    !threatDetectionsFilter.value.startTime ||
    !threatDetectionsFilter.value.endTime ||
    !securityTermsOfServiceAccepted.value ||
    !selectedTenantId.value,
)

const receivedTerminalList = computed(
  () =>
    allThreatDetectionSharedTenantList.value?.terminals.filter(
      item => item.sharedTenantId === selectedTenantId.value,
    ) ?? [],
)
const terminalIdOptions = computed(() => {
  // 受領中のルーター一覧からterminalIdOptionsを作成
  return receivedTerminalList.value.map(terminal => ({
    text: `${terminal.customerNote} / ${terminal.terminalId}`,
    value: terminal.terminalId,
  }))
})

const routeQuery = computed<ThreatDetectionsQuery>(() =>
  [
    'sharedTenantId',
    'terminalId',
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
    if (['terminalId', 'threatLevel', 'threatType', 'detectionType', 'blockingStatus'].includes(key)) {
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

const handleSearch = () => {
  router.push({
    query: {
      ...threatDetectionsFilter.value,
      sharedTenantId: selectedTenantId.value,
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

const changeRouteQuery = () => {
  // セキュリティ利用規約に同意していない場合、テナントIDが選択されていない場合は、検索を行わない
  if (!securityTermsOfServiceAccepted.value || !routeQuery.value.sharedTenantId) {
    // フィルタの初期値だけ入れておく
    threatDetectionsFilter.value = {
      ...routeQuery.value,
      startTime: dayjs().subtract(PeriodMinutesGapMap[PeriodTypes.Last1Day], 'minutes').startOf('minutes').format(),
      endTime: dayjs().format(),
    }
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
  await getSecurityTermsOfServiceAccepted()
  if (!securityTermsOfServiceAccepted.value) {
    return
  }
  await getAllThreatDetectionSharedTenantList({
    terminalDirection: ThreatDetectionSharedTerminalDirectionTypes.Received,
  })
  selectedTenantId.value = routeQuery.value.sharedTenantId ?? ''
  changeRouteQuery()
})
</script>

<template>
  <CardContainer>
    <div class="flex-flex-start-center mb-4">
      <div class="text-lg">{{ t('sideBar.threatDetections') }}</div>
      <CustomButton
        v-if="!securityTermsOfServiceAccepted"
        class="ml-auto"
        icon="up-right-square"
        :text="t('terms.confirmation')"
        :width="180"
        data-cy="security-contracts-threat-detection-shared-threat-detections-terms-of-service-button"
        @click="() => moveToSecurityTermOfService(tenantId)"
      />
    </div>
    <div
      v-if="!securityTermsOfServiceAccepted"
      class="text-warning"
      data-cy="security-contracts-threat-detection-shared-threat-detections-terms-of-service-message"
    >
      {{ t('threatDetectionShared.message.requiredSecurityAccepted') }}
    </div>

    <!-- テナントID検索 -->
    <InnerCard :title="`${t('details.tenantId')}${t('search.button')}`">
      <template #description>{{ t('threatDetections.message.sharedTenantId') }}</template>
      <InputGrid required :label="t('threatDetections.sharedTenantId')">
        <SelectForm
          v-model="selectedTenantId"
          required
          :options="tenantIdOptions"
          size="large"
          placeholder="A社 / tenantA"
          data-cy="security-contracts-threat-detection-shared-threat-detections-tenant-id-select-form"
        />
      </InputGrid>
    </InnerCard>

    <!-- フィルタ -->
    <ThreatDetectionFilter
      v-model:filter="threatDetectionsFilter"
      v-model:period-type="periodType"
      :terminal-id-options="terminalIdOptions"
      :filter-disabled="!selectedTenantId"
      :search-disabled="searchDisabled"
      @search="handleSearch"
    />
    <!-- テーブル -->
    <ThreatDetectionTable
      :page="pagination.page"
      :limit="pagination.limit"
      :sort-option="{ sortKey: threatDetectionsFilter.sortKey, direction: threatDetectionsFilter.direction }"
      :threat-detection-list="threatDetectionsTableList"
      @change="handleThreatDetectionTableChange"
    />
  </CardContainer>
</template>
