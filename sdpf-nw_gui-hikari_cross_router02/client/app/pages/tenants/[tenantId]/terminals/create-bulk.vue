<script setup lang="ts">
import dayjs from 'dayjs'
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import {
  CircuitTypes,
  DocumentServiceTypes,
  TrafficReportFlowAnalyzerPlanTypes,
  SecurityOptionTypes,
  BehaviorDetectionOptionTypes,
} from '@/api/constants'
import { BehaviorDetectionPlanTypes } from '@/api/behaviorDetection/constants'
import { ServiceClosedDaysServiceTypes } from '@/api/serviceClosedDays/constants'
import {
  TERMINAL_LINK,
  MOBILE_DOCUMENT_FILES,
  BULK_CSV_MOBILE_COLUMN,
  BULK_CSV_TERMINAL_COLUMN,
  initialTerminalInputData,
  initialTerminalValid,
  initialMobileInputData,
  initialMobileValid,
  initialFiltersInputData,
  initialDhcpServerInputData,
  LanTypes,
  LansTypes,
  PicVerificationMethodTypes,
  CorporateVerificationMethodTypes,
} from '@/api/terminals/constants'
import type { DocumentFileKey, TerminalInputDataType, TerminalInputValidType } from '@/api/terminals/types'
import { TermsOfServiceBasePath } from '@/api/termsOfService/constants'
import { UNSELECTED_VALUE } from '@/components/input/constants'

const Steps = {
  CsvUpload: 1,
  PicInformation: 2,
  Confirmation: 3,
} as const

const { t } = useI18n()
const rules = useRules()
const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenantId as string)
const { loading } = useLoading()

const inputTerminals = ref<TerminalInputDataType[]>([])
const terminalValids = ref<TerminalInputValidType[]>([])

const csvFileName = ref('')
const currentStep = ref<number>(Steps.CsvUpload)

const openTermsOfServiceDialog = ref(false)
const openSuccessDialog = ref(false)
const createdTerminalBulkOrderId = ref('')

const { navigationGuard } = useNavigationGuard()

const {
  getShowPicIdentificationBackDocumentFile,
  getShowPicIdentificationAdditionalDocumentFile,
  getShowPicAuxiliaryIdentificationDocumentType,
  getMobilePostRequest,
  getTerminalBulkPostRequestWithoutMobile,
  threatDetectionPlanOptions,
  flowCollectorPlanOptions,
  behaviorDetectionPlanOptions,
  picVerificationMethodOptions,
  picIdentificationDocumentTypeOptions,
  contractIdentificationDocumentTypeOptions,
} = useTerminalInput()
const { createTerminalBulk } = useCreateTerminalBulk()
const { getSecurityHelpDesk, status: securityHelpDeskStatus, shouldShowHelpDeskCampaign } = useGetSecurityHelpDesk()

const { getSummaryVpnList, unterminatedVpnListOptions } = useGetSummaryVpnList()
const { getAllSummaryIpoeList, ipoeListOptions } = useGetAllSummaryIpoeList()
const { getAllGuaranteeList, guaranteeList } = useGetAllGuaranteeList()
const { getBreakOutListOptions } = useBreakOut()
const { getBreakOutList, breakOutList } = useGetBreakOutList()
const {
  trafficReportFlowAnalyzerTermsOfServiceAccepted,
  getTermsOfServiceAccepted: getTrafficReportFlowAnalyzerTermsOfServiceAccepted,
} = useTermsOfService(TermsOfServiceBasePath.TrafficReportFlowAnalyzer)
const { securityTermsOfServiceAccepted, getTermsOfServiceAccepted: getSecurityTermsOfServiceAccepted } =
  useTermsOfService(TermsOfServiceBasePath.Security)

const { currentSettingsBehaviorDetectionPlan, getSettingsBehaviorDetection } = useGetSettingsBehaviorDetection()
const { disabledDates, getServiceClosedDays, serviceClosedDaysFetchFailed } = useServiceClosedDays()
const { resetJpkiRequestStatus } = useGetJpkiRequestStatus()

const inputMobileData = ref(structuredClone(initialMobileInputData))
const inputMobileValid = ref(structuredClone(initialMobileValid))

