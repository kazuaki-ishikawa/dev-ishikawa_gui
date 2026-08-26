<script setup lang="ts">
import dayjs from 'dayjs'
import * as Papa from 'papaparse'
import { useI18n } from 'vue-i18n'
import { RinkLineApplicationTypes } from '@/api/rinkLines/constants'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { navigationGuard } = useNavigationGuard()

const { downloadCsv } = useDownloadCsv()

const { loading } = useLoading()

const { getRinkLineGroupList, rinkLineGroupList } = useGetRinkLineGroupList()
const { getAllRinkLineList, formatCsvData, allRinkLineList } = useGetAllRinkLineList()
const { downloadLocalPdfOrExcel } = useDownloadLocalPdfOrExcel()
const { putRinkLineGroupLineMembers } = usePutRinkLineGroupLineMembers()
const { duringReceptionHours } = useRinkConnections()

const applicationType = ref(RinkLineApplicationTypes.Form)
const isConfirmation = ref(false)
const editLineNumberList = ref<string[]>([])
watch(editLineNumberList, next => navigationGuard(next.length > 0))

const rinkMobileId = computed(() => route.query.rinkMobileId as string)
const lineGroupId = computed(() => route.params.id as string)
const allLineList = computed(() => allRinkLineList.value.lineList)
const lineGroupName = computed(() => {
  const group = rinkLineGroupList.value.find(group => group.lineGroupId === lineGroupId.value)
  return group?.lineGroupName
})
const submit = computed(() => {
  const click = isConfirmation.value ? handleSave : () => (isConfirmation.value = true)
  const text = isConfirmation.value ? t('common.add') : t('common.confirm')
  return { click, text }
})
const submitDisabled = computed(() => {
  return !duringReceptionHours.value || editLineNumberList.value.length === 0 || loading.value
})
const showEditRinkLine = computed(() => applicationType.value === RinkLineApplicationTypes.Form || isConfirmation.value)

const handleDownloadLocalPdfOrExcel = () => {
  const fileName = 'add_line_members_sample.xlsx'
  downloadLocalPdfOrExcel({ path: '/rink-mobile/line-edit/edit-line-members.xlsx', extension: 'xlsx', fileName })
}

const handleUploadApplicationCsv = (file: File) => {
  // FileReaderのインスタンスを作成する
  const fileReader = new FileReader()
  // 読み込んだファイルの中身を取得する
  fileReader.readAsText(file)
  fileReader.onload = () => {
    // ファイル読み込み
    const fileResult = (fileReader.result as string).split(/\r\n|\n|\r/)
    editLineNumberList.value = fileResult.reduce((acc, cur, index) => {
      const line = cur.split(',')
      // header行の場合、lineNumber が空、または選択可能な回線リストに存在しない場合はスキップ
      const lineNumber = line?.[1]?.trim()
      if (
        index === 0 ||
        !lineNumber ||
        !allLineList.value.find(line => line.lineGroupId !== lineGroupId.value && line.lineNumber === lineNumber)
      ) {
        return acc
      }
      return [...acc, lineNumber]
    }, [] as string[])
  }
  applicationType.value = RinkLineApplicationTypes.Form
}

const handleSave = async () => {
  const linesList = editLineNumberList.value.map((lineNumber, index) => ({ lineIndex: index + 1, lineNumber }))
  await putRinkLineGroupLineMembers(lineGroupId.value, { linesList })
  navigationGuard(false)
  router.back()
}

const handleDownloadCsv = async () => {
  try {
    const fileName = `RINK_Mobile_sharegroupList_${rinkMobileId.value}_${dayjs().format('YYYYMMDDHHmmss')}`
    const csv = Papa.unparse(formatCsvData(allLineList.value, rinkLineGroupList.value))
    await downloadCsv(csv, fileName)
  } catch {
    // ダウンロード失敗時は何もしない
  }
}

onBeforeMount(() => {
  getRinkLineGroupList(rinkMobileId.value)
  getAllRinkLineList(rinkMobileId.value)
})
</script>

<template>
  <CardContainer>
    <div
      v-if="!duringReceptionHours"
      class="mb-2 text-warning text-pre-wrap"
      data-cy="rink-mobile-line-groups-id-add-lines-outside-reception-hour"
    >
      {{ t('rinkConnections.message.outsideReceptionHour') }}
    </div>
    <!-- 契約内容の表示 -->
    <InnerCard :title="t('rinkLineGroups.contractInformation')">
      <DetailGrid>
        <div>{{ t('rinkConnections.rinkMobileId') }}</div>
        <div>{{ rinkMobileId }}</div>
      </DetailGrid>
      <DetailGrid v-if="lineGroupName">
        <div>{{ t('rinkLineGroups.lineGroupName') }}</div>
        <div>{{ lineGroupName }}</div>
      </DetailGrid>
    </InnerCard>

    <!-- 申込方法選択 -->
    <EditApplicationType
      v-if="!isConfirmation"
      v-model="applicationType"
      @download:excel="handleDownloadLocalPdfOrExcel"
      @upload:csv="handleUploadApplicationCsv"
    />

    <CustomButton
      v-if="applicationType === RinkLineApplicationTypes.Form && !isConfirmation"
      icon="download"
      :text="t('common.download')"
      :width="180"
      class="mb-4"
      @click="handleDownloadCsv"
    />

    <!-- 入力フォーム -->
    <EditRinkLine
      v-if="showEditRinkLine"
      v-model:line-number-list="editLineNumberList"
      :line-list="allLineList"
      :line-group-id="lineGroupId"
      edit-type="add"
      :is-confirmation="isConfirmation"
    />

    <div class="mt-8 flex-flex-end-center">
      <CancelButton
        v-model:is-confirmation="isConfirmation"
        class="mr-6"
        data-cy="rink-mobile-line-groups-id-add-lines-cancel-button"
        @cancel="router.back()"
      />
      <CustomButton
        icon="right-arrow"
        :disabled="submitDisabled"
        :width="180"
        :text="submit.text"
        data-cy="rink-mobile-line-groups-id-add-lines-submit-button"
        @click="submit.click"
      />
    </div>
  </CardContainer>
</template>
