<script lang="ts" setup>
import { omit } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import { TerminalTypes } from '@/api/constants'
import { ServiceClosedDaysServiceTypes } from '@/api/serviceClosedDays/constants'
import { TermsOfServiceBasePath } from '@/api/termsOfService/constants'
import type { TerminalMobileInputDataType, TerminalInputDataType } from '@/api/terminals/types'
import type { ResourceSummaryVpnResponse, VpnPostRequest } from '@/api/vpns/types'

type InputDataParams = { mobile: TerminalMobileInputDataType; terminals: TerminalInputDataType[] }

const SetupSteps = {
  Setup: 0,
  Vpn: 1,
  MobileCouponRegister: 2,
  MobileTermsAndConditions: 3,
  Terminal: 4,
} as const

const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)
const { loading } = useLoading()

const step = ref(0)
const selectedVpn = ref<ResourceSummaryVpnResponse | null>(null)
const createdTerminalBulkOrderId = ref('')

const { t } = useI18n()
const { createVpn } = useCreateVpn()
const {
  getSummaryVpnList,
  summaryVpnList,
  unterminatedVpnListOptions,
  customerNoteList: vpnCustomerNoteList,
} = useGetSummaryVpnList()
const { getAllIpoeList, getAttachableIpoeListOptions } = useGetAllIpoeList()
const { getAllGuaranteeList, getAttachableGuaranteeList } = useGetAllGuaranteeList()

const { getMobile, mobile } = useGetMobile()
const { updateMobile } = useUpdateMobile()
const {
  termsOfService: mobileTermsOfService,
  getTermsOfService: getMobileTermsOfService,
  agreeTermsOfService: agreeMobileTermsOfService,
  downloadTermsOfServiceList: downloadMobileTermsOfServiceList,
  getDownloadTermsOfServiceList: getDownloadMobileTermsOfServiceList,
} = useTermsOfService(TermsOfServiceBasePath.Mobile)
const { createTerminalBulk } = useCreateTerminalBulk()
const { resetJpkiRequestStatus } = useGetJpkiRequestStatus()

const {
  customerNoteList: terminalCustomerNoteList,
  resourceSummaryTerminalList,
  getAllResourceSummaryTerminalList,
} = useGetAllResourceSummaryTerminalList()
const { getBreakOutList, breakOutList } = useGetBreakOutList()
const { disabledDates, getServiceClosedDays, serviceClosedDaysFetchFailed } = useServiceClosedDays()

const { getMobilePostRequest, getTerminalBulkPostRequestWithoutMobile } = useTerminalInput()
const { navigationGuard } = useNavigationGuard()
const { setNotificationMessageState } = useNotificationDialog()

const vpnNextStep = () => {
  const found = summaryVpnList.value.find(vpn => vpn.vpnId === selectedVpnId.value)
  selectedVpn.value = found || null
  if (mobile.value?.mobileTermsOfServiceAccepted) {
    step.value = SetupSteps.Terminal
  } else {
    step.value++
  }
}

// VPN
const selectedVpnId = ref<string>()
const handleCreateVpn = async (request: VpnPostRequest) => {
  const response = await createVpn(request)
  setNotificationMessageState({ message: t('message.created') })
  summaryVpnList.value = [...summaryVpnList.value, omit(response, ['routeCount', 'routes'])]
  selectedVpnId.value = response.vpnId
  vpnNextStep()
}
// モバイルクーポン登録
const couponCode = ref('')
const handleMobileCouponNext = async () => {
  // couponCode の変更がなければそのまま次のstepに移動
  if (couponCode.value !== (mobile.value?.mobileDiscountCode ?? '')) {
    await updateMobile({ mobileDiscountCode: couponCode.value })
  }
  step.value++
}
const submitAgreement = async () => {
  if (typeof mobileTermsOfService.value?.agreementCode === 'string') {
    await agreeMobileTermsOfService({ agreementCode: mobileTermsOfService.value.agreementCode })
  }
  step.value++
}

// 端末
const attachableGuaranteeList = computed(() => getAttachableGuaranteeList())
const attachableIpoeListOptions = computed(() => getAttachableIpoeListOptions())
const openSuccessDialog = ref(false)
const handleTerminalCreate = async (data: InputDataParams) => {
  const request = {
    mobile: getMobilePostRequest(data.mobile),
    terminals: data.terminals.map(terminal => getTerminalBulkPostRequestWithoutMobile(terminal)),
  }
  const response = await createTerminalBulk(request)
  createdTerminalBulkOrderId.value = response.bulkOrderId
  openSuccessDialog.value = true
  navigationGuard(false)
  step.value = SetupSteps.Setup
}
const mobileExists = computed(() => !!resourceSummaryTerminalList.value.terminals.find(terminal => terminal.mobileId))

const firstNextStep = () => {
  selectedVpnId.value = undefined
  selectedVpn.value = null
  step.value++
  navigationGuard(true)
}

onBeforeMount(async () => {
  resetJpkiRequestStatus()
  getSummaryVpnList()
  getAllIpoeList()
  getAllGuaranteeList()
  getAllResourceSummaryTerminalList({ terminalType: TerminalTypes.Rental })
  getBreakOutList()
  getMobile()
  getServiceClosedDays(ServiceClosedDaysServiceTypes.Terminal)
  await getMobileTermsOfService()
  if (mobileTermsOfService.value?.termsOfService) {
    getDownloadMobileTermsOfServiceList(mobileTermsOfService.value.termsOfService)
  }
  couponCode.value = mobile.value?.mobileDiscountCode ?? ''
})
</script>

<template>
  <div>
    <QuickSetupStart
      v-if="step === SetupSteps.Setup"
      :next-disabled="loading || serviceClosedDaysFetchFailed"
      @next="firstNextStep"
    />
    <QuickSetupVpn
      v-else-if="step === SetupSteps.Vpn"
      v-model:vpn-id="selectedVpnId"
      :customer-note-list="vpnCustomerNoteList"
      :vpn-list-options="unterminatedVpnListOptions"
      @prev="step--"
      @next="vpnNextStep"
      @submit="handleCreateVpn"
    />
    <CardContainer v-else-if="step === SetupSteps.MobileCouponRegister || step === SetupSteps.MobileTermsAndConditions">
      <MobileCouponRegister
        v-if="step === SetupSteps.MobileCouponRegister"
        v-model:coupon-code="couponCode"
        :disabled="loading"
        @back="step--"
        @next="handleMobileCouponNext"
      />
      <TermsAndConditions
        v-else
        :terms-of-service="downloadMobileTermsOfServiceList"
        :accepted="!!mobile?.mobileTermsOfServiceAccepted"
        :disabled="loading || typeof mobileTermsOfService?.agreementCode !== 'string'"
        show-back-button
        @back="step--"
        @submit="submitAgreement"
      />
    </CardContainer>
    <QuickSetupTerminal
      v-else-if="step === SetupSteps.Terminal"
      :tenant-id="tenantId"
      :customer-note-list="terminalCustomerNoteList"
      :vpn="selectedVpn"
      :break-out-list="breakOutList"
      :guarantee-list="attachableGuaranteeList"
      :ipoe-list-options="attachableIpoeListOptions"
      :mobile-exists="mobileExists"
      :disabled-dates="disabledDates"
      @prev="step = SetupSteps.Vpn"
      @submit="handleTerminalCreate"
    />
    <TerminalSuccessDialog
      :open="openSuccessDialog"
      :bulk-order-id="createdTerminalBulkOrderId"
      @close="openSuccessDialog = false"
    />
  </div>
</template>