// 本人確認方法選択
const picVerificationMethod = ref('')
const picVerificationMethodText = computed(
  () =>
    picVerificationMethodOptions.find(({ value }) => picVerificationMethod.value === value)?.text ??
    picVerificationMethod.value,
)
// 法人確認書類種別のテキスト
const contractIdentificationDocumentTypeText = computed(() => {
  const found = contractIdentificationDocumentTypeOptions.find(
    option => option.value === inputMobileData.value.contractIdentificationDocumentType,
  )
  return found?.text ?? ''
})
// 担当者確認書類種別のテキスト
const picIdentificationDocumentTypeText = computed(() => {
  const found = picIdentificationDocumentTypeOptions.find(
    option => option.value === inputMobileData.value.picIdentificationDocumentType,
  )
  return found?.text ?? ''
})

// 入力欄は表示しないため、表示判定は都度関数で行う
const showPicIdentificationBackDocumentFile = computed(() =>
  getShowPicIdentificationBackDocumentFile(inputMobileData.value),
)
const showPicIdentificationAdditionalDocumentFile = computed(() =>
  getShowPicIdentificationAdditionalDocumentFile(inputMobileData.value),
)
const showPicAuxiliaryIdentificationDocumentType = computed(() =>
  getShowPicAuxiliaryIdentificationDocumentType(inputMobileData.value),
)
const showHelpDeskCampaign = computed(
  () =>
    securityHelpDeskStatus.value === SecurityHelpDeskStatus.Unused &&
    inputTerminals.value.some(terminal =>
      shouldShowHelpDeskCampaign(
        terminal.threatDetection.threatDetectionPlan,
        terminal.flowCollector.flowCollectorPlan,
        terminal.behaviorDetection.behaviorDetectionPlan,
      ),
    ),
)

const { handleUploadIdentificationDocument } = useUploadDocument()
const handleFileUpload = (file: File, key: DocumentFileKey) => {
  handleUploadIdentificationDocument(file, DocumentServiceTypes.Mobile, (id: string) => {
    inputMobileData.value[key] = id
    inputMobileValid.value[key] = !!id
  })
}

// 本人確認方法が変更されたときの処理
const handlePicVerificationMethodChange = (value: string) => {
  picVerificationMethod.value = value
  const isMyNumberCard = value === PicVerificationMethodTypes.MyNumberCard

  // バリデーション状態の設定
  // 証明書番号は表示せずCSVから読み取り。必要な場合のみチェック
  inputMobileValid.value.jpkiRequestId = !isMyNumberCard
  inputMobileValid.value.picIdentificationFrontDocumentId = isMyNumberCard
  inputMobileValid.value.picIdentificationBackDocumentId =
    isMyNumberCard || !showPicIdentificationBackDocumentFile.value
  inputMobileValid.value.picIdentificationAdditionalDocumentId =
    isMyNumberCard || !showPicIdentificationAdditionalDocumentFile.value
  inputMobileValid.value.picAuxiliaryIdentificationDocumentId =
    isMyNumberCard || !showPicAuxiliaryIdentificationDocumentType.value
}

const requiredTrafficReportFlowAnalyzer = computed(
  () =>
    inputTerminals.value.some(
      terminal =>
        terminal.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan !==
        TrafficReportFlowAnalyzerPlanTypes.NoSubscription,
    ) && !trafficReportFlowAnalyzerTermsOfServiceAccepted.value,
)
const requiredSecurity = computed(
  () =>
    inputTerminals.value.some(
      terminal =>
        [terminal.threatDetection.threatDetectionPlan, terminal.flowCollector.flowCollectorPlan].some(
          plan => plan !== SecurityOptionTypes.NoSubscription,
        ) || terminal.behaviorDetection.behaviorDetectionPlan !== BehaviorDetectionOptionTypes.NoSubscription,
    ) && !securityTermsOfServiceAccepted.value,
)
const requiredBehaviorDetection = computed(() => {
  const hasBehaviorDetection = inputTerminals.value.some(
    terminal => terminal.behaviorDetection.behaviorDetectionPlan !== BehaviorDetectionOptionTypes.NoSubscription,
  )
  return hasBehaviorDetection && currentSettingsBehaviorDetectionPlan.value === BehaviorDetectionPlanTypes.None
})

