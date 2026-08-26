<script lang="ts" setup>
import { isEqual, omit } from 'es-toolkit'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { PeriodMinutesGapMap, PeriodTypes } from '@/components/search/constants'
import type { PeriodType } from '@/components/search/types'
import { IDAAS_LINK } from '@/api/threatInfo/constants'
import type { ThreatReportsQuery } from '@/api/threatInfo/types'

const { t } = useI18n()
const { loading } = useLoading()
const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenantId as string)

const { threatReportsSummary, totalCount, getThreatReportsSummary } = useGetThreatReportsSummary()
const { authenticationStatusList, getAuthenticationStatusList } = useGetAuthenticationStatusList()
const { threatTrendList, getThreatTrendList } = useGetThreatTrendList()
const { threatReportTableList, threatReportTableQuery, getThreatReportTableList } = useGetThreatReportTableList()
const { gmoApiKey, getGmoApiKey } = useGmoApiKey()

const {
  MINUTES_SPAN,
  threatReportsSummarySample,
  totalCountSample,
  authenticationStatusListSample,
  threatTrendListSample,
  threatReportTableListSample,
} = useThreatReportsSample()

const periodType = ref<PeriodType>(PeriodTypes.Last2Weeks)
const from = computed({
  get: () => threatReportTableQuery.value.from ?? '',
  set: startDateTime => {
    threatReportTableQuery.value.from = startDateTime || undefined
  },
})
const to = computed({
  get: () => threatReportTableQuery.value.to ?? '',
  set: endDateTime => {
    threatReportTableQuery.value.to = endDateTime || undefined
  },
})
const showLoading = computed(() => {
  return (
    loading.value &&
    (!gmoApiKey.value ||
      !threatReportsSummary.value ||
      threatReportTableList.value.reports.length === 0 ||
      !authenticationStatusList.value)
  )
})

const moveToApiKey = async () => {
  await navigateTo(`/tenants/${tenantId.value}/idaas/api-key`)
}

const routerPushQuery = (query: ThreatReportsQuery) => {
  if (isEqual(routeQuery.value, omit(query, ['from', 'to'])) && route.query.periodType === periodType.value) {
    // パスクエリの変更がない場合は直接 getThreatReportTableList を実行する
    getThreatReportTableList(query)
  } else {
    router.push({ query: { ...query, offset: undefined, page: (query.offset ?? 0) + 1, periodType: periodType.value } })
  }
}
const routeQuery = computed(() =>
  ['limit', 'page', 'email', 'ip', 'risk'].reduce((q, key) => {
    const value = route.query[key]
    if (['limit', 'page'].includes(key) && !isNaN(Number(value))) {
      if (key === 'page') {
        return Object.assign(q, { offset: Number(value) < 2 ? 0 : Number(value) - 1 })
      }
      return Object.assign(q, { [key]: Number(value) })
    } else if (key === 'risk' && typeof value === 'string') {
      return Object.assign(q, { [key]: [value] })
    } else if (value !== undefined) {
      return Object.assign(q, { [key]: value })
    }
    return q
  }, {}),
)
const changeRouteQuery = async () => {
  // リロード等の場合のために初期値の設定を行う
  periodType.value = Object.values(PeriodTypes).find(v => v === route.query.periodType) ?? PeriodTypes.Last2Weeks
  // periodType が Free 以外の場合はここで終了
  if (periodType.value !== PeriodTypes.Free) {
    getThreatReportTableList({
      ...routeQuery.value,
      from: dayjs().subtract(PeriodMinutesGapMap[periodType.value], 'minutes').floor(MINUTES_SPAN, 'minutes').format(),
      to: dayjs().floor(MINUTES_SPAN, 'minutes').format(),
    })
    return
  }

  // periodType.value === PeriodTypes.Free の場合は、from と to をクエリパラメータから取得
  const fromValue = route.query.from
  const toValue = route.query.to
  const fromDayjs =
    fromValue && !Array.isArray(fromValue) && dayjs(fromValue).isValid()
      ? dayjs(fromValue)
      : dayjs().subtract(PeriodMinutesGapMap[PeriodTypes.Last2Weeks], 'minutes').floor(MINUTES_SPAN, 'minutes')
  const toDayjs =
    toValue && !Array.isArray(toValue) && dayjs(toValue).isValid()
      ? dayjs(toValue)
      : dayjs().floor(MINUTES_SPAN, 'minutes')

  getThreatReportTableList({
    ...routeQuery.value,
    from: fromDayjs.format(),
    to: toDayjs.format(),
  })
}
watch(
  () => route.query,
  () => {
    changeRouteQuery()
  },
)

