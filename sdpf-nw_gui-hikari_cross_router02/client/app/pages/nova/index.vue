<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { CONTRACTOR_LINK } from '@/api/contractor/constants'
import type { ContractorPutRequest } from '@/api/contractor/types'
import { TermsOfServiceBasePath } from '@/api/termsOfService/constants'
import { RouteName } from '@/route/constants'

defineOptions({
  name: 'NovaIndexPage',
})

definePageMeta({
  name: RouteName.Index, // nameの使い方
  layout: {
    name: 'nova-default',
    props: {
      useSidebar: false,
    },
  },
})

const useStub = import.meta.env.USE_STUB

const { t } = useI18n()
const route = useRoute()
const tenantId = computed(() => route.query.tenant_id as string)

const STEPS = {
  INITIALIZE: '',
  CONTRACTOR: 'contractor',
  MOBILE: 'mobile',
  MOBILE_TERMS: 'mobile-terms',
  TRAFFIC_MONITORING: 'traffic-monitoring',
  TRAFFIC_REPORT_FLOW_ANALYZER: 'traffic-report-flow-analyzer',
  SECURITY: 'security',
} as const
const steps = ref<(typeof STEPS)[keyof typeof STEPS]>(STEPS.INITIALIZE)
watch(steps, () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

const disagreementButtonOption = {
  text: t('terms.disagreement'),
  color: 'primary' as const,
  icon: 'right-arrow' as const,
}

const { tenantList, getTenantList } = useTenant()
const { getCasvalSession } = useAPI()

// 1. セッション取得
const {
  status: getSessionStatus,
  error: getSessionError,
  execute: getSession,
} = useAsyncData('novaGetSession', () => getCasvalSession({ tenant_id: tenantId.value }), { immediate: false })
watch([getSessionStatus, getSessionError], async () => {
  if (getSessionStatus.value === 'success' && !getSessionError.value) {
    handleGetContractor()
  }
})

// 2. 契約者情報取得
const { contractor, getContractor } = useGetContractor()
const { updateContractor } = useUpdateContractor(true)
const handleGetContractor = async () => {
  await getContractor()
  if (!contractor.value?.name) {
    // 契約者情報がない場合は 契約者設定画面に移動
    steps.value = STEPS.CONTRACTOR
  } else {
    handleGetMobile()
  }
}
const handleContractorRegister = async (request: ContractorPutRequest) => {
  await updateContractor(request)
  handleGetMobile()
}

// 3. モバイル情報取得
const { mobile, getMobile } = useGetMobile()
const { inputMobile, updateMobile } = useUpdateMobile()
const {
  termsOfService: mobileTermsOfService,
  getTermsOfService: getMobileTermsOfService,
  agreeTermsOfService: agreeMobileTermsOfService,
  downloadTermsOfServiceList: downloadMobileTermsOfServiceList,
  getDownloadTermsOfServiceList: getDownloadMobileTermsOfServiceList,
} = useTermsOfService(TermsOfServiceBasePath.Mobile)
const handleGetMobile = async () => {
  await getMobile()
  if (!mobile.value?.mobileTermsOfServiceAccepted) {
    // モバイル約款に同意がない場合は モバイル情報入力画面に移動
    steps.value = STEPS.MOBILE
  } else {
    handleGetTrafficMonitoringAccepted()
  }
}
const handleMobileUpdate = async (changed: boolean) => {
  if (changed) {
    await updateMobile(inputMobile.value)
  }
  await getMobileTermsOfService()
  if (mobileTermsOfService.value?.termsOfService) {
    await getDownloadMobileTermsOfServiceList(mobileTermsOfService.value.termsOfService)
  }
  steps.value = STEPS.MOBILE_TERMS
}
const handleMobileAgreement = async () => {
  if (typeof mobileTermsOfService.value?.agreementCode === 'string') {
    await agreeMobileTermsOfService({ agreementCode: mobileTermsOfService.value.agreementCode })
  }
  handleGetTrafficMonitoringAccepted()
}

// 4. トラフィック収集情報取得
const {
  termsOfServiceAccepted: trafficMonitoringAccepted,
  getTermsOfServiceAccepted: getTrafficMonitoringAccepted,
  termsOfService: trafficMonitoringTermsOfService,
  getTermsOfService: getTrafficMonitoringTermsOfService,
  agreeTermsOfService: agreeTrafficMonitoringTermsOfService,
  downloadTermsOfServiceList: downloadTrafficTermsOfServiceList,
  getDownloadTermsOfServiceList: getDownloadTrafficTermsOfServiceList,
} = useTermsOfService(TermsOfServiceBasePath.TrafficMonitoring)
const handleGetTrafficMonitoringAccepted = async () => {
  await getTrafficMonitoringAccepted()
  if (!trafficMonitoringAccepted.value) {
    // トラフィック収集に同意がない場合は トラフィック収集画面に移動
    await getTrafficMonitoringTermsOfService()
    if (trafficMonitoringTermsOfService.value?.termsOfService) {
      await getDownloadTrafficTermsOfServiceList(trafficMonitoringTermsOfService.value.termsOfService)
    }
    steps.value = STEPS.TRAFFIC_MONITORING
  } else {
    // 2回目以降の表示になるため summary 画面に直接移動
    moveToSummary()
  }
}
const handleTrafficMonitoringAgreement = async () => {
  if (trafficMonitoringTermsOfService.value?.agreementCode) {
    await agreeTrafficMonitoringTermsOfService({ agreementCode: trafficMonitoringTermsOfService.value.agreementCode })
  }
  handleGetTrafficReportFlowAnalyzerTermsOfServiceAccepted()
}

// 5. フロー可視化機能利用に関する同意
const {
  trafficReportFlowAnalyzerTermsOfServiceAccepted,
  getTermsOfServiceAccepted: getTrafficReportFlowAnalyzerTermsOfServiceAccepted,
  termsOfService: trafficReportFlowAnalyzerTermsOfService,
  getTermsOfService: getTrafficReportFlowAnalyzerTermsOfService,
  downloadTermsOfServiceList: downloadTrafficReportFlowAnalyzerTermsOfServiceList,
  getDownloadTermsOfServiceList: getDownloadTrafficReportFlowAnalyzerTermsOfServiceList,
  agreeTermsOfService: agreeTrafficReportFlowAnalyzerTermsOfService,
} = useTermsOfService(TermsOfServiceBasePath.TrafficReportFlowAnalyzer)
const handleGetTrafficReportFlowAnalyzerTermsOfServiceAccepted = async () => {
  await getTrafficReportFlowAnalyzerTermsOfServiceAccepted()
  if (!trafficReportFlowAnalyzerTermsOfServiceAccepted.value) {
    // フロー可視化機能利用に関する同意がない場合は 同意画面に移動
    await getTrafficReportFlowAnalyzerTermsOfService()
    if (trafficReportFlowAnalyzerTermsOfService.value?.termsOfService) {
      await getDownloadTrafficReportFlowAnalyzerTermsOfServiceList(
        trafficReportFlowAnalyzerTermsOfService.value.termsOfService,
      )
    }
    steps.value = STEPS.TRAFFIC_REPORT_FLOW_ANALYZER
  } else {
    handleGetSecurityTermsOfServiceAccepted()
  }
}
const handleTrafficReportFlowAnalyzerAgreement = async () => {
  if (typeof trafficReportFlowAnalyzerTermsOfService.value?.agreementCode === 'string') {
    await agreeTrafficReportFlowAnalyzerTermsOfService({
      agreementCode: trafficReportFlowAnalyzerTermsOfService.value.agreementCode,
    })
  }
  handleGetSecurityTermsOfServiceAccepted()
}

// 6. セキュリティ機能利用に関する同意
const {
  securityTermsOfServiceAccepted,
  getTermsOfServiceAccepted: getSecurityTermsOfServiceAccepted,
  termsOfService: securityTermsOfService,
  getTermsOfService: getSecurityTermsOfService,
  downloadTermsOfServiceList: downloadSecurityTermsOfServiceList,
  getDownloadTermsOfServiceList: getDownloadSecurityTermsOfServiceList,
  agreeTermsOfService: agreeSecurityTermsOfService,
} = useTermsOfService(TermsOfServiceBasePath.Security)
const handleGetSecurityTermsOfServiceAccepted = async () => {
  await getSecurityTermsOfServiceAccepted()
  if (!securityTermsOfServiceAccepted.value) {
    // セキュリティ機能利用に関する同意がない場合は 同意画面に移動
    await getSecurityTermsOfService()
    if (securityTermsOfService.value?.termsOfService) {
      await getDownloadSecurityTermsOfServiceList(securityTermsOfService.value.termsOfService)
    }
    steps.value = STEPS.SECURITY
  } else {
    // 必要な項目全て同意されていればサマリー画面に移動
    moveToSummary()
  }
}
const handleSecurityAgreement = async () => {
  if (typeof securityTermsOfService.value?.agreementCode === 'string') {
    await agreeSecurityTermsOfService({ agreementCode: securityTermsOfService.value.agreementCode })
  }
  moveToSummary()
}

const moveToSummary = () => {
  return navigateTo({ name: RouteName.Home, params: { tenantId: tenantId.value } }, { replace: true })
}

const initializePage = async () => {
  if (!tenantId.value) {
    steps.value = STEPS.INITIALIZE
    return
  }
  await getSession()
}
watch(tenantId, initializePage)
onBeforeMount(() => {
  if (useStub) {
    getTenantList()
  }
  initializePage()
})
</script>

<template>
  <div class="pa-5">
    pages/index.vue の nova 用画面

    <CardContainer v-if="steps === STEPS.CONTRACTOR" :data-cy="STEPS.CONTRACTOR">
      <div class="flex-flex-start-center">
        <div class="text-lg mb-3">{{ t('sideBar.contractor') }}</div>
        <HelpTooltip class="px-2 pb-2" size="smallMiddle" :content-width="900">
          <NuxtLink :to="CONTRACTOR_LINK" target="_blank">{{ CONTRACTOR_LINK }}</NuxtLink>
        </HelpTooltip>
      </div>
      <ContractorSettings
        :tenant-id="tenantId"
        :confirm-text="t('confirm.create')"
        :submit-label="t('contractor.registerAndMoveToMobileInformation')"
        :submit-width="360"
        @submit="handleContractorRegister"
      />
    </CardContainer>
    <CardContainer v-if="steps === STEPS.MOBILE" :data-cy="STEPS.MOBILE">
      <div class="text-lg mb-3">{{ t('sideBar.mobile') }}</div>
      <div class="text-lg text-warning my-4 mx-2">{{ t('mobile.mobileCouponRegisterNotice') }}</div>
      <MobileInformationEdit
        v-model="inputMobile"
        :mobile="mobile"
        :tenant-id="tenantId"
        @submit="handleMobileUpdate"
      />
    </CardContainer>
    <CardContainer v-if="steps === STEPS.MOBILE_TERMS" :data-cy="STEPS.MOBILE_TERMS">
      <TermsAndConditions
        :terms-of-service="downloadMobileTermsOfServiceList"
        :accepted="!!mobile?.mobileTermsOfServiceAccepted"
        :disabled="typeof mobileTermsOfService?.agreementCode !== 'string'"
        @submit="handleMobileAgreement"
      />
    </CardContainer>
    <CardContainer v-if="steps === STEPS.TRAFFIC_MONITORING" :data-cy="STEPS.TRAFFIC_MONITORING">
      <TermsAndConditions
        terms-type="traffic-monitoring"
        :terms-of-service="downloadTrafficTermsOfServiceList"
        :accepted="trafficMonitoringAccepted"
        :disabled="typeof trafficMonitoringTermsOfService?.agreementCode !== 'string'"
        @submit="handleTrafficMonitoringAgreement"
      />
    </CardContainer>
    <CardContainer v-if="steps === STEPS.TRAFFIC_REPORT_FLOW_ANALYZER" :data-cy="STEPS.TRAFFIC_REPORT_FLOW_ANALYZER">
      <TermsAndConditions
        terms-type="traffic-report-flow-analyzer"
        :terms-of-service="downloadTrafficReportFlowAnalyzerTermsOfServiceList"
        :accepted="trafficReportFlowAnalyzerTermsOfServiceAccepted"
        :disabled="typeof trafficReportFlowAnalyzerTermsOfService?.agreementCode !== 'string'"
        :back-button-option="disagreementButtonOption"
        show-back-button
        @back="handleGetSecurityTermsOfServiceAccepted"
        @submit="handleTrafficReportFlowAnalyzerAgreement"
      />
    </CardContainer>
    <CardContainer v-if="steps === STEPS.SECURITY" :data-cy="STEPS.SECURITY">
      <TermsAndConditions
        terms-type="security"
        :terms-of-service="downloadSecurityTermsOfServiceList"
        :accepted="securityTermsOfServiceAccepted"
        :disabled="typeof securityTermsOfService?.agreementCode !== 'string'"
        :back-button-option="disagreementButtonOption"
        show-back-button
        @back="moveToSummary"
        @submit="handleSecurityAgreement"
      />
    </CardContainer>
    <template v-if="useStub">
      <div v-for="tenant in tenantList" :key="tenant.tenantId">
        <NuxtLink :to="{ query: { tenant_id: tenant.tenantId } }"> /?tenant_id={{ tenant.tenantId }} </NuxtLink>
      </div>
    </template>
  </div>
</template>