const switchConfirm = async () => {
  await getTrafficReportFlowAnalyzerTermsOfServiceAccepted()
  await getSecurityTermsOfServiceAccepted()
  await getSecurityHelpDesk()
  await getSettingsBehaviorDetection()

  openTermsOfServiceDialog.value =
    requiredTrafficReportFlowAnalyzer.value || requiredSecurity.value || requiredBehaviorDetection.value
  if (!openTermsOfServiceDialog.value) {
    currentStep.value = Steps.Confirmation
  }
}
const handleSubmit = async () => {
  const request = {
    mobile: getMobilePostRequest(inputMobileData.value),
    terminals: inputTerminals.value.map(terminal => {
      const formattedTerminal = getTerminalBulkPostRequestWithoutMobile(terminal)
      return Object.assign(formattedTerminal, {
        trafficReportFlowAnalyzer: terminal.trafficReportFlowAnalyzer,
      })
    }),
  }
  const response = await createTerminalBulk(request)
  createdTerminalBulkOrderId.value = response.bulkOrderId
  openSuccessDialog.value = true
  navigationGuard(false)
}

const handleCancel = () => {
  if (currentStep.value === Steps.CsvUpload) {
    router.back()
  } else {
    currentStep.value--
  }
}

const submit = computed(() => {
  if (currentStep.value === Steps.CsvUpload) {
    return {
      click: () => {
        currentStep.value = Steps.PicInformation
      },
      text: t('common.next'),
      disabled:
        !csvFileName.value ||
        !inputMobileValid.value.contractIdentificationDocumentId ||
        !inputMobileValid.value.picEmploymentDocumentId ||
        serviceClosedDaysFetchFailed.value,
    }
  }

  if (currentStep.value === Steps.PicInformation) {
    const picInformationKeys = [...MOBILE_DOCUMENT_FILES, 'jpkiRequestId'] as const
    return {
      click: switchConfirm,
      text: t('common.confirm'),
      disabled: picInformationKeys.some(key => !inputMobileValid.value[key]) || serviceClosedDaysFetchFailed.value,
    }
  }

  // Steps.Confirmation
  return {
    click: handleSubmit,
    text: t('common.create'),
    disabled: serviceClosedDaysFetchFailed.value,
  }
})

const getMobileInputData = (row: string) => {
  const mobile = row.split(',').reduce(
    (acc, cur, index) => {
      if (BULK_CSV_MOBILE_COLUMN[index] === 'picIdentificationDocumentType') {
        return { ...acc, picIdentificationDocumentType: cur }
      }
      if (BULK_CSV_MOBILE_COLUMN[index] === 'picDateOfBirth') {
        const picDateOfBirth = cur ? dayjs(cur).format('YYYY-MM-DD') : ''
        return { ...acc, picDateOfBirth }
      }
      if (BULK_CSV_MOBILE_COLUMN[index] === 'rat') {
        return { ...acc, rat: cur === 'lte' ? 'lte' : 'auto' }
      }
      if (BULK_CSV_MOBILE_COLUMN[index] === 'contractIdentificationDocumentType') {
        return {
          ...acc,
          contractIdentificationDocumentType: cur,
          corporateVerificationMethod: !cur
            ? CorporateVerificationMethodTypes.CorporateNumberVerification
            : CorporateVerificationMethodTypes.InPersonVerification,
        }
      }
      if (BULK_CSV_MOBILE_COLUMN[index]) {
        const data = ['callDetailDesired', 'customerReceiptRequired'].includes(BULK_CSV_MOBILE_COLUMN[index])
          ? cur.toLowerCase()
          : cur
        return { ...acc, [BULK_CSV_MOBILE_COLUMN[index]]: data }
      }
      return acc
    },
    { ...initialMobileInputData },
  )
  return mobile
}

const processLanData = (acc: TerminalInputDataType, cur: string, column: string) => {
  if (column === 'lanType') {
    return { ...acc, lanType: cur }
  }
  if (column === 'lanIpv4AddressPrefixLength') {
    const address = cur.split('/')
    const lans =
      address.length > 1
        ? [
            {
              type: LansTypes.Primary,
              // TODO: #14887 画面表示までは2固定
              portNumber: acc.lanType === LanTypes.RoutedPort ? '2' : '',
              ipv4Address: address[0] || '',
              ipv4PrefixLength: address[1] || '',
              vpnRouting: 'true',
              vpnNats: [],
              dhcpServer: { ...initialDhcpServerInputData },
              lanInFilters: { ...initialFiltersInputData },
            },
          ]
        : []
    return { ...acc, lans }
  }
  return acc
}