onMounted(async () => {
  await getGmoApiKey()
  if (!gmoApiKey.value) {
    // サンプル表示の時changeRouteQueryが実行されないため直近14日の日付を明示的に設定する
    from.value = dayjs()
      .subtract(PeriodMinutesGapMap[PeriodTypes.Last2Weeks], 'minutes')
      .floor(MINUTES_SPAN, 'minutes')
      .format()
    to.value = dayjs().floor(MINUTES_SPAN, 'minutes').format()
    return
  }
  getThreatReportsSummary()
  getAuthenticationStatusList()
  getThreatTrendList()
  changeRouteQuery()
})
</script>

<template>
  <div>
    <LoadingAnimation v-if="showLoading">
      <div class="text-center">{{ t('trafficDetails.loadingMessage') }}</div>
    </LoadingAnimation>
    <div v-else>
      <CardContainer v-if="!gmoApiKey" class="mb-5">
        <div class="flex-start-center ga-4">
          <div>{{ t('idaas.message.moveToRegister') }}</div>
          <CustomButton :text="t('idaas.apiKey')" icon="right-arrow" :width="180" @click="moveToApiKey" />
        </div>
        <i18n-t keypath="idaas.message.newIdaas" tag="div" scope="global" class="my-5">
          <template #here>
            <NuxtLink :to="IDAAS_LINK.NEW_IDAAS" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
        </i18n-t>
        <i18n-t keypath="idaas.message.registerApiKeyManual" tag="div" scope="global" class="my-5">
          <template #here>
            <NuxtLink :to="IDAAS_LINK.REGISTER_API_KEY_MANUAL" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
        </i18n-t>
      </CardContainer>
      <div v-if="gmoApiKey && threatReportsSummary && authenticationStatusList && threatTrendList">
        <AuthenticationRiskReportsSummary
          :threat-reports-summary="threatReportsSummary"
          :total-count="totalCount"
          :authentication-status-list="authenticationStatusList"
          :threat-trend-list="threatTrendList"
        />
      </div>
      <div v-else class="position-relative">
        <AuthenticationRiskReportsSummary
          :threat-reports-summary="threatReportsSummarySample"
          :total-count="totalCountSample"
          :authentication-status-list="authenticationStatusListSample"
          :threat-trend-list="threatTrendListSample"
        />
        <div class="sample-cover flex-center-center position-absolute w-100 h-100 text-5xl">
          <div class="sample">sample</div>
        </div>
      </div>

      <!-- 認証リスクレポート（詳細） -->
      <AuthenticationRiskReportsDetail
        v-if="gmoApiKey && threatReportTableList"
        v-model:threat-reports-query="threatReportTableQuery"
        v-model:period-type="periodType"
        v-model:from="from"
        v-model:to="to"
        :threat-report-table-list="threatReportTableList"
        @search="routerPushQuery"
      />
      <div v-else class="position-relative">
        <AuthenticationRiskReportsDetail
          v-model:threat-reports-query="threatReportTableQuery"
          v-model:period-type="periodType"
          v-model:from="from"
          v-model:to="to"
          :threat-report-table-list="threatReportTableListSample"
          @search="routerPushQuery"
        />
        <div class="sample-cover flex-center-center position-absolute w-100 h-100 text-5xl">
          <div class="sample">sample</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sample-cover {
  z-index: 100;
  top: 0;
  left: 0;
  background-color: v.$light-info-alpha-color;
  font-size: 14rem;
  border-radius: v.$container-border-radius;
}
.sample {
  transform: rotate(-15deg);
  opacity: 0.45;
}
</style>
