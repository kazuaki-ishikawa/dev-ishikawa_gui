<script setup lang="ts">
import { isEqual, omit } from 'es-toolkit'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { BlockingStatusTypes } from '@/api/threatDetections/constants'
import type { ThreatDetectionsQuery } from '@/api/threatDetections/types'
import type { ThreatDetectionFiltersPutRequest } from '@/api/threatDetectionFilters/types'
import { TermsOfServiceBasePath } from '@/api/termsOfService/constants'
import { ProtocolTypes, IpTypes, PortTypes } from '@/api/constants'
import { PeriodTypes, PeriodMinutesGapMap } from '@/components/search/constants'
import type { PeriodType } from '@/components/search/types'
import type { SortOption } from '@/components/table/types'

const QueryKeys = ['terminalId', 'sortKey', 'direction', 'startTime', 'endTime'] as const

const { t } = useI18n()
const { ipAddress } = useRules()
const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenantId as string)

const { loading } = useLoading()
const { navigationGuard } = useNavigationGuard()

const threatDetectionsFilter = ref<Omit<ThreatDetectionsQuery, 'limit' | 'offset'>>({})
const pagination = computed(() => ({
  limit: Number(route.query.limit) || 10,
  page: Number(route.query.page) || 1,
}))
const { getThreatDetectionsTableList, threatDetectionsTableList } = useGetThreatDetectionsTableList()
const { updateThreatDetectionFilters } = useUpdateThreatDetectionFilters()
const { terminalIdOptions, resourceSummaryTerminalList, getAllResourceSummaryTerminalList } =
  useGetAllResourceSummaryTerminalList()
const {
  securityTermsOfServiceAccepted,
  getTermsOfServiceAccepted: getSecurityTermsOfServiceAccepted,
  moveToSecurityTermOfService,
} = useTermsOfService(TermsOfServiceBasePath.Security)

const validSearchPeriodDateTime = ref(true)
const isConfirmation = ref(false)
const selectedIndexList = ref<number[]>([])
watch(selectedIndexList, () => {
  navigationGuard(0 < selectedIndexList.value.length)
})
const selectablePeriodTypes = Object.values(PeriodTypes).filter(value => value !== PeriodTypes.Last2Weeks)
const periodType = ref<PeriodType>(PeriodTypes.Last1Day)
const selectableBeforeDays = computed(() => {
  // 最大12か月前まで選択可能なはず
  const before12Date = dayjs().subtract(12, 'months').format('YYYY-MM-DD')
  return Math.abs(dayjs().diff(before12Date, 'days'))
})
const startDateTime = computed({
  get: () => threatDetectionsFilter.value.startTime ?? '',
  set: startDateTime => {
    threatDetectionsFilter.value.startTime = startDateTime || undefined
  },
})
const endDateTime = computed({
  get: () => threatDetectionsFilter.value.endTime ?? '',
  set: endDateTime => {
    threatDetectionsFilter.value.endTime = endDateTime || undefined
  },
})

const searchDisabled = computed(
  () => !securityTermsOfServiceAccepted.value || isConfirmation.value || !validSearchPeriodDateTime.value,
)

const terminalId = computed({
  get: () => (threatDetectionsFilter.value.terminalId?.[0] ? threatDetectionsFilter.value.terminalId[0] : ''),
  set: terminalId => {
    threatDetectionsFilter.value.terminalId = !terminalId ? [] : [terminalId]
  },
})

const submit = computed(() => {
  const click = isConfirmation.value ? handleSubmit : switchConfirm
  const text = isConfirmation.value ? t('threatDetections.blocking') : t('threatDetections.confirmBlocking')
  return { click, text }
})

const switchConfirm = () => {
  isConfirmation.value = !isConfirmation.value
}
const handleSubmit = async () => {
  const tableList = threatDetectionsTableList?.value?.threatDetections ?? []
  const request = tableList
    .filter((_, index) => selectedIndexList.value.includes(index))
    .reduce(
      (acc, cur) => {
        const found = acc.find(item => item.terminalId === cur.terminalId)
        // 現時点では sourceIp, destinationPort, sourcePort, protocol は any のみ受け付ける
        const data = {
          threatDestination:
            ipAddress(cur.threatDestination) === true ? `${cur.threatDestination}/32` : cur.threatDestination,
          sourceIp: IpTypes.Any,
          destinationPort: PortTypes.Any,
          sourcePort: PortTypes.Any,
          protocol: ProtocolTypes.Any,
        }
        if (found) {
          // 同じfilterが存在する場合はスキップ
          if (found.filters.some(filter => isEqual(filter, data))) {
            return acc
          }
          found.filters.push(data)
        } else {
          acc.push({ terminalId: cur.terminalId, filters: [data] })
        }
        return acc
      },
      [] as Array<{ terminalId: string; filters: ThreatDetectionFiltersPutRequest[] }>,
    )
  if (request.length === 0) {
    return
  }

  await updateThreatDetectionFilters(request)
  navigationGuard(false)
  router.back()
}

