<script lang="ts" setup>
import { cloneDeep } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import {
  CircuitTypes,
  TerminalDeviceTypes,
  TrafficReportFlowAnalyzerPlanTypes,
  SecurityOptionTypes,
  BehaviorDetectionOptionTypes,
} from '@/api/constants'
import { BehaviorDetectionPlanTypes } from '@/api/behaviorDetection/constants'
import type { GuaranteeResponse } from '@/api/guarantees/types'
import { ServiceClosedDaysServiceTypes } from '@/api/serviceClosedDays/constants'
import {
  TERMINAL_LINK,
  MOBILE_INFORMATION_KEYS,
  MOBILE_PIC_INFORMATION_KEYS,
  initialTerminalInputData,
  initialTerminalValid,
  initialMobileInputData,
  initialMobileValid,
  initialTermsOfServiceAgreement,
  TerminalCreationSteps,
  CorporateVerificationMethodTypes,
  initialConfirmationChecked,
} from '@/api/terminals/constants'
import type { TerminalPostRequest } from '@/api/terminals/types'
import { TermsOfServiceBasePath } from '@/api/termsOfService/constants'
import { UNSELECTED_VALUE } from '@/components/input/constants'
import type { IpoeListOptionType } from '@/components/terminals/types'

type PropsType = {
  guaranteeList: GuaranteeResponse[]
  vpnListOptions: Array<{ text: string; value: string }>
  ipoeListOptions: IpoeListOptionType[]
  customerNoteList: Array<{ id: string; customerNote: string }>
  mobileExists: boolean
}
defineProps<PropsType>()
const terminalCreationStep = defineModel<number>('terminalCreationStep', {
  required: true,
})

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenantId as string)
const orderId = computed(() => route.query.orderId as string)
const { loading } = useLoading()

const { navigationGuard } = useNavigationGuard()
navigationGuard(true)

const { checkCircuitTypeSelected, getPostRequest, formatLansToInputType, formatLanStaticRoutesToInputType } =
  useTerminalInput()

const { order, disabledOrderReapply, reappliable, getOrder } = useGetOrder()
const { getBreakOutList, breakOutList } = useGetBreakOutList()
const {
  trafficReportFlowAnalyzerTermsOfServiceAccepted,
  getTermsOfServiceAccepted: getTrafficReportFlowAnalyzerTermsOfServiceAccepted,
} = useTermsOfService(TermsOfServiceBasePath.TrafficReportFlowAnalyzer)
const { securityTermsOfServiceAccepted, getTermsOfServiceAccepted: getSecurityTermsOfServiceAccepted } =
  useTermsOfService(TermsOfServiceBasePath.Security)
const { getSecurityHelpDesk, shouldShowHelpDeskCampaign } = useGetSecurityHelpDesk()

const { currentSettingsBehaviorDetectionPlan, getSettingsBehaviorDetection } = useGetSettingsBehaviorDetection()
const { disabledDates, getServiceClosedDays, serviceClosedDaysFetchFailed } = useServiceClosedDays()

const { createTerminal } = useCreateTerminal()
const {
  localStorageItemState,
  localStorageAddable,
  setLocalStorageItem,
  showLocalStorageButton,
  setShowLocalStorageButton,
  setOpenLocalStorageTableDialog,
  openLocalStorageSaveDialog,
  setOpenLocalStorageSaveDialog,
} = useTerminalLocalStorage()

const saveDataButtonText = computed(() => {
  if (terminalCreationStep.value === TerminalCreationSteps.PicInformation) {
    return t('localStorage.saveBeforePageDataButton')
  } else {
    return t('localStorage.saveCurrentPageDataButton')
  }
})

const handleLocalStorageSaveDialogSubmit = (name: string) => {
  if (localStorageAddable.value) {
    const mobileToSave = MOBILE_INFORMATION_KEYS.reduce(
      (acc, key) => ({ ...acc, [key]: inputMobileData.value[key] }),
      {} as Pick<typeof inputMobileData.value, (typeof MOBILE_INFORMATION_KEYS)[number]>,
    )
    setLocalStorageItem({ name, terminal: inputData.value, mobile: mobileToSave })
    setOpenLocalStorageSaveDialog()
  } else {
    // テーブルのダイアログを開く
    setOpenLocalStorageTableDialog('deleteOnly')
  }
}