const processDhcpServerData = (acc: TerminalInputDataType, cur: string, column: string) => {
  const existingLan = acc.lans[0] || {
    type: LansTypes.Primary,
    portNumber: '',
    ipv4Address: '',
    ipv4PrefixLength: '',
    vpnRouting: 'true',
    vpnNats: [],
    dhcpServer: initialDhcpServerInputData,
    lanInFilters: { ...initialFiltersInputData },
  }
  if (column === 'dhcpServerIpv4AddressRangesStart') {
    if (!cur) {
      return acc
    }
    const ipv4AddressRanges = cur.split(' ').map<[string, string]>(start => [start, ''])
    const dhcpServer = { ...initialDhcpServerInputData, ipv4AddressRanges }
    return { ...acc, lans: [{ ...existingLan, dhcpServer }] }
  }

  if (column === 'dhcpServerIpv4AddressRangesEnd') {
    if (!cur || !acc.lans[0]?.dhcpServer.ipv4AddressRanges?.length) {
      return acc
    }
    const ipv4AddressRanges = cur
      .split(' ')
      .map<[string, string]>((end, idx) => [acc.lans[0]?.dhcpServer.ipv4AddressRanges?.[idx]?.[0] ?? '', end])
    return { ...acc, lans: [{ ...existingLan, dhcpServer: { ...existingLan.dhcpServer, ipv4AddressRanges } }] }
  }

  if (column === 'dhcpServerDomain') {
    const dhcpServer = { ...existingLan.dhcpServer, domain: cur }
    return { ...acc, lans: [{ ...existingLan, dhcpServer }] }
  }

  if (column === 'dhcpServerPrimaryDnsServer') {
    const dhcpServer = { ...existingLan.dhcpServer, primaryDnsServer: cur }
    return { ...acc, lans: [{ ...existingLan, dhcpServer }] }
  }

  if (column === 'dhcpServerSecondaryDnsServer') {
    const dhcpServer = { ...existingLan.dhcpServer, secondaryDnsServer: cur }
    return { ...acc, lans: [{ ...existingLan, dhcpServer }] }
  }

  if (column === 'dhcpRelayServersServerIpv4Address') {
    return { ...acc, dhcpRelayServers: !cur ? [] : cur.split(' ') }
  }

  return acc
}

