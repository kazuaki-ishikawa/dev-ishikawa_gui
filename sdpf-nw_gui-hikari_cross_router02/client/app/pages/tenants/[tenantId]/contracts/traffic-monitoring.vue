<script setup lang="ts">
import { TermsOfServiceBasePath } from '@/api/termsOfService/constants'

const {
  termsOfServiceAccepted: trafficMonitoringAccepted,
  getTermsOfServiceAccepted: getTrafficMonitoringAccepted,
  termsOfService: trafficMonitoringTermsOfService,
  getTermsOfService: getTrafficMonitoringTermsOfService,
  agreeTermsOfService: agreeTrafficMonitoringTermsOfService,
  downloadTermsOfServiceList: downloadTrafficTermsOfServiceList,
  getDownloadTermsOfServiceList: getDownloadTrafficTermsOfServiceList,
} = useTermsOfService(TermsOfServiceBasePath.TrafficMonitoring)

const submitAgreement = async () => {
  if (typeof trafficMonitoringTermsOfService.value?.agreementCode === 'string') {
    await agreeTrafficMonitoringTermsOfService({
      agreementCode: trafficMonitoringTermsOfService.value.agreementCode,
    })
  }
  getTrafficMonitoringAccepted()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onBeforeMount(async () => {
  getTrafficMonitoringAccepted()
  await getTrafficMonitoringTermsOfService()
  if (trafficMonitoringTermsOfService.value?.termsOfService) {
    getDownloadTrafficTermsOfServiceList(trafficMonitoringTermsOfService.value.termsOfService)
  }
})
</script>

<template>
  <TermsAndConditions
    terms-type="traffic-monitoring"
    :terms-of-service="downloadTrafficTermsOfServiceList"
    :accepted="trafficMonitoringAccepted"
    :disabled="typeof trafficMonitoringTermsOfService?.agreementCode !== 'string'"
    @submit="submitAgreement"
  />
</template>
