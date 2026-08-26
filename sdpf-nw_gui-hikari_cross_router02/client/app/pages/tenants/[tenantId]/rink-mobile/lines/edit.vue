<script setup lang="ts">
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import type {
  RinkLineListType,
  RinkLineEditInputDataType,
  RinkLineEditInputValidType,
  RinkLineEditMenuType,
} from '@/api/rinkLines/types'
import {
  SELECTABLE_LINE_MAX_COUNTS,
  initialRinkLineEditInputData,
  initialRinkLineEditValid,
  RinkLineAdditionalLimitTypes,
  RinkLineEditMenuTypes,
  RinkLineApplicationTypes,
  RinkLineAvailableDateOrderTypes,
  RinkLineStatusTypes,
  initialShippingInfoInputData,
  initialShippingInfoValid,
} from '@/api/rinkLines/constants'
import { OrderResourceTypes } from '@/api/orders/constants'
import type { TableHeaderType } from '@/components/table/types'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const rules = useRules()
const { rinkMobileIdOptions, getRinkConnectionList } = useGetRinkConnectionList()
const { rinkLineTableList, getRinkLineTableList, selectableRinkMobileIdOptions } = useGetRinkLineTableList()
const { planOptions, getAvailablePlanDeviceList } = useGetAvailablePlanDeviceList()
const { availableLinePrefix, getRinkConnectionLinePrefix } = useGetRinkConnectionLinePrefix()
const { disabledDates, postRinkLineAvailableDate } = usePostRinkLineAvailableDate()
const { inputData, inputValid, updateBulkRinkLine } = useUpdateBulkRinkLine()
const { reissueInputData, reissueInputValid, updateReissueRinkLine } = useUpdateReissueRinkLine()
const { rinkLineEditMenuOptions, additionalLimitOptions, rinkLineRules, getRinkLineStatusText } = useRinkLines()
const { duringReceptionHours } = useRinkConnections()
const { customerNoteList, getRinkLineGroupList } = useGetRinkLineGroupList()

const { navigationGuard } = useNavigationGuard()
const { loading } = useLoading()
const { downloadLocalPdfOrExcel } = useDownloadLocalPdfOrExcel()
const { showRinkMobileMaintenanceNotification, disabledRinkMobileMaintenanceApplication } = useRinkMobileMaintenance()

const selectedLines = ref<RinkLineListType[]>([])
const editMenu = ref<RinkLineEditMenuType | ''>('')
const isConfirmation = ref(false)
const applicationType = ref('')

const isApplicationTypeForm = computed(() => applicationType.value === RinkLineApplicationTypes.Form)
const queryRinkMobileId = computed(() => (route.query.rinkMobileId as string) || '')
const queryLineNumber = computed(() => (route.query.lineNumber as string) || '')
const queryValue = computed(() => ({
  rinkMobileId: queryRinkMobileId.value,
  lineNumber: queryLineNumber.value,
}))
const searchFilterInput = ref({ rinkMobileId: '', lineNumber: '' })

const rinkMobileId = ref('')
const pagination = ref({ limit: 10, page: 1 })

const isStatusChangeSelected = computed(() =>
  [RinkLineEditMenuTypes.Reactivate, RinkLineEditMenuTypes.Deactivate].includes(editMenu.value),
)
const rinkLineEditMenuOptionsForMaintenance = computed(() =>
  rinkLineEditMenuOptions.map(option => ({
    ...option,
    disabled: disabledRinkMobileMaintenanceApplication && option.value !== RinkLineEditMenuTypes.AdditionalLimit,
  })),
)
const lineCounts = computed(() =>
  lineList.value.reduce(
    (acc, cur) => {
      if (cur.lineStatus === RinkLineStatusTypes.Active) {
        acc.active += 1
      } else if (cur.lineStatus === RinkLineStatusTypes.Suspend) {
        acc.suspend += 1
      }
      return acc
    },
    { active: 0, suspend: 0 },
  ),
)
const isAlwaysAvailableEditMenu = computed(() => {
  // 容量追加, 通信中断, 通信中断解除は 24h/365d 実行可能
  return [
    RinkLineEditMenuTypes.AdditionalLimit,
    RinkLineEditMenuTypes.Deactivate,
    RinkLineEditMenuTypes.Reactivate,
  ].includes(editMenu.value)
})

