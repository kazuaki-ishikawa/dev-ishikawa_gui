import dayjs from 'dayjs'
import type {
  AuthenticationStatusListResponse,
  RiskType,
  ThreatReportListResponse,
  ThreatReportsQuery,
  ThreatReportsSummaryResponse,
  ThreatTrendListResponse,
} from '@/api/threatInfo/types'
import { RiskTypes } from '@/api/threatInfo/constants'

export const useGetThreatReportsSummary = () => {
  const { IDAAS_API } = useAPI()

  const threatReportsSummary = ref<ThreatReportsSummaryResponse>()
  const totalCount = computed(() => {
    if (!threatReportsSummary.value) {
      return 0
    }
    const summary = threatReportsSummary.value.summary
    return summary.high + summary.medium + summary.low + summary.informational
  })

  const getThreatReportsSummary = async () => {
    try {
      const response = await IDAAS_API.GET<ThreatReportsSummaryResponse>('threat-reports/summary')
      threatReportsSummary.value = response
      return response
    } catch (error) {
      threatReportsSummary.value = undefined
      throw error
    }
  }

  return {
    getThreatReportsSummary,
    threatReportsSummary,
    totalCount,
  }
}

export const useGetThreatReportTableList = () => {
  const { IDAAS_API } = useAPI()

  const threatReportTableQuery = ref<ThreatReportsQuery>({ limit: 10, offset: 0 })
  const threatReportTableList = ref<ThreatReportListResponse>({
    limit: 0,
    total: 0,
    offset: 0,
    tenantId: '',
    reports: [],
  })

  const getThreatReportTableList = async (query: ThreatReportsQuery) => {
    try {
      threatReportTableQuery.value = query
      const response = await IDAAS_API.GET<ThreatReportListResponse, ThreatReportsQuery>('threat-reports', { query })
      threatReportTableList.value = response
      return response
    } catch (error) {
      threatReportTableList.value = { limit: 0, total: 0, offset: 0, tenantId: '', reports: [] }
      throw error
    }
  }

  return {
    getThreatReportTableList,
    threatReportTableList,
    threatReportTableQuery,
  }
}

export const useGetAuthenticationStatusList = () => {
  const { IDAAS_API } = useAPI()

  const authenticationStatusList = ref<AuthenticationStatusListResponse>()
  const getAuthenticationStatusList = async () => {
    try {
      const response = await IDAAS_API.GET<AuthenticationStatusListResponse>('auth-statuses')
      authenticationStatusList.value = response
      return response
    } catch (error) {
      authenticationStatusList.value = undefined
      throw error
    }
  }

  return { getAuthenticationStatusList, authenticationStatusList }
}

export const useGetThreatTrendList = () => {
  const { IDAAS_API } = useAPI()

  const threatTrendList = ref<ThreatTrendListResponse>()
  const getThreatTrendList = async () => {
    try {
      const response = await IDAAS_API.GET<ThreatTrendListResponse>('threat-trends')
      threatTrendList.value = response
      return response
    } catch (error) {
      threatTrendList.value = undefined
      throw error
    }
  }

  return { getThreatTrendList, threatTrendList }
}

export const useThreatReportsSample = () => {
  const MINUTES_SPAN = 15 as const
  const threatReportsSummarySample = computed<ThreatReportsSummaryResponse>(() => ({
    summary: {
      high: Math.round(Math.random() * 10),
      medium: Math.round(Math.random() * 10),
      low: Math.round(Math.random() * 10),
      informational: Math.round(Math.random() * 10),
    },
    tenantId: '',
  }))
  const totalCountSample = computed(() => {
    const summary = threatReportsSummarySample.value.summary
    return summary.high + summary.medium + summary.low + summary.informational
  })
  const authenticationStatusListSample = computed<AuthenticationStatusListResponse>(() => ({
    statuses: [
      {
        date: dayjs().format('YYYY-MM-DD'),
        success: Math.round(Math.random() * 100),
        failed: Math.round(Math.random() * 50),
      },
    ],
    tenantId: '',
  }))
  const threatTrendListSample = computed<ThreatTrendListResponse>(() => {
    const months = Array.from({ length: 12 }, (_, i) => dayjs().subtract(11 - i, 'month'))
    return {
      trends: months.map(month => ({
        month: month.format('YYYY-MM'),
        high: Math.round(Math.random() * 10),
        medium: Math.round(Math.random() * 10),
        low: Math.round(Math.random() * 10),
        informational: Math.round(Math.random() * 10),
      })),
      tenantId: '',
    }
  })
  const threatReportTableListSample = computed<ThreatReportListResponse>(() => ({
    limit: 10,
    total: 14,
    offset: 0,
    tenantId: '',
    reports: Array.from({ length: 10 }, (_, i) => {
      const fromDatetime = dayjs().subtract(i, 'day').hour(9).minute(0).second(0)
      const toDatetime = fromDatetime.add(1, 'hour')
      return {
        fromDatetime: fromDatetime.format('YYYY-MM-DDTHH:mm:ssZ'),
        toDatetime: toDatetime.format('YYYY-MM-DDTHH:mm:ssZ'),
        emailAddresses: [`user${i + 1}@example.com`],
        ipAddresses: [`192.0.2.${i + 1}`],
        risk: Object.values(RiskTypes)[i % 4] as RiskType,
        detail: `This is a sample detail message for report ${i + 1}.`,
        recommendedAction: `This is a sample recommended action for report ${i + 1}.\n\nPlease follow the instructions carefully.`,
        recommendedActionHelpDetail:
          i % 2 === 0 ? `This is a sample help detail for report ${i + 1}.\nNew line tests.` : null,
      }
    }),
  }))

  return {
    MINUTES_SPAN,
    threatReportsSummarySample,
    totalCountSample,
    authenticationStatusListSample,
    threatTrendListSample,
    threatReportTableListSample,
  }
}
