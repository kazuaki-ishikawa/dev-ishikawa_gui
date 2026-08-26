<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { DocumentServiceTypes, TerminalTypes, BandwidthUnitTypes } from '@/api/constants'
import { IPOE_LINK } from '@/api/ipoes/constants'
import {
  SearchDateTypes,
  SearchAddressResponseListKeys,
  initialRegistrationAddressInputData,
} from '@/api/iwanUtil/constants'
import type { SearchDateType } from '@/api/iwanUtil/types'
import { TermsOfServiceBasePath } from '@/api/termsOfService/constants'
import {
  initialGuaranteeFieldSurveyAndConstructionDateInputData,
  initialGuaranteeFieldSurveyAndConstructionDateValid,
  initialGuaranteeFieldSurveyAndConstructionInputData,
  UserInterfaceTypes100,
  UserInterfaceTypes1000,
  UserInterfaceTypes,
  PhysicalBandwidthTypes,
  CommunicationModeTypes,
  ConnectionTypes,
  ConstructionTypes,
  WiringTypes,
  InternetRateLimitTypes,
  VpnRateLimitTypes,
  GUARANTEE_LINK,
} from '@/api/guarantees/constants'
import type {
  ThresholdType,
  DurationType,
  NotificationIntervalType,
  GuaranteePostRequest,
} from '@/api/guarantees/types'
import { CampaignResourceType, CampaignTypes } from '@/api/campaigns/constants'
import { GuaranteePages, TenantPages } from '@/components/sidebar/constants'
import { IconTypes } from '@/components/icons/constants'
import type { CampaignSubmitResponse } from '@/components/guarantees/GuaranteeCampaignDialog.vue'

const Steps = {
  Terms: 1,
  SearchAddress: 2,
  ApplicantInput: 3,
  Campaign: 4,
  Confirm: 5,
} as const

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenantId as string)
const { loading } = useLoading()
const rules = useRules()

const { navigationGuard } = useNavigationGuard()
navigationGuard(true)

const step = ref(0)
watch(step, () => {
  if (step.value !== Steps.Campaign) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
})
const agreement = ref(false)
const {
  termsOfServiceAccepted,
  getTermsOfServiceAccepted,
  termsOfService,
  getTermsOfService,
  agreeTermsOfService,
  downloadTermsOfServiceList,
  getDownloadTermsOfServiceList,
} = useTermsOfService(TermsOfServiceBasePath.Guarantee)
const {
  inputData,
  inputValid,
  duringReceptionHours,
  NecessaryOptions,
  CommunicationModeOptions,
  PhysicalBandwidthOptions,
  UserInterfaceTypeOptions,
  thresholdOptions,
  durationOptions,
  notificationIntervalOptions,
  rateLimitRule,
  getInternetRateLimitOptions,
  getVpnRateLimitOptions,
  updateInternetRateLimit,
  updateVpnRateLimit,
  updateInternetThreshold,
  updateVpnThreshold,
} = useGuarantees()
const { getAllResourceSummaryGuaranteeList, customerNoteList } = useGetAllResourceSummaryGuaranteeList()
const { guarantee, createGuarantee } = useCreateGuarantee()
const { createCampaign } = useCreateCampaign()
const { terminalTypeOptions } = useTerminalInput()

// 住所検索
const addressInputData = ref({ ...initialRegistrationAddressInputData })
const { iwanUtilAddressCandidate, iwanUtilSearchAddress, clearIwanUtilSearchAddress, selectedRequestKeys } =
  useIwanUtilSearchAddress()
const { iwanUtilJudged, iwanUtilJudgeAddressCode } = useIwanUtilJudgeAddressCode()
const { getTimeText } = useHikariCollaboUtils()
const applicantDisabled = computed(
  () => !iwanUtilAddressCandidate.value?.installationPlaceCode || !iwanUtilJudged.value?.serviceAvailable,
)
watch(iwanUtilAddressCandidate, next => {
  if (next?.installationPlaceCode) {
    inputData.value.installationPlaceCode = next.installationPlaceCode
    iwanUtilJudgeAddressCode({ installationPlaceCode: next.installationPlaceCode })
  }
})
const showAddressNotFound = computed(
  () =>
    !!iwanUtilAddressCandidate.value &&
    !!iwanUtilAddressCandidate.value?.sectionList &&
    iwanUtilAddressCandidate.value.sectionList.length > 0 &&
    !iwanUtilAddressCandidate.value?.installationPlaceCode,
)
const openMoveToAddressRegistrationRequestDialog = ref(false)
const searchAddressCurrentStep = computed(() => {
  const list = Object.keys(SearchAddressResponseListKeys) as Array<keyof typeof SearchAddressResponseListKeys>
  const currentKey = list.reverse().find(key => !!iwanUtilAddressCandidate.value?.[key])
  return currentKey ? SearchAddressResponseListKeys[currentKey] : 0
})
const moveToAddressRegistrationRequest = async () => {
  navigationGuard(false)
  await navigateTo({
    path: `/tenants/${tenantId.value}/${TenantPages.Guarantees}/${GuaranteePages.AddressRegistrationRequest}`,
    query: { step: searchAddressCurrentStep.value },
  })
}

// ギャランティ新規作成項目入力
const constructionsDateInputData = ref(structuredClone(initialGuaranteeFieldSurveyAndConstructionDateInputData))
const constructionsDateValid = ref(structuredClone(initialGuaranteeFieldSurveyAndConstructionDateValid))
const constructionsInputData = ref(structuredClone(initialGuaranteeFieldSurveyAndConstructionInputData))
const constructionsValid = ref(false)

const fieldSurveyLessTerms = ref([
  { text: t('guarantees.terms.fieldSurveyLess1'), checked: true },
  { text: t('guarantees.terms.fieldSurveyLess2'), checked: true },
])
const fieldSurveyOperationAdjustmentTerms = ref([
  { text: t('guarantees.terms.operationAdjustmentSpecifiedVisitDateTime'), checked: true },
])
const constructionOperationAdjustmentTerms = ref([
  { text: t('guarantees.terms.operationAdjustmentSpecifiedVisitDateTime'), checked: true },
])

