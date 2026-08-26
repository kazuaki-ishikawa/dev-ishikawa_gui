<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  SELECTABLE_LINE_MAX_COUNTS,
  RinkLineAccessTypes,
  RinkLineCreateCsvIndex,
  RinkLineApplicationTypes,
  RinkLineAvailableDateOrderTypes,
  initialRinkLineListInputData,
  initialRinkLineListValid,
  initialShippingInfoInputData,
  initialShippingInfoValid,
} from '@/api/rinkLines/constants'
import type { InitialRinkLineListInputDataType, RinkLineAvailableDateApplicationInfoType } from '@/api/rinkLines/types'
import { UNSELECTED_VALUE } from '@/components/input/constants'
import { RinkMobilePages, TenantPages } from '@/components/sidebar/constants'

const Steps = {
  BasicLineInput: 1,
  ShippingInformationInput: 2,
  Confirmation: 3,
}

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { navigationGuard } = useNavigationGuard()
navigationGuard(true)

const { loading } = useLoading()
const { downloadLocalPdfOrExcel } = useDownloadLocalPdfOrExcel()

const step = ref(Steps.BasicLineInput)
const isConfirmation = computed({
  get: () => step.value === Steps.Confirmation,
  set: (value: boolean) => {
    step.value = value ? Steps.Confirmation : Steps.ShippingInformationInput
  },
})

const rinkMobileId = ref('')
const applicationType = ref('')

// 配送先情報
const shippingInfoInputData = ref(structuredClone(initialShippingInfoInputData))
const shippingInfoValid = ref(structuredClone(initialShippingInfoValid))

// 初回回線情報
const basicLineInputData = ref<typeof initialRinkLineListInputData>(structuredClone(initialRinkLineListInputData))
const basicLineValid = ref<typeof initialRinkLineListValid>(structuredClone(initialRinkLineListValid))
const lineCounts = ref({ input: '', valid: false })

// 回線情報
const lineInputData = ref<Array<typeof initialRinkLineListInputData>>([])
const applicationInfo = ref<RinkLineAvailableDateApplicationInfoType[]>([])

const { rinkMobileIdOptionsIncludingScheduled, getRinkConnectionListIncludingScheduled } = useGetRinkConnectionList()
const { createRinkLine } = useCreateRinkLine()
const { planOptions, deviceOptions, getAvailablePlanDeviceList } = useGetAvailablePlanDeviceList()
const { availableLinePrefix, getRinkConnectionLinePrefix } = useGetRinkConnectionLinePrefix()
const { disabledDates, postRinkLineAvailableDate } = usePostRinkLineAvailableDate()
const { duringReceptionHours } = useRinkConnections()

const submitDisabled = computed(() => {
  const basicStepValid =
    step.value !== Steps.BasicLineInput || (Object.values(basicLineValid.value).every(v => v) && lineCounts.value.valid)
  const shippingStepValid =
    step.value !== Steps.ShippingInformationInput ||
    (Object.values(shippingInfoValid.value).every(v => v) && lineInputData.value.length > 0)
  return (
    applicationType.value !== RinkLineApplicationTypes.Form ||
    !duringReceptionHours.value ||
    loading.value ||
    !basicStepValid ||
    !shippingStepValid
  )
})
const rinkMobileIdDisabled = computed(() => !!route.query.rinkMobileId)

