<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { TerminalTypes, ResourceStatusTypes } from '@/api/constants'
import { TERMINAL_LINK, TerminalCreationSteps } from '@/api/terminals/constants'
import { TermsOfServiceBasePath } from '@/api/termsOfService/constants'

const Steps = {
  MobileCouponRegister: 1,
  TermsAndConditions: 2,
  TerminalCreate: 3,
} as const

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const orderId = computed(() => route.query.orderId as string)

const couponCode = ref('')
const mainStep = ref(0)
const terminalType = ref('')
const terminalCreationStep = ref<number>(TerminalCreationSteps.TerminalAndMobileInformation)

// 確認画面かどうかの判定
const isConfirmation = computed(() => terminalCreationStep.value === TerminalCreationSteps.Confirmation)

const { loading } = useLoading()
const { resetJpkiRequestStatus } = useGetJpkiRequestStatus()
const { getMobile, mobile, mobileDiscountCode } = useGetMobile()
const { updateMobile } = useUpdateMobile()
const {
  termsOfService: mobileTermsOfService,
  getTermsOfService: getMobileTermsOfService,
  agreeTermsOfService: agreeMobileTermsOfService,
  downloadTermsOfServiceList: downloadMobileTermsOfServiceList,
  getDownloadTermsOfServiceList: getDownloadMobileTermsOfServiceList,
} = useTermsOfService(TermsOfServiceBasePath.Mobile)

const { terminalTypeOptions } = useTerminalInput()
const { getAllIpoeList, getAttachableIpoeListOptions } = useGetAllIpoeList()
const { getAllGuaranteeList, getAttachableGuaranteeList } = useGetAllGuaranteeList()
const { resourceSummaryTerminalList, getAllResourceSummaryTerminalList } = useGetAllResourceSummaryTerminalList()
const { getSummaryVpnList, unterminatedVpnListOptions } = useGetSummaryVpnList()

const {
  localStorageTableItems,
  getLocalStorageItem,
  getLocalStorageItemList,
  deleteLocalStorageItem,
  showLocalStorageButton,
  openLocalStorageTableDialog,
  setOpenLocalStorageTableDialog,
  setOpenLocalStorageSaveDialog,
} = useTerminalLocalStorage()

const handleGetLocalStorageItem = (timestamp: string) => {
  getLocalStorageItem(timestamp)
  setOpenLocalStorageTableDialog()
  // 「利用する」を選択した場合は保存ダイアログを閉じる
  setOpenLocalStorageSaveDialog()
}
const handleDeleteLocalStorageItem = (timestamp: string) => {
  deleteLocalStorageItem(timestamp)
}

const attachableGuaranteeList = computed(() => getAttachableGuaranteeList())
const attachableIpoeListOptions = computed(() => getAttachableIpoeListOptions())
const filteredResourceStatus = computed(() =>
  resourceSummaryTerminalList.value.terminals.filter(
    terminal => terminal.resourceStatus !== ResourceStatusTypes.Terminated,
  ),
)
const terminalCustomerNoteList = computed(() =>
  filteredResourceStatus.value
    .filter(terminal => terminal.terminalType === TerminalTypes.Rental)
    .map(({ terminalId: id, customerNote }) => ({ id, customerNote })),
)
const selfTerminalCustomerNoteList = computed(() =>
  filteredResourceStatus.value
    .filter(terminal => terminal.terminalType === TerminalTypes.Self)
    .map(({ terminalId: id, customerNote }) => ({ id, customerNote })),
)
const mobileExists = computed(() => !!resourceSummaryTerminalList.value.terminals.find(terminal => terminal.mobileId))

const addMainStep = () => mainStep.value++
const handleMobileCouponNext = async () => {
  // couponCode の変更がなければそのまま次のstepに移動
  if (couponCode.value !== mobileDiscountCode.value) {
    await updateMobile({ mobileDiscountCode: couponCode.value })
  }
  addMainStep()
}
const submitAgreement = async () => {
  if (typeof mobileTermsOfService.value?.agreementCode === 'string') {
    await agreeMobileTermsOfService({ agreementCode: mobileTermsOfService.value.agreementCode })
  }
  addMainStep()
}