const { handleUploadFieldSurveyLessFileDocument } = useUploadDocument()
const handleFileUpload = (file: File) => {
  handleUploadFieldSurveyLessFileDocument(file, DocumentServiceTypes.Guarantee, (id: string) => {
    inputData.value = { ...inputData.value, fieldSurveyLessFileId: id }
    inputValid.value = { ...inputValid.value, fieldSurveyLessFileId: !!id }
  })
}

const handleTerminalTypeChange = (value: string) => {
  if (value === TerminalTypes.Rental) {
    inputData.value = {
      ...inputData.value,
      terminalType: value,
      physicalBandwidth: PhysicalBandwidthTypes[0],
      communicationMode: CommunicationModeTypes.FullDuplex,
    }
    inputValid.value = {
      ...inputValid.value,
      physicalBandwidth: true,
      communicationMode: true,
    }
  } else {
    inputData.value.terminalType = value
  }
}

// rateLimit のルール
const is100M = computed(() => inputData.value.physicalBandwidth === PhysicalBandwidthTypes[0])
const attachedCampaign = ref<CampaignSubmitResponse>()
const internetRateLimitOptions = computed(() => {
  const options = getInternetRateLimitOptions(inputData.value.physicalBandwidth, inputData.value.terminalType)
  if (attachedCampaign.value?.connectionType === ConnectionTypes.Internet) {
    return options.map(option => ({
      text: t('guarantees.rateLimitCampaignText', {
        rateLimit: option.text,
        extraRateLimit: attachedCampaign.value?.extraRateLimit,
      }),
      value: option.value,
    }))
  }
  return options
})
const vpnRateLimitOptions = computed(() => {
  const options = getVpnRateLimitOptions(inputData.value.physicalBandwidth, inputData.value.terminalType)
  if (attachedCampaign.value?.connectionType === ConnectionTypes.Vpn) {
    return options.map(option => ({
      text: t('guarantees.rateLimitCampaignText', {
        rateLimit: option.text,
        extraRateLimit: attachedCampaign.value?.extraRateLimit,
      }),
      value: option.value,
    }))
  }
  return options
})

const internetRateLimitRule =
  (terminalType: string, physicalBandwidth: string, vpnRateLimit: string) => (internetRateLimit: string) =>
    rateLimitRule({ target: 'internet', physicalBandwidth, vpnRateLimit, internetRateLimit, terminalType })
const vpnRateLimitRule =
  (terminalType: string, physicalBandwidth: string, internetRateLimit: string) => (vpnRateLimit: string) =>
    rateLimitRule({ target: 'vpn', terminalType, physicalBandwidth, vpnRateLimit, internetRateLimit })

const userInterfaceTypeOptions = computed(() =>
  UserInterfaceTypeOptions.filter(v =>
    is100M.value
      ? UserInterfaceTypes100.includes(v.value)
      : inputData.value.terminalType === TerminalTypes.Rental
        ? v.value === UserInterfaceTypes1000[2]
        : UserInterfaceTypes1000.includes(v.value),
  ),
)
const userInterfaceTypeDisabled = computed(
  () => !inputData.value.physicalBandwidth || is100M.value || inputData.value.terminalType === TerminalTypes.Rental,
)
watch(
  () => inputData.value.userInterfaceType,
  next => {
    if (next === UserInterfaceTypes1000[2]) {
      inputData.value.communicationMode = CommunicationModeTypes.AutoNego
      inputValid.value.communicationMode = true
    }
  },
)

watch(
  () => inputData.value.physicalBandwidth,
  next => {
    // physicalBandwidth で設定可能な項目が変わる項目を初期化
    inputData.value = {
      ...inputData.value,
      internetRateLimit: '',
      vpnRateLimit: '',
      communicationMode: next === '100M' ? CommunicationModeTypes.FullDuplex : CommunicationModeTypes.AutoNego,
      userInterfaceType:
        next === '100M'
          ? UserInterfaceTypes100[0]
          : next === '1G' && inputData.value.terminalType === TerminalTypes.Rental
            ? UserInterfaceTypes1000[2]
            : '',
    }
    inputValid.value = {
      ...inputValid.value,
      internetRateLimit: false,
      vpnRateLimit: false,
      communicationMode: true,
      userInterfaceType: next === '100M' || (next === '1G' && inputData.value.terminalType === TerminalTypes.Rental),
    }
  },
)
const communicationModeDisabled = computed(
  () => is100M.value || inputData.value.userInterfaceType === UserInterfaceTypes1000[2],
)

const isFieldSurveyLess = computed({
  get: () => inputData.value.fieldSurveyLess === 'true',
  set: (value: boolean) => {
    inputData.value.fieldSurveyLess = `${value}`
  },
})
watch(isFieldSurveyLess, next => {
  // 確認チェックを制御
  fieldSurveyLessTerms.value = fieldSurveyLessTerms.value.map(term => ({ ...term, checked: !next }))
  // ファイルアップロードの入力欄を制御
  inputData.value.fieldSurveyLessFileId = ''
  inputValid.value.fieldSurveyLessFileId = !next

  constructionsDateValid.value = {
    fieldSurvey: { date: next, time: next, admissionApplicationRequired: next },
    construction: { ...constructionsDateValid.value.construction },
  }

  if (next) {
    // 「現調レス希望」が選択された場合
    // 現地調査日の入力欄は全て入力不可になるため入力項目を空にする
    constructionsDateInputData.value = {
      fieldSurvey: { ...initialGuaranteeFieldSurveyAndConstructionDateInputData.fieldSurvey },
      construction: { ...constructionsDateInputData.value.construction },
    }
  }
})