const processCsvColumn = (acc: TerminalInputDataType, cur: string, index: number) => {
  const column = BULK_CSV_TERMINAL_COLUMN[index]
  if (!column) {
    return acc
  }
  if (column === 'breakOut') {
    const breakOut = cur
      ? getBreakOutListOptions(cur.split(' '), breakOutList.value).map(opt => opt.value)
      : [UNSELECTED_VALUE]
    return { ...acc, breakOut }
  }

  if (column === 'interceptDnsServers') {
    return { ...acc, interceptDnsServers: cur ? cur.split(' ') : [] }
  }

  if (column === 'deliveryDate') {
    const deliveryDate = cur ? dayjs(cur).format('YYYY-MM-DD') : ''
    return { ...acc, deliveryDate }
  }

  if (column === 'ipoeId') {
    if (cur) {
      return {
        ...acc,
        ipoeId: cur,
        primaryCircuitType: CircuitTypes.Ipoe,
        secondaryCircuitType: CircuitTypes.Mobile,
      }
    }
    return { ...acc, primaryCircuitType: CircuitTypes.Mobile, secondaryCircuitType: '' }
  }

  if (column === 'vpnId') {
    return { ...acc, vpnId: cur || UNSELECTED_VALUE }
  }

  if (column.startsWith('lan') || column.startsWith('dhcp')) {
    const lanResult = processLanData(acc, cur, column)
    if (!isEqual(lanResult, acc)) {
      return lanResult
    }

    const dhcpResult = processDhcpServerData(acc, cur, column)
    if (!isEqual(dhcpResult, acc)) {
      return dhcpResult
    }
  }

  if (column === 'defaultGatewayNexthopNetwork') {
    return { ...acc, defaultGateway: { ...acc.defaultGateway, nexthopNetwork: cur } }
  }

  if (column === 'defaultGatewayNexthopIpv4Address') {
    return { ...acc, defaultGateway: { ...acc.defaultGateway, nexthopIpv4Address: cur } }
  }

  if (column === 'defaultGatewayVpnRouting') {
    return { ...acc, defaultGateway: { ...acc.defaultGateway, vpnRouting: cur.toLowerCase() } }
  }

  if (column === 'guaranteeId') {
    if (cur) {
      return {
        ...acc,
        guarantee: { ...acc.guarantee, guaranteeId: cur },
        primaryCircuitType: CircuitTypes.Guarantee,
        secondaryCircuitType: acc.ipoeId ? CircuitTypes.Ipoe : CircuitTypes.Mobile,
      }
    }
    return {
      ...acc,
      primaryCircuitType: acc.ipoeId ? CircuitTypes.Ipoe : CircuitTypes.Mobile,
      secondaryCircuitType: acc.ipoeId ? CircuitTypes.Mobile : '',
    }
  }

  if (['vpnActConnectedIpv4Prefix', 'vpnSbyConnectedIpv4Prefix'].includes(column)) {
    return { ...acc, guarantee: { ...acc.guarantee, [column]: cur } }
  }
  if (column === 'trafficReportFlowAnalyzerPlan') {
    return {
      ...acc,
      trafficReportFlowAnalyzer: { ...acc.trafficReportFlowAnalyzer, trafficReportFlowAnalyzerPlan: cur },
    }
  }
  if (column === 'trafficReportFlowAnalyzerAlert') {
    return {
      ...acc,
      trafficReportFlowAnalyzer: {
        ...acc.trafficReportFlowAnalyzer,
        trafficReportFlowAnalyzerAlert: cur.toLowerCase(),
      },
    }
  }
  if (column === 'threatDetectionPlan') {
    const threatDetectionPlan = threatDetectionPlanOptions.find(opt => opt.value === cur)?.value
    return {
      ...acc,
      threatDetection: { threatDetectionPlan: threatDetectionPlan ?? SecurityOptionTypes.NoSubscription },
    }
  }

  if (column === 'flowCollectorPlan') {
    const flowCollectorPlan = flowCollectorPlanOptions.find(opt => opt.value === cur)?.value
    return { ...acc, flowCollector: { flowCollectorPlan: flowCollectorPlan ?? SecurityOptionTypes.NoSubscription } }
  }

  if (column === 'behaviorDetectionPlan') {
    const behaviorDetectionPlan = behaviorDetectionPlanOptions.find(opt => opt.value === cur)?.value
    return {
      ...acc,
      behaviorDetection: {
        behaviorDetectionPlan: behaviorDetectionPlan ?? BehaviorDetectionOptionTypes.NoSubscription,
      },
    }
  }
  return { ...acc, [column]: cur }
}

const getTerminalInputData = (rows: string[]) => {
  const terminals = rows.map(row =>
    row.split(',').reduce((acc: TerminalInputDataType, cur: string, index: number) => {
      return processCsvColumn(acc, cur, index)
    }, structuredClone(initialTerminalInputData)),
  )

  return terminals
}

const applicationInformationUpload = (file: File) => {
  csvFileName.value = file.name
  navigationGuard(true)

  // FileReaderのインスタンスを作成する
  const fileReader = new FileReader()
  // 読み込んだファイルの中身を取得する
  fileReader.readAsText(file)
  fileReader.onload = () => {
    // ファイル読み込み
    const fileResult = (fileReader.result as string).split(/\r\n|\n|\r/)
    // CSV 再アップロード時に前回のバリデーション結果が残らないよう初期化
    resetJpkiRequestStatus()
    inputMobileValid.value = structuredClone(initialMobileValid)
    inputMobileData.value = getMobileInputData(fileResult?.[1] ?? '')
    inputTerminals.value = getTerminalInputData(fileResult.slice(3).filter(result => !!result))
    terminalValids.value = inputTerminals.value.map(() => structuredClone(initialTerminalValid))
    // 法人確認書類種が空の時はファイルアップロード不要
    inputMobileValid.value.contractIdentificationDocumentId = !contractIdentificationDocumentTypeText.value

    // picIdentificationDocumentType が空の場合、マイナンバーカードによる本人確認を選択
    if (!inputMobileData.value.picIdentificationDocumentType) {
      handlePicVerificationMethodChange(PicVerificationMethodTypes.MyNumberCard)
    } else {
      handlePicVerificationMethodChange(PicVerificationMethodTypes.InPersonVerification)
    }
  }
}