const headers = computed<TableHeaderType[]>(() => {
  const commonPlan = { text: t('rinkLines.plan'), key: 'planName', width: 200, class: 'text-sm' }
  const base = [
    { text: t('rinkConnections.rinkMobileId'), key: 'rinkMobileId', width: 160, class: 'text-sm' },
    { text: t('rinkLines.lineNumber'), key: 'lineNumber', width: 180 },
    { text: t('rinkLines.status'), key: 'status', width: 180 },
    { text: t('rinkLines.orderStatus'), key: 'isLocked', width: 200 },
    commonPlan,
    { text: t('rinkLines.accessType'), key: 'accessType', width: 150, class: 'text-sm' },
    { text: t('rinkLines.deviceName'), key: 'deviceName', width: 180, class: 'text-sm' },
    { text: t('rinkLines.authenticationId'), key: 'authenticationId', width: 200 },
    { text: t('rinkLines.actIpAddress'), key: 'actIpAddress', width: 240, class: 'text-sm' },
    { text: t('rinkLines.sbyIpAddress'), key: 'sbyIpAddress', width: 240, class: 'text-sm' },
    { text: t('rinkLines.cancelOrder'), key: 'cancelOrder', width: 200 },
  ]

  if (!isApplicationTypeForm.value) {
    return base
  }

  const common = [
    { text: '', key: 'selector', width: 80 },
    { text: t('rinkConnections.rinkMobileId'), key: 'rinkMobileId', width: 160, class: 'text-sm' },
    { text: t('rinkLines.lineNumber'), key: 'lineNumber', width: 180 },
    { text: t('rinkLines.status'), key: 'status', width: 180 },
    { text: t('rinkLines.orderStatus'), key: 'isLocked', width: 180 },
  ]
  switch (editMenu.value) {
    case RinkLineEditMenuTypes.AdditionalLimit:
      return [
        ...common,
        commonPlan,
        { text: t('rinkLines.additionalLimit'), key: 'additionalLimit', width: 180 },
        { text: t('rinkLineGroups.lineGroupName'), key: 'lineGroupName', class: 'text-sm' },
        { text: t('rinkLines.cancelOrder'), key: 'cancelOrder', width: 200 },
      ]
    case RinkLineEditMenuTypes.Authentication:
      return [
        ...common,
        commonPlan,
        { text: 'IMEI', key: 'imei', width: 180 },
        { text: t('rinkLines.authenticationId'), key: 'authenticationId', width: 300 },
        { text: t('rinkLines.authenticationPassword'), key: 'authenticationPassword', width: 300 },
        { text: t('rinkLines.cancelOrder'), key: 'cancelOrder', width: 200 },
      ]
    case RinkLineEditMenuTypes.Deactivate:
    case RinkLineEditMenuTypes.Reactivate:
      return [
        ...common,
        { text: t('rinkLines.plan'), key: 'planName', class: 'text-sm' },
        { text: t('rinkLines.cancelOrder'), key: 'cancelOrder', width: 200 },
      ]
    case RinkLineEditMenuTypes.LinePrefix:
      return [
        ...common,
        commonPlan,
        { text: t('rinkLines.actIpAddress'), key: 'actIpAddress', width: 340, class: 'text-sm' },
        { text: t('rinkLines.sbyIpAddress'), key: 'sbyIpAddress', width: 340, class: 'text-sm' },
        { text: t('rinkLines.cancelOrder'), key: 'cancelOrder', width: 200 },
      ]
    case RinkLineEditMenuTypes.Plan:
      return [
        ...common,
        { text: t('rinkLines.plan'), key: 'planName', class: 'text-sm' },
        { text: t('rinkLines.accessType'), key: 'accessType', width: 150, class: 'text-sm' },
        { text: t('rinkLines.cancelOrder'), key: 'cancelOrder', width: 200 },
      ]
    case RinkLineEditMenuTypes.Reissue:
      return [
        ...common,
        { text: t('rinkLines.plan'), key: 'planName', class: 'text-sm' },
        { text: t('rinkLines.cancelOrder'), key: 'cancelOrder', width: 200 },
      ]
    default:
      return base
  }
})

const lineList = computed(() =>
  rinkLineTableList.value.filter(line => !rinkMobileId.value || line.rinkMobileId === rinkMobileId.value),
)
const tableItems = computed(() => {
  const startIndex = (pagination.value.page - 1) * pagination.value.limit
  const endIndex = startIndex + pagination.value.limit

  return lineList.value.slice(startIndex, endIndex).map(item => ({
    ...item,
    deviceName: item.deviceName || t('rinkLines.unselectedDevice'),
    status: getRinkLineStatusText(item.lineStatus),
    isLocked: item.isLocked ? t('rinkLines.isLocked') : t('rinkLines.isNotLocked'),
    cancelOrder: item.isLocked,
    lineGroupName: customerNoteList.value.find(note => note.id === item.lineGroupId)?.customerNote || '-',
    disabled:
      !selectableLineList.value.find(line => line.lineNumber === item.lineNumber) ||
      (!selectedLineNumbers.value.includes(item.lineNumber) &&
        selectedLineNumbers.value.length >= SELECTABLE_LINE_MAX_COUNTS),
  }))
})