const createdOrderId = ref('')
const openTermsOfServiceDialog = ref(false)
const openSuccessDialog = ref(false)

const inputData = ref(structuredClone(initialTerminalInputData))
const inputValid = ref(structuredClone(initialTerminalValid))

const inputMobileData = ref(structuredClone(initialMobileInputData))
const inputMobileValid = ref({
  ...initialMobileValid,
  contractIdentificationDocumentType: true,
  contractIdentificationDocumentId: true,
  corporateVerificationMethod: false,
  jpkiRequestId: false,
})

const isIpoeMobileSelected = computed(
  () =>
    inputData.value.primaryCircuitType === CircuitTypes.Ipoe &&
    inputData.value.secondaryCircuitType === CircuitTypes.Mobile,
)
const isMobileSelected = computed(() => checkCircuitTypeSelected(inputData.value, CircuitTypes.Mobile))
watch(
  isMobileSelected,
  next => {
    setShowLocalStorageButton(next)
  },
  { immediate: true },
)

watch(localStorageItemState, async next => {
  // 保存した情報から読み込みが実行された時の処理
  if (next) {
    inputData.value = cloneDeep(next.terminal)
    inputMobileData.value = { ...initialMobileInputData, ...next.mobile }
    await nextTick()
    // lanType の変更により初期化されるので、再設定する必要がある
    inputData.value.lans = next.terminal.lans
    inputMobileValid.value = {
      ...inputMobileValid.value,
      // ファイルアップロードは手動で有効化する
      contractIdentificationDocumentId:
        inputMobileData.value.corporateVerificationMethod === CorporateVerificationMethodTypes.InPersonVerification
          ? !!inputMobileData.value.contractIdentificationDocumentId
          : true,
      picEmploymentDocumentId: !!inputMobileData.value.picEmploymentDocumentId,
    }
  }
})

const termsOfServiceAgreementRef = ref(structuredClone(initialTermsOfServiceAgreement))
const termsOfServiceAgreement = computed({
  get: () =>
    termsOfServiceAgreementRef.value.filter(checked => {
      switch (checked.key) {
        case 'vpn-id':
          // VPN IDが入力されている場合
          return !!inputData.value.vpnId && inputData.value.vpnId !== UNSELECTED_VALUE
        case 'break-out':
          // ブレイクアウトが選択されている場合
          return inputData.value.breakOut.length > 0 && !inputData.value.breakOut.includes(UNSELECTED_VALUE)
        case 'wan-security-options':
          // セキュリティオプションが申し込まれている場合
          return (
            [inputData.value.threatDetection.threatDetectionPlan, inputData.value.flowCollector.flowCollectorPlan].some(
              plan => plan !== SecurityOptionTypes.NoSubscription,
            ) || inputData.value.behaviorDetection.behaviorDetectionPlan !== BehaviorDetectionOptionTypes.NoSubscription
          )
        case 'traffic-report-flow-analyzer':
          // トラフィックレポート（フロー分析）が申し込まれている場合
          return (
            inputData.value.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan !==
            TrafficReportFlowAnalyzerPlanTypes.NoSubscription
          )
        default:
          return true
      }
    }),
  set: val => {
    termsOfServiceAgreementRef.value = val
  },
})

const confirmationCheckedRef = ref(structuredClone(initialConfirmationChecked))
const confirmationChecked = computed({
  get: () =>
    confirmationCheckedRef.value.filter(checked => {
      switch (checked.key) {
        case 'vpn-id':
          // VPN IDが入力されている場合にのみ表示する
          return !!inputData.value.vpnId && inputData.value.vpnId !== UNSELECTED_VALUE
        case 'pic-information':
        case 'contractor-address':
          // checkContractorAddress と checkPicInformation は mobile がある場合にのみ表示する
          return isMobileSelected.value
        case 'ipoe':
          // メインが ipoe でバックアップが mobile の場合にのみ、IPoEのチェックボックスを表示する
          return isIpoeMobileSelected.value
        default:
          // checkLoopback は常に表示
          return true
      }
    }),
  set: val => {
    confirmationCheckedRef.value = val
  },
})
watch(terminalCreationStep, next => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  if (next !== TerminalCreationSteps.Confirmation) {
    termsOfServiceAgreementRef.value = structuredClone(initialTermsOfServiceAgreement)
    confirmationCheckedRef.value = structuredClone(initialConfirmationChecked)
  }
})