const isFieldSurveyOperationAdjustment = computed({
  get: () => constructionsInputData.value.fieldSurvey.operationAdjustment === 'true',
  set: (value: boolean) => {
    constructionsInputData.value.fieldSurvey.operationAdjustment = `${value}`
  },
})
const isConstructionOperationAdjustment = computed({
  get: () => constructionsInputData.value.construction.operationAdjustment === 'true',
  set: (value: boolean) => {
    constructionsInputData.value.construction.operationAdjustment = `${value}`
  },
})
watch(isFieldSurveyOperationAdjustment, next => {
  // 確認チェックを制御
  fieldSurveyOperationAdjustmentTerms.value = fieldSurveyOperationAdjustmentTerms.value.map(term => ({
    ...term,
    checked: !next,
  }))
  // 現地調査の「稼働調整依頼・訪問時刻指定」が true の時は現地調査・宅内工事の希望日時は入力不可
  constructionsDateInputData.value = {
    fieldSurvey: {
      ...constructionsDateInputData.value.fieldSurvey,
      time: '',
      date: '',
    },
    construction: {
      ...constructionsDateInputData.value.construction,
      time: '',
      date: '',
    },
  }
  constructionsDateValid.value = {
    fieldSurvey: {
      ...constructionsDateValid.value.fieldSurvey,
      date: isFieldSurveyLess.value || next,
      time: isFieldSurveyLess.value || next,
    },
    construction: {
      ...constructionsDateValid.value.construction,
      date: isConstructionOperationAdjustment.value || next,
      time: isConstructionOperationAdjustment.value || next,
    },
  }
})
watch(isConstructionOperationAdjustment, next => {
  // 確認チェックを制御
  constructionOperationAdjustmentTerms.value = constructionOperationAdjustmentTerms.value.map(term => ({
    ...term,
    checked: !next,
  }))
  // 宅内工事の「稼働調整依頼・訪問時刻指定」が true の時は宅内工事の希望日時は入力不可
  constructionsDateInputData.value = {
    fieldSurvey: { ...constructionsDateInputData.value.fieldSurvey },
    construction: {
      ...constructionsDateInputData.value.construction,
      time: '',
      date: '',
    },
  }
  constructionsDateValid.value = {
    fieldSurvey: { ...constructionsDateValid.value.fieldSurvey },
    construction: {
      ...constructionsDateValid.value.construction,
      date: isFieldSurveyOperationAdjustment.value || next,
      time: isFieldSurveyOperationAdjustment.value || next,
    },
  }
})

// 現地調査の希望日選択は fieldSurveyLess = true or admissionApplicationRequired が未選択の場合は選択不可
const fieldSurveyReserveDateButtonDisabled = computed(
  () =>
    isConfirmation.value ||
    isFieldSurveyLess.value ||
    isFieldSurveyOperationAdjustment.value ||
    !constructionsDateInputData.value.fieldSurvey.admissionApplicationRequired,
)
// 宅内工事の希望日選択は 現場調査日を入力されない限り選択不可
// fieldSurveyLess = true の時は選択可能になる
const constructionReserveDateButtonDisabled = computed(
  () =>
    isConfirmation.value ||
    (!isFieldSurveyLess.value && !constructionsDateInputData.value.fieldSurvey.date) ||
    isConstructionOperationAdjustment.value,
)
const fieldSurveyReserveTime = computed(() => getTimeText(constructionsDateInputData.value.fieldSurvey.time))
const constructionReserveTime = computed(() => getTimeText(constructionsDateInputData.value.construction.time))

// 希望日選択ダイアログ
const searchDateType = ref<SearchDateType>()
const handleFiledSurveyTableOpen = () => {
  searchDateType.value = SearchDateTypes.FieldSurvey
}
const handleConstructionTableOpen = () => {
  searchDateType.value = SearchDateTypes.Construction
}
const reservedDates = computed(() => {
  if (searchDateType.value === SearchDateTypes.FieldSurvey) {
    return {
      date: constructionsDateInputData.value.fieldSurvey.date,
      time: constructionsDateInputData.value.fieldSurvey.time,
    }
  } else if (searchDateType.value === SearchDateTypes.Construction) {
    return {
      date: constructionsDateInputData.value.construction.date,
      time: constructionsDateInputData.value.construction.time,
    }
  } else {
    return { date: '', time: '' }
  }
})
const handleReserveDateSubmit = (selected: { date: string; time: string }) => {
  if (searchDateType.value === SearchDateTypes.FieldSurvey) {
    // 現地調査の場合は、宅内工事を初期化する
    constructionsDateValid.value = {
      fieldSurvey: { ...constructionsDateValid.value.fieldSurvey, date: true, time: true },
      construction: {
        ...constructionsDateValid.value.construction,
        date: isConstructionOperationAdjustment.value,
        time: isConstructionOperationAdjustment.value,
      },
    }
    constructionsDateInputData.value = {
      fieldSurvey: { ...constructionsDateInputData.value.fieldSurvey, ...selected },
      construction: { ...constructionsDateInputData.value.construction, date: '', time: '' },
    }
  } else if (searchDateType.value === SearchDateTypes.Construction) {
    constructionsDateValid.value = {
      fieldSurvey: { ...constructionsDateValid.value.fieldSurvey },
      construction: { ...constructionsDateValid.value.construction, date: true, time: true },
    }
    constructionsDateInputData.value = {
      fieldSurvey: { ...constructionsDateInputData.value.fieldSurvey },
      construction: { ...constructionsDateInputData.value.construction, ...selected },
    }
  }
  searchDateType.value = undefined
}

const areRateLimitsEmpty = computed(() => !inputData.value.internetRateLimit && !inputData.value.vpnRateLimit)
const invalid = computed(
  () =>
    Object.values(inputValid.value).some(valid => !valid) ||
    Object.values(constructionsDateValid.value).some(valid =>
      typeof valid === 'object' ? Object.values(valid).some(v => !v) : !valid,
    ) ||
    !constructionsValid.value ||
    areRateLimitsEmpty.value,
)
const submitDisabled = computed(
  () =>
    fieldSurveyLessTerms.value.some(term => !term.checked) ||
    fieldSurveyOperationAdjustmentTerms.value.some(term => !term.checked) ||
    constructionOperationAdjustmentTerms.value.some(term => !term.checked) ||
    !duringReceptionHours.value ||
    invalid.value ||
    loading.value,
)