const handleDownloadLocalPdfOrExcel = () => {
  downloadLocalPdfOrExcel({
    path: '/rink-mobile/line-create/line-create.xlsx',
    extension: 'xlsx',
    fileName: 'create_line_sample.xlsx',
  })
}
const handleUploadApplicationCsv = (file: File) => {
  // FileReaderのインスタンスを作成する
  const fileReader = new FileReader()
  // 読み込んだファイルの中身を取得する
  fileReader.readAsText(file)
  fileReader.onload = () => {
    // ファイル読み込み
    const fileResult = (fileReader.result as string).split(/\r\n|\n|\r/)
    lineInputData.value = fileResult.reduce((acc, cur, index) => {
      const line = cur.split(',')
      // header行はスキップ
      if (index === 0) {
        return acc
      }

      const accessType =
        line?.[RinkLineCreateCsvIndex.AccessType]?.trim() === RinkLineAccessTypes.Lte
          ? RinkLineAccessTypes.Lte
          : RinkLineAccessTypes.Nsa5g
      const planLimitAlias = planOptions.value[accessType].find(
        plan => plan.text === line?.[RinkLineCreateCsvIndex.Plan]?.trim(),
      )?.value
      const deviceNameAlias = deviceOptions.value.find(
        device => device.text === line?.[RinkLineCreateCsvIndex.DeviceName]?.trim(),
      )?.value
      const authenticationId = line?.[RinkLineCreateCsvIndex.AuthenticationId]?.trim() || ''
      const authenticationPassword = line?.[RinkLineCreateCsvIndex.AuthenticationPassword]?.trim() || ''
      const actIpAddress = line?.[RinkLineCreateCsvIndex.ActIpAddress]?.trim() || ''
      if (!planLimitAlias || !authenticationId || !authenticationPassword || !actIpAddress) {
        // 空の場合はスキップ
        return acc
      }
      acc.push({
        planLimitAlias,
        accessType,
        deviceNameAlias: deviceNameAlias || UNSELECTED_VALUE,
        authenticationId,
        authenticationPassword,
        actIpAddress,
        sbyIpAddress: line?.[RinkLineCreateCsvIndex.SbyIpAddress]?.trim() || '',
      })
      return acc
    }, [] as Array<InitialRinkLineListInputDataType>)

    if (lineInputData.value?.[0]) {
      // lineInputData に値があれば basicLineInputData に1件目をセットして次の画面に進む
      basicLineInputData.value = { ...lineInputData.value[0] }
      basicLineValid.value = Object.keys(initialRinkLineListValid).reduce(
        (acc, key) => {
          return { ...acc, [key]: true }
        },
        { ...initialRinkLineListValid },
      )
      lineCounts.value = { input: `${lineInputData.value.length}`, valid: true }
      // 次のステップへ
      step.value = Steps.ShippingInformationInput
    } else {
      // １件もない場合は basicLineInputData を初期化して終了
      basicLineInputData.value = structuredClone(initialRinkLineListInputData)
      basicLineValid.value = structuredClone(initialRinkLineListValid)
      lineCounts.value = { input: '', valid: false }
    }

    applicationType.value = RinkLineApplicationTypes.Form
  }
}

const handleSubmit = async () => {
  await createRinkLine(rinkMobileId.value, {
    ...shippingInfoInputData.value,
    linesList: lineInputData.value.map((line, index) => ({
      ...line,
      lineIndex: index + 1,
      deviceNameAlias: line.deviceNameAlias === UNSELECTED_VALUE ? undefined : line.deviceNameAlias,
      sbyIpAddress: line.sbyIpAddress || undefined,
    })),
  })
  // 作成後はrinkMobileIdで絞り込んだ回線一覧に一旦戻る
  navigationGuard(false)
  await navigateTo(
    {
      path: `/tenants/${route.params.tenantId}/${TenantPages.RinkMobile}/${RinkMobilePages.Lines}/edit`,
      query: { rinkMobileId: rinkMobileId.value },
    },
    { replace: true },
  )
}