const showApplicationType = computed(
  () => !!rinkMobileId.value && editMenu.value && editMenu.value !== RinkLineEditMenuTypes.Reissue,
)

const selectedLineNumbers = computed({
  get: () => selectedLines.value.map(line => line.lineNumber),
  set: (values: string[]) => {
    selectedLines.value = lineList.value.filter(line => values.includes(line.lineNumber))
  },
})
const selectableLineList = computed(() => {
  if (isStatusChangeSelected.value) {
    return lineList.value.filter(
      line =>
        !line.isLocked &&
        (editMenu.value === RinkLineEditMenuTypes.Reactivate
          ? line.lineStatus === RinkLineStatusTypes.Suspend
          : line.lineStatus === RinkLineStatusTypes.Active),
    )
  }
  // メニュー未選択時、および Reactivate/Deactivate 以外はこの分岐を通る。
  // Reactivate/Deactivate は上の分岐で個別にフィルタするため、ここでは Deleted 以外（Active・Suspend）を選択可能とする。
  // メニュー変更後に Suspend 回線が不適切なメニュー（例: Deactivate）で残らないことは handleUpdateEditMenu の再フィルタに依存する。
  return lineList.value.filter(line => !line.isLocked && line.lineStatus !== RinkLineStatusTypes.Deleted)
})
const areAllVisibleRowsSelected = computed(
  () =>
    // テーブルに表示してる選択可能な回線が全て選択されているかどうか
    selectableLineList.value.length > 0 &&
    selectableLineList.value.every(line => selectedLineNumbers.value.includes(line.lineNumber)),
)
const indeterminate = computed(() => selectedLineNumbers.value.length > 0)
const handleSelectAllClick = (checked: boolean) => {
  if (checked) {
    // テーブル表示上の選択可能な端末IDだけ取得する
    selectedLineNumbers.value = selectableLineList.value
      .map(line => line.lineNumber)
      .slice(0, SELECTABLE_LINE_MAX_COUNTS)
  } else {
    selectedLineNumbers.value = []
  }
}
const handleSelectorClick = (checked: boolean, lineNumber: string) => {
  if (checked) {
    selectedLineNumbers.value = [...selectedLineNumbers.value, lineNumber]
  } else {
    selectedLineNumbers.value = selectedLineNumbers.value.filter(number => number !== lineNumber)
  }
}

const moveToOrder = async (resourceId: string) => {
  await navigateTo({
    path: `/tenants/${route.params.tenantId}/orders`,
    query: { resourceId, resourceType: OrderResourceTypes.RinkMobile },
  })
}

const handleRinkMobileIdUpdate = async (value: string) => {
  selectedLineNumbers.value = []
  pagination.value.page = 1
  rinkMobileId.value = value

  // rinkMobileId が更新された時にAPIを更新する
  if (value) {
    await getRinkLineGroupList(value)
    await getAvailablePlanDeviceList(value)
    await getRinkConnectionLinePrefix(value)
  } else {
    // rinkMobileId が空になったとき非表示になる項目の値をリセットする
    editMenu.value = ''
    applicationType.value = ''
  }
}
const handleChangeLimit = (limit: number) => {
  pagination.value = { limit, page: 1 }
}
const handleChangePage = (page: number) => {
  pagination.value.page = page
}
const handleSearch = async () => {
  if (isEqual(searchFilterInput.value, queryValue.value)) {
    fetchRinkLineTableList(searchFilterInput.value)
  } else {
    navigationGuard(false)
    router.replace({
      query: {
        rinkMobileId: searchFilterInput.value.rinkMobileId || undefined,
        lineNumber: searchFilterInput.value.lineNumber || undefined,
      },
    })
  }
}

