<script setup lang="ts">
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { RiskTypes, IDAAS_LINK } from '@/api/threatInfo/constants'
import type { ThreatReportListResponse, ThreatReportsQuery } from '@/api/threatInfo/types'
import { PeriodMinutesGapMap, PeriodTypes } from '@/components/search/constants'
import { IconTypes } from '@/components/icons/constants'
import type { PeriodType } from '@/components/search/types'
import { ColorMap } from './constants'

const MAX_GAP_MINUTES = 14 * 24 * 60

type PropsType = {
  threatReportTableList: ThreatReportListResponse | null
}
const props = defineProps<PropsType>()
const periodType = defineModel<PeriodType>('periodType', { required: true })
const from = defineModel<string>('from', { required: true })
const to = defineModel<string>('to', { required: true })
const threatReportsQuery = defineModel<ThreatReportsQuery>('threatReportsQuery', { required: true })

type Emits = {
  (e: 'search', query: ThreatReportsQuery): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const { MINUTES_SPAN } = useThreatReportsSample()

const validSearchPeriodDateTime = ref(true)
const selectablePeriodTypes = Object.values(PeriodTypes).filter(value => value !== PeriodTypes.Last1Month)
const pagination = computed(() => ({
  limit: threatReportsQuery.value.limit || 10,
  page: (threatReportsQuery.value.offset ?? 0) + 1,
}))

const headers = [
  { text: t('idaas.datetime'), key: 'datetime', width: 220 },
  { text: t('idaas.email'), key: 'emailAddresses', width: 200 },
  { text: t('idaas.ipAddress'), key: 'ipAddresses', width: 150 },
  { text: t('idaas.riskLevel'), key: 'risk', width: 150 },
  { text: t('idaas.detail'), key: 'detail' },
  { text: t('idaas.recommendedAction'), key: 'recommendedAction', help: t('idaas.recommendedActionHelpTooltip') },
]

const items = computed(
  () =>
    props.threatReportTableList?.reports.map((report, index) => {
      const datetime = `${formatDateTime(report.fromDatetime, false)} ~ ${dayjs(report.toDatetime).format('HH:mm')}`
      const [actionSummary, actionDetails] = report.recommendedAction.split(/\n(.*)$/s)
      return {
        id: index,
        datetime,
        emailAddresses: report.emailAddresses.join('\n'),
        ipAddresses: report.ipAddresses.join('\n'),
        risk: report.risk,
        detail: report.detail,
        actionSummary,
        actionDetails,
        recommendedActionHelpDetail: report.recommendedActionHelpDetail,
      }
    }) ?? [],
)

const riskOptions = Object.values(RiskTypes).map(value => ({
  text: value,
  value,
}))
const handleRiskChange = (value: string[]) => {
  threatReportsQuery.value = {
    ...threatReportsQuery.value,
    risk: Object.values(RiskTypes).filter(risk => value.includes(risk)),
  }
}

const handleSearch = () => {
  emits('search', { ...threatReportsQuery.value, offset: 0 })
}
const handleClear = () => {
  threatReportsQuery.value = {
    limit: threatReportsQuery.value.limit,
    offset: 0,
    from: dayjs()
      .subtract(PeriodMinutesGapMap[PeriodTypes.Last2Weeks], 'minutes')
      .floor(MINUTES_SPAN, 'minutes')
      .format(),
    to: dayjs().floor(MINUTES_SPAN, 'minutes').format(),
  }
  periodType.value = PeriodTypes.Last2Weeks
}
const handleChangeLimit = (limit?: number) => {
  emits('search', { ...threatReportsQuery.value, limit, offset: 0 })
}
const handleChangePage = (page: number) => {
  emits('search', { ...threatReportsQuery.value, offset: page - 1 })
}

const moveToLoginPage = async () => {
  await navigateTo(IDAAS_LINK.LOGIN_PAGE, {
    external: true,
    open: { target: '_blank', windowFeatures: { noopener: true, noreferrer: true } },
  })
}

const moveToSecurityHelpDeskPage = async () => {
  await navigateTo(IDAAS_LINK.SECURITY_HELP_DESK_PAGE, {
    external: true,
    open: { target: '_blank', windowFeatures: { noopener: true, noreferrer: true } },
  })
}
</script>

<template>
  <CardContainer>
    <div class="mb-3 flex-flex-start-center">
      <SvgIcon :type="IconTypes.AlertTriangle" color="secondary" />
      <div class="ml-2 text-lg">{{ t('idaas.authenticationRiskReportsDetail') }}</div>
    </div>
    <InnerCard>
      <SearchFilter class="mt-3" :disabled="!validSearchPeriodDateTime" @search="handleSearch" @clear="handleClear">
        <SearchPeriodDateTime
          v-model:period-type="periodType"
          v-model:start-date-time="from"
          v-model:end-date-time="to"
          :max-gap-minutes="MAX_GAP_MINUTES"
          :minutes-span="MINUTES_SPAN"
          :period-types="selectablePeriodTypes"
          @valid="(valid: boolean) => (validSearchPeriodDateTime = valid)"
        />
        <InputGrid :label="t('idaas.email')">
          <InputForm
            :model-value="threatReportsQuery?.email ?? ''"
            :placeholder="t('idaas.email')"
            @update:model-value="(value: string) => (threatReportsQuery.email = value || undefined)"
          />
        </InputGrid>
        <InputGrid :label="t('idaas.ipAddress')">
          <InputForm
            :model-value="threatReportsQuery?.ip ?? ''"
            :placeholder="t('idaas.ipAddress')"
            @update:model-value="(value: string) => (threatReportsQuery.ip = value || undefined)"
          />
        </InputGrid>
        <InputGrid :label="t('idaas.riskLevel')">
          <CheckboxForm
            :value="threatReportsQuery?.risk ?? []"
            :options="riskOptions"
            :placeholder="riskOptions[0]?.text"
            @update:value="handleRiskChange"
          />
        </InputGrid>
      </SearchFilter>
    </InnerCard>
    <PaginationHeader
      :page="pagination.page"
      :limit="pagination.limit"
      :total="threatReportTableList?.total"
      @update:limit="handleChangeLimit"
    />
    <StripedTable :headers="headers" :items="items" :key-items="['id']">
      <template #emailAddresses="{ row }">
        <span class="text-pre-wrap">{{ row.emailAddresses }}</span>
      </template>
      <template #ipAddresses="{ row }">
        <span class="text-pre-wrap">{{ row.ipAddresses }}</span>
      </template>
      <template #risk="{ row }">
        <span class="font-weight-bold" :style="{ color: ColorMap.get(row.risk) }">
          {{ row.risk }}
        </span>
      </template>
      <template #recommendedAction="{ row }">
        <div>
          <div>
            {{ row.actionSummary }}
            <HelpTooltip
              v-if="row.recommendedActionHelpDetail"
              class="action-summary"
              size="smallMiddle"
              :content-width="400"
            >
              <span class="text-pre-wrap">{{ row.recommendedActionHelpDetail }}</span>
            </HelpTooltip>
          </div>
          <div v-if="row.actionDetails" class="text-pre-wrap">{{ row.actionDetails }}</div>
        </div>
      </template>
    </StripedTable>
    <PaginationFooter
      :page="pagination.page"
      :limit="pagination.limit"
      :total="threatReportTableList?.total"
      @update:page="handleChangePage"
    />
    <div class="grid-cols-2 mt-5 ga-4">
      <div class="flex-end-start">
        <CustomButton :text="t('idaas.toLoginPage')" icon="up-right-square" @click="moveToLoginPage" />
      </div>

      <div class="d-flex flex-column align-start ga-1">
        <CustomButton
          :text="t('idaas.toSecurityHelpDeskPage')"
          icon="up-right-square"
          @click="moveToSecurityHelpDeskPage"
        />
        <i18n-t
          keypath="idaas.message.securityHelpDeskDescription"
          tag="div"
          scope="global"
          class="whitespace-pre-line text-sm"
        >
          <template #here>
            <NuxtLink :to="IDAAS_LINK.SECURITY_HELP_DESK_OPTION_PAGE" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
        </i18n-t>
      </div>
    </div>
  </CardContainer>
</template>

<style lang="scss" scoped>
.action-summary {
  display: inline-flex;
  vertical-align: middle;
}
.grid-cols-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.whitespace-pre-line {
  white-space: pre-line;
}
</style>
