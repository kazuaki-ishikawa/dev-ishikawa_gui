<script lang="ts" setup>
import { TermsOfServiceBasePath } from '@/api/termsOfService/constants'

const {
  termsOfServiceAccepted,
  getTermsOfServiceAccepted,
  termsOfService,
  getTermsOfService,
  agreeTermsOfService,
  downloadTermsOfServiceList,
  getDownloadTermsOfServiceList,
} = useTermsOfService(TermsOfServiceBasePath.Guarantee)

const agreement = ref(false)
const submitAgreement = async () => {
  if (typeof termsOfService.value?.agreementCode === 'string') {
    await agreeTermsOfService({ agreementCode: termsOfService.value.agreementCode })
  }
  agreement.value = true
}

onBeforeMount(async () => {
  await getTermsOfServiceAccepted()
  await getTermsOfService()
  if (termsOfService.value?.termsOfService) {
    await getDownloadTermsOfServiceList(termsOfService.value.termsOfService)
  }
  agreement.value = termsOfServiceAccepted.value
})
</script>

<template>
  <TermsAndConditions
    terms-type="guarantee"
    :terms-of-service="downloadTermsOfServiceList"
    :accepted="agreement"
    :disabled="typeof termsOfService?.agreementCode !== 'string'"
    @submit="submitAgreement"
  />
</template>
