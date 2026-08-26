<script lang="ts" setup>
import { TermsOfServiceBasePath } from '@/api/termsOfService/constants'

const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenantId as string)

const { getMobile, mobile } = useGetMobile()
const {
  termsOfService: mobileTermsOfService,
  getTermsOfService: getMobileTermsOfService,
  agreeTermsOfService: agreeMobileTermsOfService,
  downloadTermsOfServiceList: downloadMobileTermsOfServiceList,
  getDownloadTermsOfServiceList: getDownloadMobileTermsOfServiceList,
} = useTermsOfService(TermsOfServiceBasePath.Mobile)

const submitAgreement = async () => {
  if (typeof mobileTermsOfService.value?.agreementCode === 'string') {
    await agreeMobileTermsOfService({ agreementCode: mobileTermsOfService.value.agreementCode })
    await navigateTo({ path: `/tenants/${tenantId.value}/contracts/mobile` })
  }
}

onBeforeMount(async () => {
  getMobile()
  await getMobileTermsOfService()
  if (mobileTermsOfService.value?.termsOfService) {
    getDownloadMobileTermsOfServiceList(mobileTermsOfService.value.termsOfService)
  }
})
</script>

<template>
  <CardContainer>
    <TermsAndConditions
      :terms-of-service="downloadMobileTermsOfServiceList"
      :accepted="!!mobile?.mobileTermsOfServiceAccepted"
      :disabled="typeof mobileTermsOfService?.agreementCode !== 'string'"
      show-back-button
      @back="router.back()"
      @submit="submitAgreement"
    />
  </CardContainer>
</template>