const handleUpdateEditMenu = (value: string) => {
  // 選択されている回線のうち、現在のメニューで選択可能な回線だけ残す。
  // メニュー未選択時に選ばれた回線も、メニュー変更後に selectableLineList に基づいて再フィルタされる。
  selectedLineNumbers.value = selectedLineNumbers.value.filter(
    value => !!selectableLineList.value.find(line => line.lineNumber === value),
  )
  // SIM再発行の場合、申込方法は form 固定
  if (value === RinkLineEditMenuTypes.Reissue) {
    applicationType.value = RinkLineApplicationTypes.Form
    reissueInputData.value = structuredClone(initialShippingInfoInputData)
    reissueInputValid.value = structuredClone(initialShippingInfoValid)
  }
}
const handleUploadApplicationCsv = (file: File) => {
  const rinkMobileIdIndex = 1
  const lineNumberIndex = 2

  // FileReaderのインスタンスを作成する
  const fileReader = new FileReader()
  // 読み込んだファイルの中身を取得する
  fileReader.readAsText(file)
  fileReader.onload = async () => {
    // ファイル読み込み
    const fileResult = (fileReader.result as string).split(/\r\n|\n|\r/)

    // rinkMobileId が見つかったかつ表示回線と一致しない場合、検索条件にセットして再取得する
    const foundRinkMobileId = fileResult
      .find((line, index) => {
        if (index === 0) {
          return false
        }
        const lineArray = line.split(',')
        return !!lineArray?.[rinkMobileIdIndex]?.trim()
      })
      ?.split(',')
      ?.[rinkMobileIdIndex]?.trim()

    if (foundRinkMobileId) {
      // handleSearch だと watch 連動での GET になってしまうため、クエリの変更はここでは無視する
      searchFilterInput.value = {
        lineNumber: '',
        rinkMobileId: foundRinkMobileId,
      }
      await fetchRinkLineTableList(searchFilterInput.value)
    } else {
      // foundRinkMobileId がない場合は後続処理なしで終了
      return
    }

    inputData.value = fileResult.reduce((acc, cur, index) => {
      const line = cur.split(',')
      // header行の場合、lineNumber が空、または選択可能な回線リストに存在しない場合はスキップ
      const lineNumber = line?.[lineNumberIndex]?.trim()
      const foundLine = selectableLineList.value.find(d => d.lineNumber === lineNumber)
      if (index === 0 || !lineNumber || !foundLine) {
        return acc
      }

      switch (editMenu.value) {
        case RinkLineEditMenuTypes.AdditionalLimit: {
          const found = Object.entries(RinkLineAdditionalLimitTypes).find(
            ([key]) => key === line[lineNumberIndex + 1],
          )?.[1]
          acc[lineNumber] = { ...initialRinkLineEditInputData, additionalLimit: `${found ?? ''}` }
          inputValid.value[lineNumber] = { ...initialRinkLineEditValid, additionalLimit: !!found }
          break
        }
        case RinkLineEditMenuTypes.Authentication:
          acc[lineNumber] = {
            ...initialRinkLineEditInputData,
            authenticationId: line[lineNumberIndex + 1]!,
            authenticationPassword: line[lineNumberIndex + 2] ?? '',
          }
          inputValid.value[lineNumber] = {
            ...initialRinkLineEditValid,
            authenticationId: !!line[lineNumberIndex + 1],
            authenticationPassword: true,
          }
          break
        case RinkLineEditMenuTypes.LinePrefix:
          acc[lineNumber] = {
            ...initialRinkLineEditInputData,
            actIpAddress: line[lineNumberIndex + 1]!,
            sbyIpAddress: line[lineNumberIndex + 2]!,
          }
          inputValid.value[lineNumber] = { ...initialRinkLineEditValid, actIpAddress: !!line[lineNumberIndex + 1] }
          break
        case RinkLineEditMenuTypes.Plan: {
          const options = planOptions.value[foundLine.accessType]
          const planLimitAlias = options.find(option => option.text === line[lineNumberIndex + 1]!)?.value
          if (planLimitAlias) {
            acc[lineNumber] = { ...initialRinkLineEditInputData, planLimitAlias }
            inputValid.value[lineNumber] = { ...initialRinkLineEditValid, planLimitAlias: true }
          }
          break
        }
        case RinkLineEditMenuTypes.Deactivate:
        case RinkLineEditMenuTypes.Reactivate:
          acc[lineNumber] = { ...initialRinkLineEditInputData }
          inputValid.value[lineNumber] = { ...initialRinkLineEditValid }
          break
        default:
          break
      }
      return acc
    }, {} as RinkLineEditInputDataType)

    selectedLines.value = lineList.value.filter(line => Object.keys(inputData.value).includes(line.lineNumber))
    applicationType.value = RinkLineApplicationTypes.Form
  }
}
const handleDownloadLocalPdfOrExcel = () => {
  // SIM再発行の場合はサンプルなし
  if (!editMenu.value || editMenu.value === RinkLineEditMenuTypes.Reissue) {
    return
  }
  const fileName = `update_line_${editMenu.value}_sample.xlsx`
  downloadLocalPdfOrExcel({ path: `/rink-mobile/line-edit/${editMenu.value}.xlsx`, extension: 'xlsx', fileName })
}

