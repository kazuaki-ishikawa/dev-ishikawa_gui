<script setup lang="ts">
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import {
  SELECTABLE_LINE_MAX_COUNTS,
  RinkLineApplicationTypes,
  RinkLineAvailableDateOrderTypes,
  RinkLineStatusTypes,
} from '@/api/rinkLines/constants'
import type { TableHeaderType } from '@/components/table/types'

const { t } = useI18n()
const router = useRouter()

const { rinkLineTableList, getRinkLineTableList, selectableRinkMobileIdOptions } = useGetRinkLineTableList()
const { rinkMobileIdOptions, getRinkConnectionList } = useGetRinkConnectionList()

const { navigationGuard } = useNavigationGuard()
const { loading } = useLoading()
const { downloadLocalPdfOrExcel } = useDownloadLocalPdfOrExcel()
const { deleteRinkLine } = useDeleteRinkLine()
const { disabledDates, postRinkLineAvailableDate } = usePostRinkLineAvailableDate()
const { duringReceptionHours } = useRinkConnections()
const { getRinkLineStatusText } = useRinkLines()

const selectedLineNumbers = ref<string[]>([])
const isConfirmation = ref(false)
const applicationType = ref('')

const rinkMobileId = ref('')
const pagination = ref({ limit: 10, page: 1 })
const removeRequestedDate = ref({ value: '', valid: false })
const searchFilterInput = ref({ rinkMobileId: '', lineNumber: '' })

const showApplicationType = computed(() => !!rinkMobileId.value)
const isApplicationTypeForm = computed(() => applicationType.value === RinkLineApplicationTypes.Form)

const headers = computed<TableHeaderType[]>(() => {
  const base = [
    { text: t('rinkConnections.rinkMobileId'), key: 'rinkMobileId', width: 160, class: 'text-sm' },
    { text: t('rinkLines.lineNumber'), key: 'lineNumber', width: 180 },
    { text: t('rinkLines.status'), key: 'status', width: 180 },
    { text: t('rinkLines.orderStatus'), key: 'isLocked', width: 180 },
    { text: t('rinkLines.plan'), key: 'planName', width: 200, class: 'text-sm' },
    { text: t('rinkLines.accessType'), key: 'accessType', width: 150, class: 'text-sm' },
    { text: t('rinkLines.deviceName'), key: 'deviceName', width: 180, class: 'text-sm' },
    { text: t('rinkLines.authenticationId'), key: 'authenticationId', width: 200 },
    { text: t('rinkLines.actIpAddress'), key: 'actIpAddress', width: 240, class: 'text-sm' },
    { text: t('rinkLines.sbyIpAddress'), key: 'sbyIpAddress', width: 240, class: 'text-sm' },
  ]
  if (isApplicationTypeForm.value) {
    return [{ text: '', key: 'selector', width: 80, class: 'text-center' }, ...base]
  }
  return base
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
    disabled:
      !selectableLineList.value.find(line => line.lineNumber === item.lineNumber) ||
      (!selectedLineNumbers.value.includes(item.lineNumber) &&
        selectedLineNumbers.value.length >= SELECTABLE_LINE_MAX_COUNTS),
  }))
})

const selectableLineList = computed(() => {
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

const handleChangeLimit = (limit: number) => {
  pagination.value = { page: 1, limit }
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
      searchFilterInput.value = {
        lineNumber: '',
        rinkMobileId: foundRinkMobileId,
      }
      await fetchRinkLineTableList(searchFilterInput.value)
    } else {
      // foundRinkMobileId がない場合は後続処理なしで終了
      return
    }

    selectedLineNumbers.value = fileResult.reduce((acc, cur, index) => {
      const line = cur.split(',')
      // header行の場合、lineNumber が空、または選択可能な回線リストに存在しない場合はスキップ
      const lineNumber = line?.[lineNumberIndex]?.trim()
      if (index === 0 || !lineNumber || !selectableLineList.value.find(d => d.lineNumber === lineNumber)) {
        return acc
      }
      return [...acc, lineNumber]
    }, [] as string[])

    applicationType.value = RinkLineApplicationTypes.Form
  }
}
const handleDownloadLocalPdfOrExcel = () => {
  const fileName = 'remove_line_sample.xlsx'
  downloadLocalPdfOrExcel({ path: '/rink-mobile/line-remove/line-remove.xlsx', extension: 'xlsx', fileName })
}
const handleApplicationTypeUpdate = (value: string) => {
  if (value === RinkLineApplicationTypes.Csv) {
    selectedLineNumbers.value = []
  }
}

const submitDisabled = computed(
  () =>
    !duringReceptionHours.value ||
    selectedLineNumbers.value.length === 0 ||
    !removeRequestedDate.value.valid ||
    loading.value,
)
const handleSave = async () => {
  await deleteRinkLine({
    requestDate: removeRequestedDate.value.value,
    linesList: selectedLineNumbers.value.map((lineNumber, index) => ({ lineIndex: index + 1, lineNumber })),
  })
  navigationGuard(false)
  router.back()
}
const submit = computed(() => {
  const click = isConfirmation.value ? handleSave : () => (isConfirmation.value = true)
  const text = isConfirmation.value ? t('common.abolition') : t('common.confirm')
  return { click, text, color: isConfirmation.value ? ('warning' as const) : undefined }
})