// 割り当て可能なIPアドレスの範囲を昇順で返す
const getRanges = (addresses: string[]) => {
  // getNextIpAddress が candidate より後の最初の range へジャンプする際、昇順ソート済みであることが前提のためソートする
  return addresses.map(getIpAddressRange).sort((a, b) => a.start - b.start)
}
const getNextIpAddress = (current: number, ranges: Array<{ start: number; end: number }>) => {
  // 直前に割り当てたIPアドレスを元に次に割り当てるIPアドレスの候補を計算する
  const candidate = (current + 1) >>> 0
  // 候補がどこかのrangeに含まれていた場合はそのまま採用する
  if (ranges.some(range => range.start <= candidate && candidate <= range.end)) {
    return candidate
  }
  // 候補がどのrangeにも含まれていない場合は、次のrangeの開始位置に飛ぶ
  // 次のrangeがなければ範囲外の候補をそのまま採用する
  const jump = ranges.find(range => candidate < range.start)?.start
  return jump !== undefined ? jump : candidate
}
const allocateIpAddresses = (baseAddress: string, count: number, ranges: Array<{ start: number; end: number }>) => {
  const [ip, subnet] = baseAddress.split('/')

  if (!ip || !subnet || count <= 0) {
    return []
  }
  const baseNum = ip2Long(ip) >>> 0

  return Array.from({ length: count }).reduce<{ current: number; results: string[] }>(
    (acc, _, index) => {
      const next = index === 0 ? acc.current : getNextIpAddress(acc.current, ranges)

      acc.results.push(
        `${[
          Math.floor(next / 16777216) % 256,
          Math.floor(next / 65536) % 256,
          Math.floor(next / 256) % 256,
          next % 256,
        ].join('.')}/${subnet}`,
      )

      return { current: next, results: acc.results }
    },
    { current: baseNum, results: [] },
  ).results
}
const availableLinePrefixRanges = computed(() => {
  const actRanges = getRanges(availableLinePrefix.value.lineActPrefix)
  const sbyRanges = getRanges(availableLinePrefix.value.lineSbyPrefix)
  return { actRanges, sbyRanges }
})

const handleMoveToShippingInformationInput = () => {
  const count = Number(lineCounts.value.input)
  const actIpAddress = allocateIpAddresses(
    basicLineInputData.value.actIpAddress,
    count,
    availableLinePrefixRanges.value.actRanges,
  )
  const sbyIpAddress = allocateIpAddresses(
    basicLineInputData.value.sbyIpAddress,
    count,
    availableLinePrefixRanges.value.sbyRanges,
  )
  lineInputData.value = [...Array(count)].map((_, index) => {
    return {
      ...basicLineInputData.value,
      actIpAddress: actIpAddress[index] ?? '',
      sbyIpAddress: sbyIpAddress[index] ?? '',
    }
  })
  step.value++
}
const submitButton = computed(() => {
  switch (step.value) {
    case Steps.ShippingInformationInput:
      return { text: t('common.confirm'), click: () => step.value++ }
    case Steps.Confirmation:
      return { text: t('common.application'), click: handleSubmit }
    default:
      return { text: t('common.next'), click: handleMoveToShippingInformationInput }
  }
})

watch(step, () => window.scrollTo({ top: 0, behavior: 'smooth' }))
watch(lineInputData, next => {
  if (next.length === 0) {
    // 空になった場合は applicationInfo も空になる
    applicationInfo.value = []
    return
  }

  // 入力された値から applicationInfo を作成する
  const deviceNameAliasMap = next.reduce((acc, cur) => {
    if (cur.deviceNameAlias) {
      const currentQuantity = acc.get(cur.deviceNameAlias) || 0
      acc.set(cur.deviceNameAlias, currentQuantity + 1)
    }
    return acc
  }, new Map<string, number>())

  applicationInfo.value = Array.from(deviceNameAliasMap, ([deviceNameAlias, quantity]) =>
    deviceNameAlias === UNSELECTED_VALUE ? { quantity } : { deviceNameAlias, quantity },
  )
})
watch(rinkMobileId, () => {
  if (rinkMobileId.value) {
    getAvailablePlanDeviceList(rinkMobileId.value)
    getRinkConnectionLinePrefix(rinkMobileId.value)
  }
  // rinkMobileId が変更されたら、入力情報は全て初期化
  lineInputData.value = []
  shippingInfoInputData.value = structuredClone(initialShippingInfoInputData)
  shippingInfoValid.value = structuredClone(initialShippingInfoValid)
  basicLineInputData.value = structuredClone(initialRinkLineListInputData)
  basicLineValid.value = structuredClone(initialRinkLineListValid)
  lineCounts.value = { input: '', valid: false }
})
watch([rinkMobileId, applicationInfo], () => {
  if (rinkMobileId.value && applicationInfo.value.length > 0) {
    postRinkLineAvailableDate({
      orderType: RinkLineAvailableDateOrderTypes.CreateLineLines,
      rinkMobileId: rinkMobileId.value,
      applicationInfo: applicationInfo.value,
    })
  }
})