// ステップ1(基本情報)のバリデーション
const terminalInvalid = computed(() =>
  Object.values(inputValid.value).some(valid =>
    typeof valid === 'object' ? Object.values(valid).some(v => !v) : !valid,
  ),
)
const terminalAndMobileInformationInvalid = computed(() => {
  if (!isMobileSelected.value) {
    return terminalInvalid.value
  }
  // モバイルの基本情報のバリデーション
  return MOBILE_INFORMATION_KEYS.some(key => !inputMobileValid.value[key]) || terminalInvalid.value
})

// 本人確認のバリデーション
const picInformationValid = computed(
  () => !isMobileSelected.value || MOBILE_PIC_INFORMATION_KEYS.every(key => inputMobileValid.value[key]),
)

const confirmationDisabled = computed(() => {
  const mobileInvalid = isMobileSelected.value && Object.values(inputMobileValid.value).some(valid => !valid)
  const agreed = termsOfServiceAgreement.value.every(checked => checked.value)
  const checked = confirmationChecked.value.every(checked => checked.value)
  return (
    terminalInvalid.value ||
    mobileInvalid ||
    (terminalCreationStep.value === TerminalCreationSteps.Confirmation && (!agreed || !checked))
  )
})

const needsTrafficReportFlowAnalyzerTermsAcceptance = computed(
  () =>
    inputData.value.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan !==
      TrafficReportFlowAnalyzerPlanTypes.NoSubscription && !trafficReportFlowAnalyzerTermsOfServiceAccepted.value,
)
const needsSecurityTermsAcceptance = computed(
  () =>
    ([inputData.value.threatDetection.threatDetectionPlan, inputData.value.flowCollector.flowCollectorPlan].some(
      plan => plan !== SecurityOptionTypes.NoSubscription,
    ) ||
      inputData.value.behaviorDetection.behaviorDetectionPlan !== BehaviorDetectionOptionTypes.NoSubscription) &&
    !securityTermsOfServiceAccepted.value,
)
const needsBehaviorDetectionSubscribed = computed(
  () =>
    inputData.value.behaviorDetection.behaviorDetectionPlan !== SecurityOptionTypes.NoSubscription &&
    currentSettingsBehaviorDetectionPlan.value === BehaviorDetectionPlanTypes.None,
)

const getMultipleTermsOfServiceAccepted = async () => {
  await getTrafficReportFlowAnalyzerTermsOfServiceAccepted()
  await getSecurityTermsOfServiceAccepted()
  await getSecurityHelpDesk()
  await getSettingsBehaviorDetection()

  openTermsOfServiceDialog.value =
    needsTrafficReportFlowAnalyzerTermsAcceptance.value ||
    needsSecurityTermsAcceptance.value ||
    needsBehaviorDetectionSubscribed.value
}

const handleNextStep = async () => {
  if (terminalCreationStep.value === TerminalCreationSteps.TerminalAndMobileInformation) {
    // Step1の場合は 規約の同意が必要か確認する
    await getMultipleTermsOfServiceAccepted()
    await nextTick()
    if (!openTermsOfServiceDialog.value) {
      // ワイヤレスアクセス有りの場合は本人確認情報に遷移
      terminalCreationStep.value = isMobileSelected.value
        ? TerminalCreationSteps.PicInformation
        : TerminalCreationSteps.Confirmation
    }
  } else {
    terminalCreationStep.value++
  }
}

const handleBack = () => {
  switch (terminalCreationStep.value) {
    case TerminalCreationSteps.Confirmation:
      // 確認画面から戻る
      if (isMobileSelected.value) {
        terminalCreationStep.value = TerminalCreationSteps.PicInformation
      } else {
        terminalCreationStep.value = TerminalCreationSteps.TerminalAndMobileInformation
      }
      break
    case TerminalCreationSteps.PicInformation:
      terminalCreationStep.value = TerminalCreationSteps.TerminalAndMobileInformation
      break
    default:
      router.back()
      break
  }
}

const handleSubmit = async () => {
  const response = await createTerminal(getPostRequest({ mobile: inputMobileData.value, terminal: inputData.value }))
  createdOrderId.value = response?.orderId ?? ''
  openSuccessDialog.value = true
  navigationGuard(false)
}
const showHelpDeskCampaign = computed(() =>
  shouldShowHelpDeskCampaign(
    inputData.value.threatDetection.threatDetectionPlan,
    inputData.value.flowCollector.flowCollectorPlan,
    inputData.value.behaviorDetection.behaviorDetectionPlan,
  ),
)