const isConfirmation = computed(() => step.value > Steps.ApplicantInput)
const internetRateLimit = computed(() => {
  const inputRateLimit = convertBandwidthToUnit(inputData.value.internetRateLimit, BandwidthUnitTypes.MB)
  const addCampaignRateLimit =
    attachedCampaign.value?.connectionType === ConnectionTypes.Internet
      ? inputRateLimit + attachedCampaign.value.extraRateLimit
      : inputRateLimit
  // キャンペーンを適用した後の値が 1000(M) を超えた場合は G に変換する
  return 1000 <= addCampaignRateLimit ? `${addCampaignRateLimit / 10 ** 3}G` : `${addCampaignRateLimit}M`
})
const vpnRateLimit = computed(() => {
  const inputRateLimit = convertBandwidthToUnit(inputData.value.vpnRateLimit, BandwidthUnitTypes.MB)
  const addCampaignRateLimit =
    attachedCampaign.value?.connectionType === ConnectionTypes.Vpn
      ? inputRateLimit + attachedCampaign.value.extraRateLimit
      : inputRateLimit
  // キャンペーンを適用した後の値が 1000(M) を超えた場合は G に変換する
  return 1000 <= addCampaignRateLimit ? `${addCampaignRateLimit / 10 ** 3}G` : `${addCampaignRateLimit}M`
})
const request = computed<GuaranteePostRequest>(() => {
  const internet = {
    rateLimit: InternetRateLimitTypes.find(rateLimit => rateLimit === internetRateLimit.value),
    alertSetting: inputData.value.internetThreshold
      ? {
          threshold: inputData.value.internetThreshold as ThresholdType,
          duration: inputData.value.internetDuration as DurationType,
          notificationInterval: inputData.value.internetNotificationInterval as NotificationIntervalType,
        }
      : undefined,
  }
  const vpn = {
    rateLimit: VpnRateLimitTypes.find(rateLimit => rateLimit === vpnRateLimit.value),
    alertSetting: inputData.value.vpnThreshold
      ? {
          threshold: inputData.value.vpnThreshold as ThresholdType,
          duration: inputData.value.vpnDuration as DurationType,
          notificationInterval: inputData.value.vpnNotificationInterval as NotificationIntervalType,
        }
      : undefined,
  }
  const fieldSurvey = {
    ...constructionsInputData.value.fieldSurvey,
    ...constructionsDateInputData.value.fieldSurvey,
    operationAdjustment: isFieldSurveyOperationAdjustment.value,
    date: constructionsDateInputData.value.fieldSurvey.date || undefined,
    time: constructionsDateInputData.value.fieldSurvey.time || undefined,
    admissionApplicationRequired: constructionsDateInputData.value.fieldSurvey.admissionApplicationRequired === 'true',
  }
  const construction = {
    ...constructionsInputData.value.construction,
    ...constructionsDateInputData.value.construction,
    operationAdjustment: isConstructionOperationAdjustment.value,
    date: constructionsDateInputData.value.construction.date || undefined,
    time: constructionsDateInputData.value.construction.time || undefined,
    admissionApplicationRequired: constructionsDateInputData.value.construction.admissionApplicationRequired === 'true',
  }

  return {
    customerNote: inputData.value.customerNote,
    userInterfaceType:
      UserInterfaceTypes.find(val => inputData.value.userInterfaceType === val) || UserInterfaceTypes[0],
    physicalBandwidth:
      inputData.value.physicalBandwidth === PhysicalBandwidthTypes[0]
        ? PhysicalBandwidthTypes[0]
        : PhysicalBandwidthTypes[1],
    installationPlaceCode: inputData.value.installationPlaceCode,
    constructionType: ConstructionTypes.ToTerminal, // #15026 固定値
    wiringType: WiringTypes.Rental, // #15026 固定値
    communicationMode:
      inputData.value.communicationMode === CommunicationModeTypes.AutoNego
        ? CommunicationModeTypes.AutoNego
        : CommunicationModeTypes.FullDuplex,
    fieldSurveyLess: isFieldSurveyLess.value,
    fieldSurvey: isFieldSurveyLess.value ? undefined : fieldSurvey,
    construction,
    internet,
    vpn,
    fieldSurveyLessInfo: isFieldSurveyLess.value
      ? {
          fieldSurveyLessFileId: inputData.value.fieldSurveyLessFileId,
        }
      : undefined,
  }
})

const submitAgreement = async () => {
  if (typeof termsOfService.value?.agreementCode === 'string') {
    await agreeTermsOfService({ agreementCode: termsOfService.value.agreementCode })
  }
  step.value++
}
const handleCampaignSubmit = (campaign?: CampaignSubmitResponse) => {
  attachedCampaign.value = campaign
  step.value++
}

// 以下の条件のとき キャンペーン適用不可
// 物理帯域が100M かつ インターネット と VPN の契約帯域の合計が 100M以上 の場合
//                   VPNの契約帯域が 90M の場合
// 物理帯域が 1G かつ 自営ルーター かつ インターネット と VPN の契約帯域の合計が 1G 以上の場合
//                  レンタルルーター かつ インターネット と VPN の契約帯域の合計が 300M 以上の場合
const campaignDisabled = computed(() => {
  const vpnRateLimitInt = convertBandwidthToUnit(inputData.value.vpnRateLimit, BandwidthUnitTypes.MB)
  const internetRateLimitInt = convertBandwidthToUnit(inputData.value.internetRateLimit, BandwidthUnitTypes.MB)
  if (is100M.value) {
    return (
      vpnRateLimitInt + internetRateLimitInt >= 100 ||
      (inputData.value.vpnRateLimit === '90M' && !inputData.value.internetRateLimit)
    )
  } else {
    return inputData.value.terminalType === TerminalTypes.Self
      ? vpnRateLimitInt + internetRateLimitInt >= 1000
      : vpnRateLimitInt + internetRateLimitInt >= 300
  }
})
const handleConfirm = () => {
  if (campaignDisabled.value) {
    step.value = Steps.Confirm
  } else {
    step.value++
  }
}
const handleReturn = () => {
  if (step.value === Steps.Confirm && campaignDisabled.value) {
    step.value = Steps.ApplicantInput
  } else if (step.value === Steps.Campaign) {
    attachedCampaign.value = undefined
    step.value--
  } else {
    step.value--
  }
}
const handleSubmit = async () => {
  await createGuarantee(request.value)
  if (attachedCampaign.value && !!guarantee.value?.guaranteeId) {
    await createCampaign({
      campaignType: CampaignTypes.GuaranteeOneRankUp,
      resourceType: CampaignResourceType.Guarantee,
      resourceId: guarantee.value.guaranteeId,
      campaignInfo: {
        networkType: attachedCampaign.value.connectionType,
      },
    })
  }
  navigationGuard(false)
}