onBeforeMount(async () => {
  rinkMobileId.value = (route.query.rinkMobileId as string) || ''
  getRinkConnectionListIncludingScheduled()
})
</script>

<template>
  <CardContainer>
    <div v-if="isConfirmation">{{ t('confirm.application') }}</div>
    <div
      v-if="!duringReceptionHours"
      class="mb-2 text-warning text-pre-wrap"
      data-cy="rink-mobile-lines-create-outside-reception-hour"
    >
      {{ t('rinkConnections.message.outsideReceptionHour') }}
    </div>
    <InnerCard>
      <InputGrid required :label="t('rinkConnections.rinkMobileId')" :label-width="180">
        <SelectForm
          v-model="rinkMobileId"
          required
          :options="rinkMobileIdOptionsIncludingScheduled"
          size="middle"
          placeholder="Z000000001"
          :disabled="step > Steps.BasicLineInput || rinkMobileIdDisabled || loading"
          data-cy="rink-mobile-lines-create-rink-mobile-id"
        />
      </InputGrid>
    </InnerCard>

    <!-- 申込方法選択 -->
    <EditApplicationType
      v-if="!!rinkMobileId && step <= Steps.BasicLineInput"
      v-model="applicationType"
      :disabled="loading"
      @download:excel="handleDownloadLocalPdfOrExcel"
      @upload:csv="handleUploadApplicationCsv"
    />

    <template v-if="applicationType === RinkLineApplicationTypes.Form">
      <template v-if="step === Steps.BasicLineInput">
        <InnerCard :title="t('rinkConnections.tabs.lines')">
          <EditLineInput
            v-model="basicLineInputData"
            v-model:valid="basicLineValid"
            :disabled="isConfirmation || loading"
            :plan-options="planOptions"
            :device-options="deviceOptions"
            :available-line-prefix="availableLinePrefix"
          />
        </InnerCard>
        <InnerCard>
          <InputGrid :label="t('rinkLines.applicationLineCounts')" required>
            <SelectForm
              v-model="lineCounts.input"
              placeholder="1"
              :options="[...Array(SELECTABLE_LINE_MAX_COUNTS)].map((_, i) => ({ text: `${i + 1}`, value: `${i + 1}` }))"
              required
              data-cy="rink-mobile-lines-create-line-counts"
              @valid="(valid: boolean) => (lineCounts.valid = valid)"
            />
          </InputGrid>
        </InnerCard>
      </template>
      <template v-if="step >= Steps.ShippingInformationInput">
        <!-- 回線テーブル -->
        <EditLineList
          v-model="lineInputData"
          :disabled="isConfirmation || loading"
          :plan-options="planOptions"
          :available-line-prefix="availableLinePrefix"
          :device-options="deviceOptions"
        />
        <!-- 配送先情報 -->
        <EditShippingInformation
          v-model="shippingInfoInputData"
          v-model:valid="shippingInfoValid"
          :disabled="isConfirmation"
          :disabled-dates="disabledDates"
        />
      </template>
    </template>

    <div class="mt-8 grid-flow-col justify-end ga-4">
      <CustomButton
        :icon="step === Steps.BasicLineInput ? 'right-arrow' : 'left-arrow'"
        color="info"
        :width="180"
        :text="step === Steps.BasicLineInput ? t('common.cancel') : t('common.return')"
        data-cy="rink-mobile-lines-create-cancel-button"
        @click="step === Steps.BasicLineInput ? router.back() : step--"
      />
      <CustomButton
        icon="right-arrow"
        :disabled="submitDisabled"
        :width="180"
        :text="submitButton.text"
        data-cy="rink-mobile-lines-create-submit-button"
        @click="submitButton.click"
      />
    </div>
  </CardContainer>
</template>

<style lang="scss" scoped>
.grid-flow-col {
  display: grid;
  grid-auto-flow: column;
}
</style>