onBeforeMount(async () => {
  resetJpkiRequestStatus()
  await getMobile()
  couponCode.value = mobileDiscountCode.value
  mainStep.value = mobile.value?.mobileTermsOfServiceAccepted ? Steps.TerminalCreate : Steps.MobileCouponRegister
  await getMobileTermsOfService()
  if (mobileTermsOfService.value?.termsOfService) {
    getDownloadMobileTermsOfServiceList(mobileTermsOfService.value.termsOfService)
  }
  getAllIpoeList()
  getAllGuaranteeList()
  getSummaryVpnList()
  getAllResourceSummaryTerminalList()
  if (orderId.value) {
    terminalType.value = TerminalTypes.Rental
  }
  getLocalStorageItemList()
})
</script>

<template>
  <CardContainer>
    <MobileCouponRegister
      v-if="mainStep === Steps.MobileCouponRegister"
      v-model:coupon-code="couponCode"
      :disabled="loading"
      @back="router.back"
      @next="handleMobileCouponNext"
    />
    <TermsAndConditions
      v-if="mainStep === Steps.TermsAndConditions"
      :terms-of-service="downloadMobileTermsOfServiceList"
      :accepted="!!mobile?.mobileTermsOfServiceAccepted"
      :disabled="typeof mobileTermsOfService?.agreementCode !== 'string'"
      show-back-button
      @back="mainStep--"
      @submit="submitAgreement"
    />
    <template v-if="mainStep === Steps.TerminalCreate">
      <div v-if="isConfirmation" class="mb-2">
        {{ t('confirm.create') }}
      </div>
      <InnerCard
        v-if="terminalCreationStep !== TerminalCreationSteps.PicInformation"
        :title="t('terminals.terminalType')"
      >
        <template #help>
          <i18n-t keypath="terminals.help.terminalType" scope="global">
            <template #linkText>
              <NuxtLink :to="TERMINAL_LINK.BASE" target="_blank">
                {{ t('common.here') }}
              </NuxtLink>
            </template>
          </i18n-t>
        </template>
        <template v-if="terminalType === TerminalTypes.Rental" #button>
          <CustomButton
            v-if="showLocalStorageButton"
            :text="t('localStorage.openTableButton')"
            :disabled="!localStorageTableItems.length || isConfirmation"
            data-cy="terminal-create-open-local-storage-table-button"
            @click="setOpenLocalStorageTableDialog('noLimit')"
          />
        </template>
        <RadioForm
          v-model="terminalType"
          :options="terminalTypeOptions"
          :disabled="isConfirmation || !!orderId"
          required
          class="pt-4"
          data-cy="terminal-create-creation-type"
        />
      </InnerCard>

      <TerminalCreate
        v-if="terminalType === TerminalTypes.Rental"
        v-model:terminal-creation-step="terminalCreationStep"
        :guarantee-list="attachableGuaranteeList"
        :vpn-list-options="unterminatedVpnListOptions"
        :ipoe-list-options="attachableIpoeListOptions"
        :customer-note-list="terminalCustomerNoteList"
        :mobile-exists="mobileExists"
        data-cy="terminal-create-rental"
      />
      <SelfTerminalCreate
        v-if="terminalType === TerminalTypes.Self"
        v-model:terminal-creation-step="terminalCreationStep"
        :guarantee-list="attachableGuaranteeList"
        :vpn-list-options="unterminatedVpnListOptions"
        :customer-note-list="selfTerminalCustomerNoteList"
        data-cy="terminal-create-self"
      />
    </template>
    <LocalStorageTableDialog
      :open="!!openLocalStorageTableDialog"
      :status="openLocalStorageTableDialog"
      :items="localStorageTableItems"
      @click:use="handleGetLocalStorageItem"
      @click:remove="handleDeleteLocalStorageItem"
      @close="setOpenLocalStorageTableDialog()"
    />
  </CardContainer>
</template>
