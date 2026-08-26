<script lang="ts" setup>
import { TermsOfServiceBasePath } from '@/api/termsOfService/constants'

const {
  securityTermsOfServiceAccepted,
  getTermsOfServiceAccepted: getSecurityTermsOfServiceAccepted,
  termsOfService: securityTermsOfService,
  getTermsOfService: getSecurityTermsOfService,
  downloadTermsOfServiceList: downloadSecurityTermsOfServiceList,
  getDownloadTermsOfServiceList: getDownloadSecurityTermsOfServiceList,
  agreeTermsOfService: agreeSecurityTermsOfService,
} = useTermsOfService(TermsOfServiceBasePath.Security)

const submitSecurityAgreement = async () => {
  if (typeof securityTermsOfService.value?.agreementCode === 'string') {
    await agreeSecurityTermsOfService({
      agreementCode: securityTermsOfService.value.agreementCode,
    })
    getSecurityTermsOfServiceAccepted()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const {
  trafficReportFlowAnalyzerTermsOfServiceAccepted,
  getTermsOfServiceAccepted: getTrafficReportFlowAnalyzerTermsOfServiceAccepted,
  termsOfService: trafficReportFlowAnalyzerTermsOfService,
  getTermsOfService: getTrafficReportFlowAnalyzerTermsOfService,
  downloadTermsOfServiceList: downloadTrafficReportFlowAnalyzerTermsOfServiceList,
  getDownloadTermsOfServiceList: getDownloadTrafficReportFlowAnalyzerTermsOfServiceList,
  agreeTermsOfService: agreeTrafficReportFlowAnalyzerTermsOfService,
} = useTermsOfService(TermsOfServiceBasePath.TrafficReportFlowAnalyzer)

const submitTrafficReportFlowAnalyzerAgreement = async () => {
  if (typeof trafficReportFlowAnalyzerTermsOfService.value?.agreementCode === 'string') {
    await agreeTrafficReportFlowAnalyzerTermsOfService({
      agreementCode: trafficReportFlowAnalyzerTermsOfService.value?.agreementCode,
    })
    getTrafficReportFlowAnalyzerTermsOfServiceAccepted()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

onBeforeMount(async () => {
  await getSecurityTermsOfServiceAccepted()
  await getSecurityTermsOfService()
  if (securityTermsOfService.value?.termsOfService) {
    getDownloadSecurityTermsOfServiceList(securityTermsOfService.value.termsOfService)
  }

  await getTrafficReportFlowAnalyzerTermsOfServiceAccepted()
  await getTrafficReportFlowAnalyzerTermsOfService()
  if (trafficReportFlowAnalyzerTermsOfService.value?.termsOfService) {
    getDownloadTrafficReportFlowAnalyzerTermsOfServiceList(trafficReportFlowAnalyzerTermsOfService.value.termsOfService)
  }
})
</script>

<template>
  <div>
    <TermsAndConditions
      terms-type="security"
      :terms-of-service="downloadSecurityTermsOfServiceList"
      :accepted="securityTermsOfServiceAccepted"
      :disabled="typeof securityTermsOfService?.agreementCode !== 'string'"
      data-cy="security-traffic-report-flow-analyzer-security"
      @submit="submitSecurityAgreement"
    />
    <TermsAndConditions
      terms-type="traffic-report-flow-analyzer"
      :terms-of-service="downloadTrafficReportFlowAnalyzerTermsOfServiceList"
      :accepted="trafficReportFlowAnalyzerTermsOfServiceAccepted"
      :disabled="typeof trafficReportFlowAnalyzerTermsOfService?.agreementCode !== 'string'"
      data-cy="security-traffic-report-flow-analyzer-traffic-report-flow-analyzer"
      @submit="submitTrafficReportFlowAnalyzerAgreement"
    />
  </div>
</template>