const showInputForm = (editMenuType: RinkLineEditMenuType) =>
  isApplicationTypeForm.value && editMenu.value === editMenuType

const invalidBulkData = computed(() =>
  Object.values(inputValid.value).some(data => {
    switch (editMenu.value) {
      case RinkLineEditMenuTypes.AdditionalLimit:
        return !data.additionalLimit
      case RinkLineEditMenuTypes.Authentication:
        return !data.authenticationId || !data.authenticationPassword
      case RinkLineEditMenuTypes.LinePrefix:
        return !data.actIpAddress || !data.sbyIpAddress
      case RinkLineEditMenuTypes.Plan:
        return !data.planLimitAlias
      default:
        return false
    }
  }),
)
const invalidReissue = computed(() => {
  if (editMenu.value === RinkLineEditMenuTypes.Reissue) {
    return Object.values(reissueInputValid.value).some(v => !v)
  }
  return false
})

const changed = computed(() => {
  return selectedLines.value.some(original => {
    const input = inputData.value[original.lineNumber]
    if (!input) {
      return true
    }
    if (editMenu.value === RinkLineEditMenuTypes.Authentication) {
      return original.authenticationId !== input.authenticationId || !!input.authenticationPassword
    }
    if (editMenu.value === RinkLineEditMenuTypes.LinePrefix) {
      return original.actIpAddress !== input.actIpAddress || original.sbyIpAddress !== input.sbyIpAddress
    }
    return true
  })
})

const submitDisabled = computed(
  () =>
    (!duringReceptionHours.value && !isAlwaysAvailableEditMenu.value) ||
    invalidBulkData.value ||
    invalidReissue.value ||
    !editMenu.value ||
    selectedLineNumbers.value.length === 0 ||
    !changed.value ||
    loading.value,
)

const fetchRinkLineTableList = async (params: { rinkMobileId: string; lineNumber: string }) => {
  // GETのたびに選択回線を初期化
  selectedLineNumbers.value = []
  pagination.value.page = 1
  await getRinkLineTableList(params, rinkMobileIdOptions.value)
  if (selectableRinkMobileIdOptions.value.length === 1) {
    // rinkMobileId が1つしかない場合は自動で選択
    await handleRinkMobileIdUpdate(selectableRinkMobileIdOptions.value[0]?.value ?? '')
  } else {
    // rinkMobileId が複数ある場合は初期化
    await handleRinkMobileIdUpdate('')
  }
}
const initialize = (targetRinkMobileId: string) => {
  navigationGuard(false)
  editMenu.value = ''
  isConfirmation.value = false
  if (targetRinkMobileId) {
    if (queryValue.value.rinkMobileId !== targetRinkMobileId) {
      router.replace({ query: { ...queryValue.value, rinkMobileId: targetRinkMobileId } })
    } else {
      fetchRinkLineTableList(queryValue.value)
    }
  }
}
const handleSave = async () => {
  if (!editMenu.value) {
    return
  }

  if (editMenu.value === RinkLineEditMenuTypes.Reissue) {
    await updateReissueRinkLine({
      ...reissueInputData.value,
      shippingPrefecture: reissueInputData.value.shippingPrefecture,
      shippingCityAdditionalInfo: reissueInputData.value.shippingCityAdditionalInfo || undefined,
      shippingBuilding: reissueInputData.value.shippingBuilding || undefined,
      linesList: selectedLineNumbers.value.map((lineNumber, index) => ({ lineIndex: index + 1, lineNumber })),
    })
    initialize(rinkMobileId.value)
  } else {
    await updateBulkRinkLine(editMenu.value)
    initialize(rinkMobileId.value)
  }
}

const handleConfirm = () => {
  if (editMenu.value === RinkLineEditMenuTypes.Authentication) {
    // 認証情報変更の場合、変更のある行だけ残す
    selectedLines.value = selectedLines.value.filter(line => {
      const input = inputData.value[line.lineNumber]
      return input && (line.authenticationId !== input.authenticationId || !!input.authenticationPassword)
    })
  }
  isConfirmation.value = true
}

const submit = computed(() => {
  const click = isConfirmation.value ? handleSave : handleConfirm
  const text = isConfirmation.value ? t('common.save') : t('common.confirm')
  return { click, text }
})