const submit = computed(() => {
  switch (terminalCreationStep.value) {
    case TerminalCreationSteps.Confirmation:
      return { click: handleSubmit, text: t('common.save'), disabled: confirmationDisabled.value }
    case TerminalCreationSteps.TerminalAndMobileInformation:
      return {
        click: handleNextStep,
        text: isMobileSelected.value ? t('common.next') : t('common.confirm'),
        disabled: terminalAndMobileInformationInvalid.value || serviceClosedDaysFetchFailed.value,
      }
    case TerminalCreationSteps.PicInformation:
      return {
        click: handleNextStep,
        text: t('common.confirm'),
        disabled: !picInformationValid.value,
      }
    default:
      return { click: handleNextStep, text: t('common.next'), disabled: true }
  }
})

// オーダー詳細画面からの遷移の場合は、編集画面の表示を少し遅らせる
const showEditTerminalData = computed(() => !orderId.value || (orderId.value && !!order.value))

const changeToValid = <T extends object>(init: T) => {
  const valid = Object.keys(init).reduce((acc, cur) => {
    const currentValue = init[cur as keyof T]
    const currentValueType = typeof currentValue
    if (currentValueType === 'boolean') {
      return { ...acc, [cur]: true }
    }
    if (currentValueType === 'object' && !Array.isArray(currentValue)) {
      const objectValid = Object.keys(currentValue as object).reduce((acc, cur) => {
        return { ...acc, [cur]: true }
      }, {})
      return { ...acc, [cur]: objectValid }
    }
    return acc
  }, init)
  return valid
}

const getOrderCorporateVerificationMethod = (request: TerminalPostRequest) => {
  if (!request.mobile?.japanCorporateNumber) {
    return ''
  }
  return request.mobile.contractIdentificationDocumentType
    ? CorporateVerificationMethodTypes.InPersonVerification
    : CorporateVerificationMethodTypes.CorporateNumberVerification
}

watch(order, () => {
  if (disabledOrderReapply.value || !reappliable.value || !order.value?.request) {
    // 再申請可能ではないオーダーなので初期値にする
    inputData.value = structuredClone(initialTerminalInputData)
    inputValid.value = structuredClone(initialTerminalValid)
    inputMobileData.value = structuredClone(initialMobileInputData)
    inputMobileValid.value = structuredClone(initialMobileValid)
    return
  }
  const request = order.value.request as TerminalPostRequest
  inputData.value = {
    customerNote: request.customerNote,
    terminalDeviceType: request.terminalDeviceType ?? TerminalDeviceTypes.Router01,
    breakOut: request?.breakOut ?? [],
    interceptDnsServers: request?.interceptDnsServers ?? [],
    deliveryName: request.deliveryName,
    deliveryCompanyName: request.deliveryCompanyName ?? '',
    deliveryDepartmentName: request.deliveryDepartmentName,
    deliveryPostalCode: request.deliveryPostalCode,
    deliveryPhoneNumber: request.deliveryPhoneNumber,
    deliveryAddress: request.deliveryAddress,
    deliveryAddressKana: request.deliveryAddressKana,
    deliveryDate: request.deliveryDate,
    installationPostalCode: request.installationPostalCode,
    installationAddress: request.installationAddress,
    primaryCircuitType: request.primaryCircuitType,
    secondaryCircuitType: request?.secondaryCircuitType ?? '',
    ipoeId: request?.ipoeId ?? '',
    vpnId: request?.vpnId ?? UNSELECTED_VALUE,
    guarantee: {
      guaranteeId: request?.guarantee?.guaranteeId ?? '',
      vpnActConnectedIpv4Prefix: request?.guarantee?.vpn?.act?.connectedIpv4Prefix ?? '',
      vpnSbyConnectedIpv4Prefix: request?.guarantee?.vpn?.sby?.connectedIpv4Prefix ?? '',
    },
    loopbackIpv4Address: request.loopbackIpv4Address,
    lanType: request?.lanType ?? '',
    lans: formatLansToInputType(request?.lans),
    lanStaticRoutes: formatLanStaticRoutesToInputType(request?.lanStaticRoutes),
    wanStaticRoutes: request?.wanStaticRoutes ?? [],
    defaultGateway: {
      nexthopNetwork: request.defaultGateway.nexthopNetwork,
      nexthopIpv4Address: request.defaultGateway?.nexthopIpv4Address ?? '',
      vpnRouting: `${request.defaultGateway?.vpnRouting ?? ''}`,
    },
    vpnInFilters: {
      defaultPolicy: request.vpnInFilters?.defaultPolicy ?? '',
      accessControlList: request.vpnInFilters?.accessControlList ?? [],
    },
    vpnOutFilters: {
      defaultPolicy: request.vpnOutFilters?.defaultPolicy ?? '',
      accessControlList: request.vpnOutFilters?.accessControlList ?? [],
    },
    inet4OutFilters: {
      defaultPolicy: request.inet4OutFilters?.defaultPolicy ?? '',
      accessControlList: request.inet4OutFilters?.accessControlList ?? [],
    },
    dhcpRelayServers: request?.dhcpRelayServers?.map(({ serverIpv4Address }) => serverIpv4Address) ?? [],
    trafficReportFlowAnalyzer: {
      trafficReportFlowAnalyzerPlan: request.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan,
      trafficReportFlowAnalyzerAlert: `${request.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerAlert ?? ''}`,
    },
    threatDetection: {
      threatDetectionPlan: request.threatDetection.threatDetectionPlan,
    },
    flowCollector: {
      flowCollectorPlan: request.flowCollector.flowCollectorPlan,
    },
    behaviorDetection: {
      behaviorDetectionPlan: request.behaviorDetection.behaviorDetectionPlan,
    },
  }
  inputMobileData.value = {
    ...initialMobileInputData,
    ...request.mobile,
    corporateVerificationMethod: getOrderCorporateVerificationMethod(request),
    customerReceiptRequired: `${request.mobile?.customerReceiptRequired ?? ''}`,
    callDetailDesired: `${request.mobile?.callDetailDesired ?? ''}`,
  }
  inputValid.value = changeToValid(initialTerminalValid)
  inputMobileValid.value = changeToValid(initialMobileValid)
})