onBeforeMount(() => {
  resetJpkiRequestStatus()
  getSummaryVpnList()
  getAllSummaryIpoeList()
  getAllGuaranteeList()
  getBreakOutList()
  getServiceClosedDays(ServiceClosedDaysServiceTypes.Terminal)
})
</script>

<template>
  <CardContainer>
    <!-- Step 1: CSVアップロード画面 -->
    <template v-if="currentStep === Steps.CsvUpload">
      <InputGrid required :label="t('terminals.applicationInformation')">
        <FileUpload
          :file-name="csvFileName"
          required
          file-type="csv"
          data-cy="terminal-create-bulk-application-information"
          @submit="applicationInformationUpload"
        />
      </InputGrid>
      <template v-if="!!csvFileName">
        <template v-if="!!contractIdentificationDocumentTypeText">
          <DetailGrid>
            <div>{{ t('terminals.contractIdentificationDocumentType') }}</div>
            <div>{{ contractIdentificationDocumentTypeText }}</div>
          </DetailGrid>
          <InputGrid required :label="t('terminals.contractIdentificationDocumentId')">
            <FileUpload
              :file-name="inputMobileData.contractIdentificationDocumentId"
              required
              :rules="[rules.fileMaxSizeMB(10)]"
              data-cy="terminal-create-bulk-contract-identification-document-id"
              @submit="(file: File) => handleFileUpload(file, 'contractIdentificationDocumentId')"
            />
            <template #footer>
              <div text-warning>{{ t('fileUpload.maxSizeNote', { max: 10 }) }}</div>
            </template>
          </InputGrid>
        </template>
        <InputGrid required :label="t('terminals.picEmploymentDocumentId')">
          <FileUpload
            :file-name="inputMobileData.picEmploymentDocumentId"
            required
            :rules="[rules.fileMaxSizeMB(10)]"
            data-cy="terminal-create-bulk-pic-employment-document-id"
            @submit="(file: File) => handleFileUpload(file, 'picEmploymentDocumentId')"
          />
          <template #footer>
            <div text-warning>{{ t('fileUpload.maxSizeNote', { max: 10 }) }}</div>
          </template>
        </InputGrid>
      </template>
    </template>

    <!-- Step 2: 本人確認画面 -->
    <template v-if="currentStep === Steps.PicInformation">
      <!-- 本人確認方法選択 -->
      <InnerCard :title="t('terminals.picVerificationMethod')">
        <DetailGrid :label-width="265">
          <div>{{ t('terminals.picVerificationMethodLabel') }}</div>
          <div>{{ picVerificationMethodText }}</div>
        </DetailGrid>
      </InnerCard>

      <!-- マイナンバーカードによる本人確認 -->
      <template v-if="picVerificationMethod === PicVerificationMethodTypes.MyNumberCard">
        <div class="my-4 text-pre-wrap">
          {{ t('terminals.message.bulkPicInformationWithMyNumberCardInstruction') }}
        </div>
        <JpkiQrCode
          v-model:jpki-request-id="inputMobileData.jpkiRequestId"
          @valid="(valid: boolean) => (inputMobileValid.jpkiRequestId = valid)"
        />
      </template>

      <!-- 担当営業による対面確認 -->
      <template v-if="picVerificationMethod === PicVerificationMethodTypes.InPersonVerification">
        <DetailGrid>
          <div>{{ t('terminals.picIdentificationDocumentType') }}</div>
          <div>{{ picIdentificationDocumentTypeText }}</div>
        </DetailGrid>
        <InputGrid required :label="t('terminals.picIdentificationFrontDocumentId')">
          <FileUpload
            :file-name="inputMobileData.picIdentificationFrontDocumentId"
            required
            data-cy="terminal-create-bulk-pic-identification-front-document-id"
            @submit="(file: File) => handleFileUpload(file, 'picIdentificationFrontDocumentId')"
          />
        </InputGrid>
        <InputGrid
          v-if="showPicIdentificationBackDocumentFile"
          required
          :label="t('terminals.picIdentificationBackDocumentId')"
        >
          <FileUpload
            :file-name="inputMobileData.picIdentificationBackDocumentId"
            required
            data-cy="terminal-create-bulk-pic-identification-back-document-id"
            @submit="(file: File) => handleFileUpload(file, 'picIdentificationBackDocumentId')"
          />
        </InputGrid>
        <InputGrid
          v-if="showPicIdentificationAdditionalDocumentFile"
          required
          :label="t('terminals.picIdentificationAdditionalDocumentId')"
        >
          <FileUpload
            :file-name="inputMobileData.picIdentificationAdditionalDocumentId"
            required
            data-cy="terminal-create-bulk-pic-identification-additional-document-id"
            @submit="(file: File) => handleFileUpload(file, 'picIdentificationAdditionalDocumentId')"
          />
        </InputGrid>
        <InputGrid
          v-if="showPicAuxiliaryIdentificationDocumentType"
          required
          :label="t('terminals.picAuxiliaryIdentificationDocumentId')"
        >
          <FileUpload
            :file-name="inputMobileData.picAuxiliaryIdentificationDocumentId"
            required
            data-cy="terminal-create-bulk-pic-auxiliary-identification-document-id"
            @submit="(file: File) => handleFileUpload(file, 'picAuxiliaryIdentificationDocumentId')"
          />
        </InputGrid>
      </template>
    </template>

    <!-- Step 3: 確認画面 -->
    <template v-if="currentStep === Steps.Confirmation">
      <div class="mb-3">{{ t('confirm.create') }}</div>
      <CollapseCard :title="t('terminals.mobileInformation')">
        <template #help>
          <NuxtLink :to="TERMINAL_LINK.MOBILE" target="_blank">{{ TERMINAL_LINK.MOBILE }}</NuxtLink>
        </template>
        <EditTerminalMobile v-model:mobile="inputMobileData" v-model:valid="inputMobileValid" disabled />
        <div class="mt-5 mb-1 text-secondary text-xl">{{ t('terminals.picInformation') }}</div>
        <EditTerminalMobilePicInformation v-model:mobile="inputMobileData" v-model:valid="inputMobileValid" disabled />
      </CollapseCard>
      <CollapseCard
        v-for="(terminal, index) in inputTerminals"
        :key="`bulk-terminal-${index}`"
        :title="`${t('sideBar.terminal')} ${index + 1}`"
      >
        <EditTerminalData
          :terminal="terminal"
          :valid="terminalValids[index] ?? initialTerminalValid"
          :break-out-list="breakOutList"
          :guarantee-list="guaranteeList.guarantees"
          :ipoe-list-options="ipoeListOptions"
          :vpn-list-options="unterminatedVpnListOptions"
          :customer-note-list="[]"
          :disabled-dates="disabledDates"
          :service-closed-days-fetch-failed="serviceClosedDaysFetchFailed"
          disabled
          is-bulk
        />
      </CollapseCard>
    </template>

    <div class="flex-flex-end-center pt-12">
      <CustomButton
        :text="currentStep === Steps.CsvUpload ? t('common.cancel') : t('common.return')"
        :width="180"
        color="info"
        data-cy="terminal-create-bulk-cancel-button"
        @click="handleCancel"
      />
      <CustomButton
        class="ml-6"
        icon="right-arrow"
        :width="180"
        :disabled="submit.disabled || loading"
        :text="submit.text"
        data-cy="terminal-create-bulk-submit-button"
        @click="submit.click"
      />
    </div>
    <TermsOfServiceConfirmDialog
      :open="openTermsOfServiceDialog"
      :tenant-id="tenantId"
      :show-traffic-report-flow-analyzer="requiredTrafficReportFlowAnalyzer"
      :show-security="requiredSecurity"
      :show-behavior-detection="requiredBehaviorDetection"
      @close="openTermsOfServiceDialog = false"
    />
    <TerminalSuccessDialog
      :open="openSuccessDialog"
      :bulk-order-id="createdTerminalBulkOrderId"
      :show-help-desk-campaign="showHelpDeskCampaign"
      @close="router.back()"
    />
  </CardContainer>
</template>