watchEffect(() => navigationGuard(selectedLineNumbers.value.length > 0))
watch(isConfirmation, () => window.scrollTo({ top: 0, behavior: 'smooth' }))
watch([selectedLines, editMenu], () => {
  const { input, valid } = selectedLines.value.reduce<{
    input: RinkLineEditInputDataType
    valid: RinkLineEditInputValidType
  }>(
    (acc, cur) => {
      const createdInputData = inputData.value[cur.lineNumber]
      const createdValidData = inputValid.value[cur.lineNumber]
      // すでに入力された値がある場合はそのまま使う
      const addInputData = createdInputData
        ? createdInputData
        : {
            additionalLimit: '',
            planLimitAlias: '',
            authenticationId: cur.authenticationId,
            authenticationPassword: '',
            actIpAddress: cur.actIpAddress,
            sbyIpAddress: cur.sbyIpAddress || '',
          }

      return {
        input: { ...acc.input, [cur.lineNumber]: addInputData },
        valid: {
          ...acc.valid,
          [cur.lineNumber]: createdValidData
            ? createdValidData
            : {
                additionalLimit: !!addInputData.additionalLimit,
                planLimitAlias: !!addInputData.planLimitAlias,
                authenticationId: !!addInputData.authenticationId,
                authenticationPassword: true,
                actIpAddress: !!addInputData.actIpAddress,
                sbyIpAddress: true,
              },
        },
      }
    },
    { input: {}, valid: {} },
  )

  inputData.value = input
  inputValid.value = valid
})
watch(queryValue, next => {
  fetchRinkLineTableList(next)
})
onBeforeMount(async () => {
  await getRinkConnectionList()
  postRinkLineAvailableDate({ orderType: RinkLineAvailableDateOrderTypes.ChangeLineReissue })

  searchFilterInput.value = { ...queryValue.value }
  fetchRinkLineTableList(queryValue.value)
})
</script>