onBeforeMount(() => {
  // オーダーから再申請の場合はオーダー情報を取得
  if (orderId.value) {
    getOrder(orderId.value)
  }
  getBreakOutList()
  getServiceClosedDays(ServiceClosedDaysServiceTypes.Terminal)
})
</script>

<template>
  <div>
    <!-- 端末基本設定 + ワイヤレスアクセス用ドコモ回線申し込み情報 -->
    <template v-if="terminalCreationStep === TerminalCreationSteps.TerminalAndMobileInformation">
      <EditTerminalData
        v-if="showEditTerminalData"
        v-model:terminal="inputData"
        v-model:valid="inputValid"
        :break-out-list="breakOutList"
        :guarantee-list="guaranteeList"
        :ipoe-list-options="ipoeListOptions"
        :vpn-list-options="vpnListOptions"
        :disabled="false"
        :customer-note-list="customerNoteList"
        :mobile-exists="mobileExists"
        :disabled-dates="disabledDates"
        :service-closed-days-fetch-failed="serviceClosedDaysFetchFailed"
      >
        <!-- ワイヤレスアクセス用ドコモ回線申し込み情報 -->
        <template v-if="isMobileSelected" #mobile>
          <InnerCard :title="t('terminals.mobileInformation')">
            <template #help>
              <i18n-t keypath="terminals.help.mobileInformation" scope="global">
                <template #linkText>
                  <NuxtLink :to="TERMINAL_LINK.MOBILE" target="_blank">
                    {{ t('common.here') }}
                  </NuxtLink>
                </template>
              </i18n-t>
            </template>
            <EditTerminalMobile v-model:mobile="inputMobileData" v-model:valid="inputMobileValid" />
          </InnerCard>
        </template>
      </EditTerminalData>
    </template>

    <!-- 本人確認情報 -->
    <InnerCard
      v-if="terminalCreationStep === TerminalCreationSteps.PicInformation"
      :title="t('terminals.picInformation')"
    >
      <EditTerminalMobilePicInformation v-model:mobile="inputMobileData" v-model:valid="inputMobileValid" />
    </InnerCard>

    <!-- 確認画面 -->
    <template v-if="terminalCreationStep === TerminalCreationSteps.Confirmation">
      <EditTerminalData
        v-if="showEditTerminalData"
        v-model:terminal="inputData"
        v-model:valid="inputValid"
        :break-out-list="breakOutList"
        :guarantee-list="guaranteeList"
        :ipoe-list-options="ipoeListOptions"
        :vpn-list-options="vpnListOptions"
        :customer-note-list="customerNoteList"
        :mobile-exists="mobileExists"
        :disabled-dates="disabledDates"
        :service-closed-days-fetch-failed="serviceClosedDaysFetchFailed"
        disabled
      >
        <!-- ワイヤレスアクセス用ドコモ回線申し込み情報 -->
        <template v-if="isMobileSelected" #mobile>
          <InnerCard :title="t('terminals.mobileInformation')">
            <template #help>
              <i18n-t keypath="terminals.help.mobileInformation" scope="global">
                <template #linkText>
                  <NuxtLink :to="TERMINAL_LINK.MOBILE" target="_blank">
                    {{ t('common.here') }}
                  </NuxtLink>
                </template>
              </i18n-t>
            </template>
            <EditTerminalMobile v-model:mobile="inputMobileData" v-model:valid="inputMobileValid" disabled />
          </InnerCard>
          <InnerCard :title="t('terminals.picInformation')">
            <EditTerminalMobilePicInformation
              v-model:mobile="inputMobileData"
              v-model:valid="inputMobileValid"
              disabled
            />
          </InnerCard>
        </template>
      </EditTerminalData>

      <InnerCard :title="t('terminals.confirm.title')">
        <div
          v-for="checked in confirmationChecked"
          :key="checked.key"
          :data-cy="`terminal-create-checkbox-${checked.key}`"
          class="flex-flex-start-center mt-2"
        >
          <CheckboxBase v-model:value="checked.value" />
          <i18n-t :keypath="checked.keypath" tag="span" scope="global" class="text-pre-wrap ml-6 text-warning">
            <template v-if="!!checked.link" #here>
              <NuxtLink :to="checked.link" target="_blank">
                {{ t('common.here') }}
              </NuxtLink>
            </template>
          </i18n-t>
        </div>
      </InnerCard>
    </template>

    <template v-if="terminalCreationStep === TerminalCreationSteps.Confirmation">
      <TerminalTermsOfService
        v-for="agreement in termsOfServiceAgreement"
        :key="agreement.key"
        v-model="agreement.value"
        :type="agreement.key"
        :data-cy="`terminal-create-terminal-terms-of-service-${agreement.key}`"
      />
    </template>

    <div class="d-flex pt-2">
      <CustomButton
        v-if="showLocalStorageButton"
        icon="right-arrow"
        :text="saveDataButtonText"
        :disabled="terminalCreationStep === TerminalCreationSteps.Confirmation"
        data-cy="terminal-create-save-local-storage-button"
        @click="setOpenLocalStorageSaveDialog(true)"
      />
      <div class="flex-grow-1 flex-flex-end-center">
        <CustomButton
          :width="180"
          :text="
            terminalCreationStep > TerminalCreationSteps.TerminalAndMobileInformation
              ? t('common.return')
              : t('common.cancel')
          "
          icon="right-arrow"
          color="info"
          data-cy="terminal-create-cancel-button"
          @click="handleBack"
        />
        <CustomButton
          class="ml-6"
          icon="right-arrow"
          :width="180"
          :disabled="submit.disabled || loading"
          :text="submit.text"
          data-cy="terminal-create-submit-button"
          @click="submit.click"
        />
      </div>
    </div>
    <LocalStorageSaveDialog
      :open="openLocalStorageSaveDialog"
      :addable="localStorageAddable"
      @submit="handleLocalStorageSaveDialogSubmit"
      @close="setOpenLocalStorageSaveDialog()"
    />
    <TermsOfServiceConfirmDialog
      :open="openTermsOfServiceDialog"
      :tenant-id="tenantId"
      :show-traffic-report-flow-analyzer="needsTrafficReportFlowAnalyzerTermsAcceptance"
      :show-security="needsSecurityTermsAcceptance"
      :show-behavior-detection="needsBehaviorDetectionSubscribed"
      @close="openTermsOfServiceDialog = false"
    />
    <TerminalSuccessDialog
      :open="openSuccessDialog"
      :order-id="createdOrderId"
      :show-help-desk-campaign="showHelpDeskCampaign"
      @close="router.back()"
    />
  </div>
</template>