onBeforeMount(async () => {
  await getTermsOfServiceAccepted()
  if (!termsOfServiceAccepted.value) {
    step.value = Steps.Terms
    await getTermsOfService()
    if (termsOfService.value?.termsOfService) {
      await getDownloadTermsOfServiceList(termsOfService.value.termsOfService)
    }
  } else {
    step.value = Steps.SearchAddress
  }
  // 初期値を入れておく
  inputData.value = {
    ...inputData.value,
    userInterfaceType: UserInterfaceTypes[0],
    physicalBandwidth: PhysicalBandwidthTypes[0],
    communicationMode: CommunicationModeTypes.FullDuplex,
  }
  inputValid.value = {
    ...inputValid.value,
    userInterfaceType: true,
    physicalBandwidth: true,
    communicationMode: true,
  }
  clearIwanUtilSearchAddress()
  await getAllResourceSummaryGuaranteeList()
})
</script>

<template>
  <CardContainer>
    <div v-if="isConfirmation" class="mb-4">
      {{ t('confirm.create') }}
    </div>
    <div
      v-if="!duringReceptionHours"
      class="mb-4 text-warning text-pre-wrap"
      data-cy="guarantees-circuits-create-outside-reception-hour"
    >
      {{ t('guarantees.outsideReceptionHour') }}
    </div>
    <template v-if="step === Steps.Terms">
      <TermsAndConditions
        terms-type="guarantee"
        :terms-of-service="downloadTermsOfServiceList"
        :accepted="agreement"
        :disabled="typeof termsOfService?.agreementCode !== 'string'"
        show-back-button
        @back="router.back()"
        @submit="submitAgreement"
      />
    </template>
    <template v-else-if="step === Steps.SearchAddress">
      <GuaranteeSearchAddress
        v-model:data="addressInputData"
        :address-candidate="iwanUtilAddressCandidate"
        :selected-request-keys="selectedRequestKeys"
        :service-available="iwanUtilJudged?.serviceAvailable"
        :disabled="!duringReceptionHours || loading"
        @search="iwanUtilSearchAddress"
      >
        <template v-if="showAddressNotFound" #address-not-found>
          <NuxtLink
            class="text-decoration-underline cursor-pointer"
            data-cy="guarantees-circuits-create-search-address-not-found"
            @click.stop="openMoveToAddressRegistrationRequestDialog = true"
          >
            {{ t('guarantees.searchAddressNotFound') }}
          </NuxtLink>
          <DialogBase
            :open="openMoveToAddressRegistrationRequestDialog"
            :submit-label="t('guarantees.moveToAddressRegistrationRequest')"
            :submit-width="200"
            :cancel-label="t('common.close')"
            @submit="moveToAddressRegistrationRequest"
            @close="openMoveToAddressRegistrationRequestDialog = false"
          >
            <div class="text-pre-wrap text-center">
              {{ t('guarantees.moveToAddressRegistrationRequestMessage') }}
            </div>
          </DialogBase>
        </template>
      </GuaranteeSearchAddress>
      <div class="flex-flex-end-center mt-5">
        <CustomButton icon="right-arrow" color="info" :width="180" :text="t('common.cancel')" @click="router.back()" />
        <CustomButton
          class="ml-6"
          icon="right-arrow"
          :disabled="!duringReceptionHours || applicantDisabled"
          :width="250"
          :text="t('ipoes.moveToApplicantInput')"
          data-cy="guarantees-circuits-create-applicant-input-button"
          @click="step++"
        />
      </div>
    </template>
    <template v-else-if="step >= Steps.ApplicantInput">
      <InnerCard>
        <InputGrid
          required
          :label="t('guarantees.preSelectedTerminalType')"
          :help="t('guarantees.help.preSelectedTerminal')"
        >
          <SelectForm
            :model-value="inputData.terminalType"
            :options="terminalTypeOptions"
            required
            :placeholder="terminalTypeOptions[0]?.text"
            :disabled="isConfirmation"
            data-cy="guarantees-circuits-create-terminal-type"
            @update:model-value="handleTerminalTypeChange"
            @valid="(valid: boolean) => (inputValid.terminalType = valid)"
          />
        </InputGrid>
      </InnerCard>
      <InnerCard :title="t('guarantees.basicInformation')">
        <template #help>
          <i18n-t keypath="guarantees.help.basicInformation" scope="global">
            <template #linkText>
              <NuxtLink :to="GUARANTEE_LINK.BASIC_INFORMATION" target="_blank">{{ t('common.here') }}</NuxtLink>
            </template>
          </i18n-t>
        </template>
        <InputGrid required :label="t('guarantees.customerNote')">
          <InputForm
            v-model="inputData.customerNote"
            :rules="[rules.customerNote, rules.duplicateCustomerNote(customerNoteList)]"
            required
            maxlength="64"
            :placeholder="t('guarantees.customerNote')"
            :disabled="isConfirmation"
            data-cy="guarantees-circuits-create-customer-note"
            @valid="(valid: boolean) => (inputValid.customerNote = valid)"
          />
        </InputGrid>
        <InputGrid required :label="t('guarantees.physicalBandwidth')" :help="t('guarantees.help.physicalBandwidth')">
          <SelectForm
            v-model="inputData.physicalBandwidth"
            :options="PhysicalBandwidthOptions"
            required
            :placeholder="PhysicalBandwidthOptions[0]?.text"
            :disabled="isConfirmation"
            data-cy="guarantees-circuits-create-physical-bandwidth"
            @valid="(valid: boolean) => (inputValid.physicalBandwidth = valid)"
          />
        </InputGrid>
        <InputGrid required :label="t('guarantees.interface')" :help="t('guarantees.help.interface')">
          <SelectForm
            v-model="inputData.userInterfaceType"
            :options="userInterfaceTypeOptions"
            required
            :disabled="isConfirmation || userInterfaceTypeDisabled"
            :placeholder="UserInterfaceTypeOptions[0]?.text"
            data-cy="guarantees-circuits-create-user-interface-type"
            @valid="(valid: boolean) => (inputValid.userInterfaceType = valid)"
          />
        </InputGrid>
        <InputGrid required :label="t('guarantees.communicationMode')" :help="t('guarantees.help.communicationMode')">
          <SelectForm
            v-model="inputData.communicationMode"
            :options="CommunicationModeOptions"
            required
            :disabled="isConfirmation || communicationModeDisabled"
            :placeholder="CommunicationModeOptions[0]?.text"
            data-cy="guarantees-circuits-create-communication-mode"
            @valid="(valid: boolean) => (inputValid.communicationMode = valid)"
          />
        </InputGrid>
        <div class="flex-flex-start-center text-secondary text-lg">
          {{ t('guarantees.internet') }}
          <HelpTooltip class="px-2 pt-1 text-base" size="smallMiddle">
            <i18n-t keypath="guarantees.help.internet" scope="global">
              <template #linkText>
                <NuxtLink :to="GUARANTEE_LINK.INTERNET" target="_blank">
                  {{ t('common.here') }}
                </NuxtLink>
              </template>
            </i18n-t>
          </HelpTooltip>
        </div>
        <InputGrid
          :required="areRateLimitsEmpty"
          :label="t('guarantees.rateLimit')"
          :help-option="{
            icon: IconTypes.AlertTriangle,
            color: 'error',
            contentWidth: 760,
          }"
        >
          <template v-if="areRateLimitsEmpty" #help>
            {{ t('guarantees.rateLimitsEmpty', { min: inputData.physicalBandwidth === '100M' ? '10M' : '100M' }) }}
          </template>
          <SelectForm
            v-model="inputData.internetRateLimit"
            :options="internetRateLimitOptions"
            :required="areRateLimitsEmpty"
            :disabled="isConfirmation || !inputData.physicalBandwidth"
            :placeholder="internetRateLimitOptions[0]?.text"
            :rules="[
              internetRateLimitRule(inputData.terminalType, inputData.physicalBandwidth, inputData.vpnRateLimit),
            ]"
            data-cy="guarantees-circuits-create-internet-rate-limit"
            @valid="(valid: boolean) => (inputValid.internetRateLimit = valid)"
            @update:model-value="updateInternetRateLimit"
          />
        </InputGrid>
        <div class="mt-3 ml-5">
          <div class="flex-flex-start-center text-secondary text-lg">
            {{ t('guarantees.alertSetting') }}
            <HelpTooltip class="px-2 pt-1 text-base" size="smallMiddle">
              {{ t('guarantees.help.alertSettingInternet') }}
            </HelpTooltip>
          </div>
          <InputGrid :label="t('guarantees.threshold')" :label-width="270" :help="t('guarantees.help.threshold')">
            <SelectForm
              v-model="inputData.internetThreshold"
              :options="thresholdOptions"
              :placeholder="thresholdOptions[0]?.text"
              :disabled="isConfirmation || !inputData.physicalBandwidth || !inputData.internetRateLimit"
              data-cy="guarantees-circuits-create-internet-threshold"
              @valid="(valid: boolean) => (inputValid.internetThreshold = valid)"
              @update:model-value="updateInternetThreshold"
            />
          </InputGrid>
          <InputGrid
            :label="t('guarantees.duration')"
            :required="!!inputData.internetThreshold"
            :label-width="270"
            :help="t('guarantees.help.duration')"
          >
            <SelectForm
              v-model="inputData.internetDuration"
              :options="durationOptions"
              :placeholder="durationOptions[0]?.text"
              :required="!!inputData.internetThreshold"
              :disabled="isConfirmation || !inputData.internetThreshold"
              data-cy="guarantees-circuits-create-internet-duration"
              @valid="(valid: boolean) => (inputValid.internetDuration = valid)"
            />
          </InputGrid>
          <InputGrid
            :label="t('guarantees.notificationInterval')"
            :required="!!inputData.internetThreshold"
            :label-width="270"
            :help="t('guarantees.help.notificationInterval')"
          >
            <SelectForm
              v-model="inputData.internetNotificationInterval"
              :options="notificationIntervalOptions"
              :placeholder="notificationIntervalOptions[0]?.text"
              :required="!!inputData.internetThreshold"
              :disabled="isConfirmation || !inputData.internetThreshold"
              data-cy="guarantees-circuits-create-internet-notification-interval"
              @valid="(valid: boolean) => (inputValid.internetNotificationInterval = valid)"
            />
          </InputGrid>
        </div>
        <div class="flex-flex-start-center mt-3 text-secondary text-lg">
          {{ t('guarantees.vpn') }}
          <HelpTooltip class="px-2 pt-1 text-base" size="smallMiddle">
            <i18n-t keypath="guarantees.help.vpn" scope="global">
              <template #linkText>
                <NuxtLink :to="GUARANTEE_LINK.VPN" target="_blank">
                  {{ t('common.here') }}
                </NuxtLink>
              </template>
            </i18n-t>
          </HelpTooltip>
        </div>
        <InputGrid
          :required="areRateLimitsEmpty"
          :label="t('guarantees.rateLimit')"
          :help-option="{
            icon: IconTypes.AlertTriangle,
            color: 'error',
            contentWidth: 760,
          }"
        >
          <template v-if="areRateLimitsEmpty" #help>
            {{ t('guarantees.rateLimitsEmpty', { min: inputData.physicalBandwidth === '100M' ? '10M' : '100M' }) }}
          </template>
          <SelectForm
            v-model="inputData.vpnRateLimit"
            :options="vpnRateLimitOptions"
            :required="areRateLimitsEmpty"
            :disabled="isConfirmation || !inputData.physicalBandwidth"
            :placeholder="vpnRateLimitOptions[0]?.text"
            :rules="[
              vpnRateLimitRule(inputData.terminalType, inputData.physicalBandwidth, inputData.internetRateLimit),
            ]"
            data-cy="guarantees-circuits-create-vpn-rate-limit"
            @valid="(valid: boolean) => (inputValid.vpnRateLimit = valid)"
            @update:model-value="updateVpnRateLimit"
          />
        </InputGrid>
        <div class="mt-3 ml-5">
          <div class="flex-flex-start-center text-secondary text-lg">
            {{ t('guarantees.alertSetting') }}
            <HelpTooltip class="px-2 pt-1 text-base" size="smallMiddle">
              {{ t('guarantees.help.alertSettingVpn') }}
            </HelpTooltip>
          </div>
          <InputGrid :label="t('guarantees.threshold')" :label-width="270" :help="t('guarantees.help.threshold')">
            <SelectForm
              v-model="inputData.vpnThreshold"
              :options="thresholdOptions"
              :placeholder="thresholdOptions[0]?.text"
              :disabled="isConfirmation || !inputData.physicalBandwidth || !inputData.vpnRateLimit"
              data-cy="guarantees-circuits-create-vpn-threshold"
              @valid="(valid: boolean) => (inputValid.vpnThreshold = valid)"
              @update:model-value="updateVpnThreshold"
            />
          </InputGrid>
          <InputGrid
            :label="t('guarantees.duration')"
            :required="!!inputData.vpnThreshold"
            :label-width="270"
            :help="t('guarantees.help.duration')"
          >
            <SelectForm
              v-model="inputData.vpnDuration"
              :options="durationOptions"
              :placeholder="durationOptions[0]?.text"
              :required="!!inputData.vpnThreshold"
              :disabled="isConfirmation || !inputData.vpnThreshold"
              data-cy="guarantees-circuits-create-vpn-duration"
              @valid="(valid: boolean) => (inputValid.vpnDuration = valid)"
            />
          </InputGrid>
          <InputGrid
            :label="t('guarantees.notificationInterval')"
            :required="!!inputData.vpnThreshold"
            :label-width="270"
            :help="t('guarantees.help.notificationInterval')"
          >
            <SelectForm
              v-model="inputData.vpnNotificationInterval"
              :options="notificationIntervalOptions"
              :placeholder="notificationIntervalOptions[0]?.text"
              :required="!!inputData.vpnThreshold"
              :disabled="isConfirmation || !inputData.vpnThreshold"
              data-cy="guarantees-circuits-create-vpn-notification-interval"
              @valid="(valid: boolean) => (inputValid.vpnNotificationInterval = valid)"
            />
          </InputGrid>
        </div>
      </InnerCard>

      <!-- 現地調査・宅内工事希望日 -->
      <InnerCard :title="t('guarantees.fieldSurveyConstructionReserveDate')">
        <template #help>
          <i18n-t keypath="guarantees.help.fieldSurveyConstructionReserveDate" scope="global">
            <template #linkText>
              <NuxtLink :to="GUARANTEE_LINK.DESIRED_DATE" target="_blank">{{ t('common.here') }}</NuxtLink>
            </template>
          </i18n-t>
        </template>
        <div class="pt-3 flex-space-between-center">
          <div class="flex-flex-start-center text-lg text-secondary">
            {{ t('guarantees.fieldSurvey') }}
            <HelpTooltip class="px-2 pt-1 text-base" size="smallMiddle">
              {{ t('guarantees.help.inputInformation', { operation: t('guarantees.fieldSurvey') }) }}
            </HelpTooltip>
          </div>
          <CustomButton
            icon="right-arrow"
            :text="t('guarantees.selectFieldSurveyDateTime')"
            :width="250"
            :disabled="fieldSurveyReserveDateButtonDisabled"
            data-cy="guarantees-circuits-create-field-survey-reserve-date-button"
            @click="handleFiledSurveyTableOpen"
          />
        </div>
        <InputGrid :label="t('guarantees.fieldSurveyLess')" :help="t('guarantees.help.fieldSurveyLess')">
          <GuaranteeCheckboxWithTerms
            v-model="isFieldSurveyLess"
            v-model:terms="fieldSurveyLessTerms"
            :disabled="isConfirmation"
            data-cy="guarantees-circuits-create-field-survey-less"
          />
        </InputGrid>
        <InputGrid v-if="isFieldSurveyLess" required :label="t('guarantees.fieldSurveyLessFileId')">
          <FileUpload
            required
            :file-name="inputData.fieldSurveyLessFileId"
            :disabled="isConfirmation"
            :note="t('guarantees.note.fieldSurveyLessFileFormat')"
            file-type="report"
            :rules="[rules.fileMaxSizeMB(3)]"
            data-cy="guarantees-circuits-create-field-survey-less-file-id"
            @submit="(file: File) => handleFileUpload(file)"
          />
          <template #footer>
            <div text-warning>{{ t('fileUpload.maxSizeNote', { max: 3 }) }}</div>
          </template>
        </InputGrid>
        <InputGrid
          :required="!isFieldSurveyLess"
          :label="t('guarantees.admissionApplicationRequired')"
          :help="t('guarantees.help.admissionApplicationRequired')"
        >
          <RadioForm
            v-model="constructionsDateInputData.fieldSurvey.admissionApplicationRequired"
            :options="NecessaryOptions"
            :required="!isFieldSurveyLess"
            :disabled="isConfirmation || isFieldSurveyLess"
            data-cy="guarantees-circuits-create-field-survey-admission-application-required"
            @valid="(valid: boolean) => (constructionsDateValid.fieldSurvey.admissionApplicationRequired = valid)"
          />
        </InputGrid>
        <InputGrid
          :required="!isFieldSurveyLess && !isFieldSurveyOperationAdjustment"
          :label="t('guarantees.reserveDate')"
        >
          <InputForm
            :model-value="`${formatDate(constructionsDateInputData.fieldSurvey.date)}  ${fieldSurveyReserveTime}`"
            placeholder="2024-01-01"
            disabled
            data-cy="guarantees-circuits-create-field-survey-date-time"
          />
        </InputGrid>
        <InputGrid :label="t('guarantees.operationAdjustmentSpecifiedVisitDateTime')">
          <template #help>
            <i18n-t keypath="guarantees.help.operationAdjustmentSpecifiedVisitDateTime" scope="global">
              <template #operation>
                {{ t('guarantees.fieldSurvey') }}
              </template>
              <template #linkText>
                <NuxtLink :to="GUARANTEE_LINK.TICKET_USE" target="_blank">{{ t('common.here') }}</NuxtLink>
              </template>
            </i18n-t>
          </template>
          <GuaranteeCheckboxWithTerms
            v-model="isFieldSurveyOperationAdjustment"
            v-model:terms="fieldSurveyOperationAdjustmentTerms"
            :disabled="isConfirmation || isFieldSurveyLess"
            :note="t('guarantees.note.operationAdjustmentSpecifiedVisitDateTime')"
            data-cy="guarantees-circuits-create-field-survey-operation-adjustment"
          />
        </InputGrid>
        <div class="pt-3 flex-space-between-center">
          <div class="flex-flex-start-center text-lg text-secondary">
            {{ t('guarantees.construction') }}
            <HelpTooltip class="px-2 pt-1 text-base" size="smallMiddle">
              {{ t('guarantees.help.inputInformation', { operation: t('guarantees.construction') }) }}
            </HelpTooltip>
          </div>
          <CustomButton
            icon="right-arrow"
            :text="t('guarantees.selectConstructionDateTime')"
            :width="250"
            :disabled="constructionReserveDateButtonDisabled"
            data-cy="guarantees-circuits-create-construction-reserve-date-button"
            @click="handleConstructionTableOpen"
          />
        </div>
        <InputGrid
          required
          :label="t('guarantees.admissionApplicationRequired')"
          :help="t('guarantees.help.admissionApplicationRequired')"
        >
          <RadioForm
            v-model="constructionsDateInputData.construction.admissionApplicationRequired"
            :options="NecessaryOptions"
            :disabled="isConfirmation"
            data-cy="guarantees-circuits-create-construction-admission-application-required"
            @valid="(valid: boolean) => (constructionsDateValid.construction.admissionApplicationRequired = valid)"
          />
        </InputGrid>
        <InputGrid
          :required="!isConstructionOperationAdjustment && !isFieldSurveyOperationAdjustment"
          :label="t('guarantees.reserveDate')"
        >
          <InputForm
            :model-value="`${formatDate(constructionsDateInputData.construction.date)}  ${constructionReserveTime || ''}`"
            placeholder="2024-01-01"
            disabled
            data-cy="guarantees-circuits-create-construction-date-time"
          />
        </InputGrid>
        <InputGrid :label="t('guarantees.operationAdjustmentSpecifiedVisitDateTime')">
          <template #help>
            <i18n-t keypath="guarantees.help.operationAdjustmentSpecifiedVisitDateTime" scope="global">
              <template #operation>
                {{ t('guarantees.construction') }}
              </template>
              <template #linkText>
                <NuxtLink :to="GUARANTEE_LINK.TICKET_USE" target="_blank">{{ t('common.here') }}</NuxtLink>
              </template>
            </i18n-t>
          </template>
          <GuaranteeCheckboxWithTerms
            v-model="isConstructionOperationAdjustment"
            v-model:terms="constructionOperationAdjustmentTerms"
            :disabled="isConfirmation"
            :note="t('guarantees.note.operationAdjustmentSpecifiedVisitDateTime')"
            data-cy="guarantees-circuits-create-construction-operation-adjustment"
          />
        </InputGrid>
      </InnerCard>
      <GuaranteeReserveDateDialog
        :open="!!searchDateType"
        :installation-place-code="inputData.installationPlaceCode"
        :type="searchDateType!"
        :reserved-dates="reservedDates"
        :field-survey-less="isFieldSurveyLess"
        :field-survey-date="constructionsDateInputData.fieldSurvey.date"
        :admission-application-required="constructionsDateInputData.fieldSurvey.admissionApplicationRequired === 'true'"
        @close="searchDateType = undefined"
        @submit="handleReserveDateSubmit"
      />

      <!-- 現地調査・宅内工事希望日 -->
      <EditFieldSurveyAndConstruction
        v-model:input="constructionsInputData"
        :disabled="isConfirmation"
        :field-survey-less="isFieldSurveyLess"
        @valid="valid => (constructionsValid = valid)"
      />

      <div class="flex-flex-end-center pt-2">
        <CustomButton
          icon="left-arrow"
          color="info"
          :width="180"
          :text="t('common.return')"
          data-cy="guarantees-circuits-create-return"
          @click="handleReturn"
        />
        <CustomButton
          class="ml-6"
          icon="right-arrow"
          :width="180"
          :text="isConfirmation ? t('common.create') : t('common.confirm')"
          :disabled="submitDisabled"
          data-cy="guarantees-circuits-create-submit"
          @click="isConfirmation ? handleSubmit() : handleConfirm()"
        />
      </div>
    </template>

    <GuaranteeCampaignDialog
      :guarantee="inputData"
      :open="step === Steps.Campaign"
      @submit="handleCampaignSubmit"
      @close="handleReturn"
    />

    <DialogBase
      :open="!!guarantee"
      :submit-label="t('common.moveToOrderDetail')"
      :submit-width="280"
      submit-color="info"
      @submit="navigateTo(`/tenants/${tenantId}/orders/${guarantee?.orderId}`, { replace: true })"
      @close="router.back()"
    >
      <i18n-t
        v-if="isFieldSurveyOperationAdjustment || isConstructionOperationAdjustment"
        keypath="guarantees.createTicketMessage"
        tag="div"
        scope="global"
        class="text-center text-pre-wrap"
      >
        <template #menu>{{ t('common.create') }}</template>
        <template #angora1>
          <NuxtLink :to="IPOE_LINK.LOGIN" target="_blank">{{ t('common.here') }}</NuxtLink>
        </template>
        <template #angora2>
          <NuxtLink :to="IPOE_LINK.TICKET" target="_blank">{{ t('common.here') }}</NuxtLink>
        </template>
      </i18n-t>
      <i18n-t
        v-else
        :keypath="`guarantees.${isFieldSurveyLess ? 'createdMessageFieldSurveyLess' : 'createdMessage'}`"
        tag="div"
        scope="global"
        class="text-center text-pre-wrap"
      >
        <template #detail>
          <NuxtLink
            :to="`/tenants/${tenantId}/guarantees/circuits/${guarantee?.guaranteeId}`"
            replace
            class="text-primary"
          >
            {{ t('guarantees.circuitDetail') }}
          </NuxtLink>
        </template>
      </i18n-t>
    </DialogBase>
  </CardContainer>
</template>