<template>
  <CardContainer>
    <div v-if="isConfirmation" class="mb-2">{{ t('confirm.update') }}</div>

    <div
      v-if="!duringReceptionHours"
      class="mb-4 text-warning text-pre-wrap"
      data-cy="rink-mobile-lines-edit-outside-reception-hour"
    >
      {{ t('rinkConnections.message.outsideReceptionHour') }}
    </div>

    <RinkLineSearchFilter
      v-model="searchFilterInput"
      :rink-mobile-id-options="rinkMobileIdOptions"
      :disabled="isConfirmation"
      @search="handleSearch"
    />

    <div
      v-if="showRinkMobileMaintenanceNotification"
      class="mb-4 text-warning text-pre-wrap"
      data-cy="rink-mobile-lines-edit-maintenance-notification"
    >
      {{ t('rinkConnections.message.maintenanceLineEditApplicationSuspension') }}
    </div>

    <div v-if="tableItems.length > 0">
      <InnerCard>
        <InputGrid required :label="t('rinkConnections.rinkMobileId')" :label-width="180">
          <SelectForm
            :model-value="rinkMobileId"
            required
            :options="selectableRinkMobileIdOptions"
            size="middle"
            placeholder="Z000000001"
            :disabled="isConfirmation || loading"
            data-cy="rink-mobile-lines-edit-rink-mobile-id"
            @update:model-value="handleRinkMobileIdUpdate"
          />
        </InputGrid>
        <InputGrid v-if="!!rinkMobileId" required :label="t('rinkLines.selectEditMenu')" :label-width="180">
          <RadioForm
            v-model="editMenu"
            :options="rinkLineEditMenuOptionsForMaintenance"
            :disabled="isConfirmation || loading"
            data-cy="rink-mobile-lines-edit-edit-menu-selector"
            @update:model-value="handleUpdateEditMenu"
          />
        </InputGrid>

        <template v-if="isStatusChangeSelected">
          <DetailGrid :label-width="180">
            <div>{{ t('rinkLines.suspendLineCounts') }}</div>
            <div data-cy="rink-mobile-lines-edit-rink-line-suspend-counts">{{ lineCounts.suspend }}</div>
          </DetailGrid>
          <DetailGrid :label-width="180">
            <div>{{ t('rinkLines.activeLineCounts') }}</div>
            <div data-cy="rink-mobile-lines-edit-rink-line-active-counts">{{ lineCounts.active }}</div>
          </DetailGrid>
        </template>
      </InnerCard>

      <!-- 申込方法選択 -->
      <EditApplicationType
        v-if="showApplicationType"
        v-model="applicationType"
        :disabled="isConfirmation || loading"
        @download:excel="handleDownloadLocalPdfOrExcel"
        @upload:csv="handleUploadApplicationCsv"
      />

      <!-- テーブル -->
      <PaginationHeader
        class="mt-5"
        :page="pagination.page"
        :limit="pagination.limit"
        :total="lineList.length"
        @update:limit="handleChangeLimit"
      />
      <StripedTable
        :headers="headers"
        :items="tableItems"
        :key-items="['lineNumber']"
        data-cy="rink-mobile-lines-edit-line-table"
      >
        <template #header-selector>
          <div class="mx-auto">
            <CheckboxBase
              :value="areAllVisibleRowsSelected"
              :indeterminate="indeterminate"
              :disabled="isConfirmation || !selectableLineList.length || loading"
              data-cy="rink-mobile-lines-edit-line-table-selector-all"
              @update:value="handleSelectAllClick"
            />
          </div>
        </template>
        <template v-if="showInputForm(RinkLineEditMenuTypes.Authentication)" #header-authenticationId="{ data }">
          <div>{{ data }}</div>
          <HelpTooltip class="px-2 pt-1" size="smallMiddle">
            {{ t('rinkLines.help.authenticationId') }}
          </HelpTooltip>
        </template>
        <template v-if="showInputForm(RinkLineEditMenuTypes.Authentication)" #header-authenticationPassword="{ data }">
          <div>{{ data }}</div>
          <HelpTooltip class="px-2 pt-1" size="smallMiddle">
            {{ t('rinkLines.help.authenticationPassword') }}
          </HelpTooltip>
        </template>

        <template #selector="{ row }">
          <div class="mx-auto">
            <CheckboxBase
              :value="selectedLineNumbers.includes(row.lineNumber)"
              :disabled="isConfirmation || row.disabled || loading"
              :data-cy="`rink-mobile-lines-edit-line-table-selector-${row.lineNumber}`"
              @update:value="(checked: boolean) => handleSelectorClick(checked, row.lineNumber)"
            />
          </div>
        </template>

        <template #accessType="{ data }">
          {{ t(`rinkLines.accessTypes.${data}`) }}
        </template>

        <!-- プラン変更 -->
        <template v-if="showInputForm(RinkLineEditMenuTypes.Plan)" #planName="{ row }">
          <span v-if="!selectedLineNumbers.includes(row.lineNumber)">{{ row.planName }}</span>
          <SelectForm
            v-else
            v-model="inputData[row.lineNumber]!.planLimitAlias"
            :options="planOptions[row.accessType]"
            :placeholder="planOptions[row.accessType]![0]?.text"
            size="middle"
            required
            :disabled="isConfirmation || loading"
            :data-cy="`rink-mobile-lines-edit-plan-select-form-${row.lineNumber}`"
            @valid="(valid: boolean) => (inputValid[row.lineNumber]!.planLimitAlias = valid)"
          />
        </template>

        <!-- 認証情報変更 -->
        <template v-if="showInputForm(RinkLineEditMenuTypes.Authentication)" #authenticationId="{ row }">
          <span v-if="!selectedLineNumbers.includes(row.lineNumber)">{{ row.authenticationId }}</span>
          <InputForm
            v-else
            v-model="inputData[row.lineNumber]!.authenticationId"
            :rules="[rinkLineRules.authenticationId, rules.maxlength(10)]"
            placeholder="1234567890"
            size="xSmall"
            maxlength="10"
            minlength="3"
            required
            :disabled="isConfirmation || loading"
            :data-cy="`rink-mobile-lines-edit-authentication-id-input-form-${row.lineNumber}`"
            @valid="(valid: boolean) => (inputValid[row.lineNumber]!.authenticationId = valid)"
          />
        </template>
        <template v-if="showInputForm(RinkLineEditMenuTypes.Authentication)" #authenticationPassword="{ row }">
          <InputForm
            v-if="selectedLineNumbers.includes(row.lineNumber)"
            v-model="inputData[row.lineNumber]!.authenticationPassword"
            :rules="[rinkLineRules.password]"
            size="xSmall"
            maxlength="15"
            :minlength="inputData[row.lineNumber]!.authenticationPassword ? 2 : undefined"
            password
            :disabled="isConfirmation || loading"
            :data-cy="`rink-mobile-lines-edit-authentication-password-input-form-${row.lineNumber}`"
            @valid="(valid: boolean) => (inputValid[row.lineNumber]!.authenticationPassword = valid)"
          />
        </template>

        <!-- 容量追加 -->
        <template v-if="showInputForm(RinkLineEditMenuTypes.AdditionalLimit)" #additionalLimit="{ row }">
          <SelectForm
            v-if="selectedLineNumbers.includes(row.lineNumber)"
            v-model="inputData[row.lineNumber]!.additionalLimit"
            :options="additionalLimitOptions"
            :placeholder="additionalLimitOptions[0]?.text"
            size="small"
            required
            :disabled="isConfirmation || loading"
            :data-cy="`rink-mobile-lines-edit-additional-limit-select-form-${row.lineNumber}`"
            @valid="(valid: boolean) => (inputValid[row.lineNumber]!.additionalLimit = valid)"
          />
        </template>

        <!-- 国内通信IPアドレス変更 -->
        <template v-if="showInputForm(RinkLineEditMenuTypes.LinePrefix)" #actIpAddress="{ row }">
          <span v-if="!selectedLineNumbers.includes(row.lineNumber)">{{ row.actIpAddress }}</span>
          <EditIpAddress
            v-else
            v-model="inputData[row.lineNumber]!.actIpAddress"
            v-model:valid="inputValid[row.lineNumber]!.actIpAddress"
            :available-line-prefix="availableLinePrefix.lineActPrefix"
            required
            :disabled="isConfirmation || loading"
            :data-cy="`rink-mobile-lines-edit-act-ip-address-input-form-${row.lineNumber}`"
          />
        </template>
        <template v-if="showInputForm(RinkLineEditMenuTypes.LinePrefix)" #sbyIpAddress="{ row }">
          <span v-if="!selectedLineNumbers.includes(row.lineNumber)">{{ row.sbyIpAddress }}</span>
          <EditIpAddress
            v-else
            v-model="inputData[row.lineNumber]!.sbyIpAddress"
            v-model:valid="inputValid[row.lineNumber]!.sbyIpAddress"
            :available-line-prefix="availableLinePrefix.lineSbyPrefix"
            :disabled="isConfirmation || loading"
            :data-cy="`rink-mobile-lines-edit-sby-ip-address-input-form-${row.lineNumber}`"
          />
        </template>
        <template #cancelOrder="{ row }">
          <CustomButton
            v-if="row.cancelOrder"
            :text="t('rinkLines.cancelOrder')"
            icon="right-arrow"
            :data-cy="`rink-mobile-lines-edit-cancel-order-button-${row.lineNumber}`"
            @click="moveToOrder(row.rinkMobileId)"
          />
          <span v-else />
        </template>
      </StripedTable>
      <PaginationFooter
        v-show="!loading"
        :page="pagination.page"
        :limit="pagination.limit"
        :total="lineList.length"
        @update:page="handleChangePage"
      />

      <!-- 入力フォームから申込 -->
      <EditShippingInformation
        v-if="editMenu === RinkLineEditMenuTypes.Reissue"
        v-model="reissueInputData"
        v-model:valid="reissueInputValid"
        is-edit
        :disabled="isConfirmation || loading"
        :disabled-dates="disabledDates"
      />
    </div>
    <div v-else data-cy="rink-mobile-lines-edit-search-empty">{{ t('rinkLines.search.empty') }}</div>

    <!-- 確認画面でのみ表示する -->
    <template v-if="isConfirmation">
      <InnerCard
        v-if="isStatusChangeSelected || editMenu === RinkLineEditMenuTypes.Plan"
        :title="
          editMenu === RinkLineEditMenuTypes.Plan
            ? t('rinkLines.reflectionDate')
            : editMenu === RinkLineEditMenuTypes.Reactivate
              ? t('rinkLines.activeDate')
              : t('rinkLines.suspendDate')
        "
        color="warning"
        class="mt-4"
        data-cy="rink-mobile-lines-edit-start-ordering-card"
      >
        <div class="text-pre-wrap mt-2" data-cy="rink-mobile-lines-edit-start-ordering-message">
          {{
            editMenu === RinkLineEditMenuTypes.Plan
              ? t('rinkLines.message.editMenuPlan')
              : t('rinkLines.message.startOrdering')
          }}
        </div>
      </InnerCard>
    </template>

    <div class="grid-flow-col justify-end ga-4">
      <CancelButton
        v-model:is-confirmation="isConfirmation"
        data-cy="rink-mobile-connections-edit-cancel-button"
        @cancel="router.back()"
      />
      <CustomButton
        icon="right-arrow"
        :disabled="submitDisabled"
        :width="180"
        :text="submit.text"
        data-cy="rink-mobile-lines-edit-submit-button"
        @click="submit.click"
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