const handleRinkMobileIdUpdate = (value: string) => {
  selectedLineNumbers.value = []
  rinkMobileId.value = value
  pagination.value = { ...pagination.value, page: 1 }
}

const fetchRinkLineTableList = async (params: { rinkMobileId: string; lineNumber: string }) => {
  // 回線テーブルが更新されるタイミングで入力値を初期化する
  selectedLineNumbers.value = []
  applicationType.value = ''
  removeRequestedDate.value = { value: '', valid: false }
  pagination.value = { ...pagination.value, page: 1 }

  await getRinkLineTableList(params, rinkMobileIdOptions.value)
  if (selectableRinkMobileIdOptions.value.length === 1) {
    // rinkMobileId が1つしかない場合は自動で選択
    rinkMobileId.value = selectableRinkMobileIdOptions.value[0]?.value ?? ''
  } else {
    // rinkMobileId が複数ある場合は初期化
    rinkMobileId.value = ''
  }
}

watch(
  () => selectedLineNumbers.value.length,
  next => navigationGuard(!!next),
)
watch(isConfirmation, () => window.scrollTo({ top: 0, behavior: 'smooth' }))

onBeforeMount(() => {
  getRinkConnectionList()
  postRinkLineAvailableDate({ orderType: RinkLineAvailableDateOrderTypes.DeleteLineLines })
})
</script>

<template>
  <CardContainer>
    <div v-if="isConfirmation" class="mb-4">{{ t('confirm.abolition') }}</div>
    <div
      v-if="!duringReceptionHours"
      class="mb-2 text-warning text-pre-wrap"
      data-cy="rink-mobile-lines-remove-outside-reception-hour"
    >
      {{ t('rinkConnections.message.outsideReceptionHour') }}
    </div>

    <RinkLineSearchFilter
      v-model="searchFilterInput"
      :rink-mobile-id-options="rinkMobileIdOptions"
      :disabled="isConfirmation"
      @search="fetchRinkLineTableList(searchFilterInput)"
    />

    <div v-if="loading" my-5 text-center font-bold text-xl>{{ t('pagination.dataLoading') }}</div>
    <div v-else-if="tableItems.length > 0">
      <InnerCard>
        <InputGrid required :label="t('rinkConnections.rinkMobileId')" :label-width="180">
          <SelectForm
            :model-value="rinkMobileId"
            required
            :options="selectableRinkMobileIdOptions"
            size="middle"
            placeholder="Z000000001"
            :disabled="isConfirmation || loading"
            data-cy="rink-mobile-lines-remove-rink-mobile-id"
            @update:model-value="handleRinkMobileIdUpdate"
          />
        </InputGrid>
      </InnerCard>

      <!-- 申込方法選択 -->
      <EditApplicationType
        v-if="showApplicationType"
        v-model="applicationType"
        :disabled="isConfirmation"
        @update:model-value="handleApplicationTypeUpdate"
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
        data-cy="rink-mobile-lines-remove-line-table"
      >
        <template v-if="isApplicationTypeForm" #header-selector>
          <div class="mx-auto">
            <CheckboxBase
              :value="areAllVisibleRowsSelected"
              :indeterminate="indeterminate"
              :disabled="!selectableLineList.length || isConfirmation"
              data-cy="rink-mobile-lines-remove-selector-all"
              @update:value="handleSelectAllClick"
            />
          </div>
        </template>

        <template v-if="isApplicationTypeForm" #selector="{ row }">
          <div class="mx-auto">
            <CheckboxBase
              :value="selectedLineNumbers.includes(row.lineNumber)"
              :disabled="isConfirmation || row.disabled"
              :data-cy="`rink-mobile-lines-remove-line-table-selector-${row.lineNumber}`"
              @update:value="(checked: boolean) => handleSelectorClick(checked, row.lineNumber)"
            />
          </div>
        </template>

        <template #accessType="{ data }">
          {{ t(`rinkLines.accessTypes.${data}`) }}
        </template>
      </StripedTable>
      <PaginationFooter v-model:page="pagination.page" :limit="pagination.limit" :total="lineList.length" />

      <!-- 廃止希望日 -->
      <InnerCard v-if="showApplicationType" :title="t('rinkLines.removeRequestedDate')" class="mt-5">
        <InputGrid required :label="t('rinkLines.removeRequestedDate')">
          <DatePicker
            v-model="removeRequestedDate.value"
            required
            :min-date="dayjs().format()"
            :max-date="dayjs().add(1, 'days').add(1, 'months').endOf('month').format()"
            :disabled="isConfirmation"
            :disabled-dates="disabledDates"
            size="small"
            data-cy="rink-mobile-lines-remove-request-date"
            @valid="(valid: boolean) => (removeRequestedDate.valid = valid)"
          />
        </InputGrid>
      </InnerCard>
    </div>
    <div v-else data-cy="rink-mobile-lines-remove-search-empty">{{ t('rinkLines.search.empty') }}</div>

    <div class="flex-flex-end-center">
      <CancelButton v-model:is-confirmation="isConfirmation" class="mr-6" @cancel="router.back()" />
      <CustomButton
        icon="right-arrow"
        :disabled="submitDisabled"
        :width="180"
        :text="submit.text"
        :color="submit.color"
        data-cy="rink-mobile-lines-remove-submit-button"
        @click="submit.click"
      />
    </div>
  </CardContainer>
</template>

<style lang="scss" scoped>
.w-560px {
  width: 560px;
}
</style>