const handleThreatDetectionTableChange = (data: { page: number; limit?: number; sortOption?: Partial<SortOption> }) => {
  // query が更新されるタイミングで選択済みのチェックボックスを初期化する
  selectedIndexList.value = []
  const query = QueryKeys.reduce((q, key) => ({ ...q, [key]: threatDetectionsFilter.value[key] }), {})
  router.replace({
    query: {
      ...query,
      ...data.sortOption,
      limit: data.limit,
      page: data.page,
      periodType: periodType.value,
    },
  })
}
const handleSearch = () => {
  // query が更新されるタイミングで選択済みのチェックボックスを初期化する
  selectedIndexList.value = []
  const query = QueryKeys.reduce((q, key) => ({ ...q, [key]: threatDetectionsFilter.value[key] }), {})
  if (isEqual(omit(routeQuery.value, ['blockingStatus']), query) && route.query.periodType === periodType.value) {
    // パスクエリの変更がない場合は直接 getThreatDetectionsTableList を実行する
    getThreatDetectionsTableList(routeQuery.value)
  } else {
    router.replace({
      query: {
        ...query,
        limit: pagination.value.limit,
        page: 1,
        periodType: periodType.value,
      },
    })
  }
}
const handleClear = () => {
  threatDetectionsFilter.value = {
    sortKey: threatDetectionsFilter.value.sortKey,
    direction: threatDetectionsFilter.value.direction,
  }
  periodType.value = PeriodTypes.Last1Day
}

const routeQuery = computed(() =>
  QueryKeys.reduce(
    (q, key) => {
      const value = route.query[key]
      if (key === 'terminalId') {
        const terminalIds =
          typeof value === 'string' ? [value] : typeof value?.[0] === 'string' ? [value[0]] : undefined
        return Object.assign(q, { [key]: terminalIds })
      } else if (['sortKey', 'direction'].includes(key)) {
        // sortKey のデフォルトは "timestamp"、direction のデフォルトは "desc" を指定
        const initialValue = key === 'sortKey' ? 'timestamp' : 'desc'
        return Object.assign(q, { [key]: value || initialValue })
      } else {
        return Object.assign(q, { [key]: value })
      }
    },
    // 常に blockingStatus: [BlockingStatusTypes.NoBlocked] で絞り込む
    { blockingStatus: [BlockingStatusTypes.NoBlocked] },
  ),
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
  await getAllResourceSummaryTerminalList()
  await getSecurityTermsOfServiceAccepted()
  changeRouteQuery()
})
</script>

<template>
  <CardContainer>
    <div class="flex-flex-start-center">
      <!-- TODO アイコン変更 -->
      <!-- <SvgIcon :type="IconTypes.AlertChart" color="secondary" /> -->
      <div class="text-lg">{{ `${t('sideBar.threatDetectionFilters')}` }}</div>
      <CustomButton
        v-if="!securityTermsOfServiceAccepted"
        class="ml-auto"
        icon="up-right-square"
        :text="t('terms.confirmation')"
        :width="180"
        data-cy="security-contracts-threat-detections-block-terms-of-service-button"
        @click="() => moveToSecurityTermOfService(tenantId)"
      />
    </div>
    <div v-if="!securityTermsOfServiceAccepted" class="text-warning">
      {{ t('threatDetections.message.requiredSecurityAccepted') }}
    </div>

    <SearchFilter class="mt-3" :disabled="searchDisabled" @search="handleSearch" @clear="handleClear">
      <SearchPeriodDateTime
        v-model:period-type="periodType"
        v-model:start-date-time="startDateTime"
        v-model:end-date-time="endDateTime"
        :selectable-before-days="selectableBeforeDays"
        :disabled="isConfirmation"
        :period-types="selectablePeriodTypes"
        @valid="(valid: boolean) => (validSearchPeriodDateTime = valid)"
      />
      <InputGrid :label="t('threatDetections.terminalId')">
        <SelectForm
          v-model="terminalId"
          :options="terminalIdOptions"
          :disabled="isConfirmation"
          placeholder="Z000000001 / ルーター名1"
          size="middle"
        />
      </InputGrid>
    </SearchFilter>

    <div class="py-3">{{ isConfirmation ? t('threatDetections.confirm.block') : t('threatDetections.message.block') }}</div>
    <ThreatDetectionTable
      v-model:selected-list="selectedIndexList"
      :page="pagination.page"
      :limit="pagination.limit"
      :sort-option="{ sortKey: threatDetectionsFilter.sortKey, direction: threatDetectionsFilter.direction }"
      :threat-detection-list="threatDetectionsTableList"
      :terminal-list="resourceSummaryTerminalList"
      :is-confirmation="isConfirmation"
      @change="handleThreatDetectionTableChange"
    />

    <div class="flex-flex-end-center pt-5">
      <CancelButton v-model:is-confirmation="isConfirmation" @cancel="router.back()" />
      <CustomButton
        class="ml-6"
        icon="right-arrow"
        :disabled="selectedIndexList.length === 0 || loading"
        :text="submit.text"
        :width="180"
        color="error"
        data-cy="threat-detections-block-submit-button"
        @click="submit.click"
      />
    </div>
  </CardContainer>
</template>
