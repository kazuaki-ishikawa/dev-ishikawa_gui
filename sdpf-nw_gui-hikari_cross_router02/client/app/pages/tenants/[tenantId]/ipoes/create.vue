<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { ReserveDateTypes } from '@/api/hikariCollaboUtil/constants'
import { IPOE_LINK, RequestTypes } from '@/api/ipoes/constants'
import type { IpoeType, FletsSeparatePostRequest, HikariCollaboPostRequest } from '@/api/ipoes/types'

const { t } = useI18n()
const { navigationGuard } = useNavigationGuard()

const requestType = ref({ input: '', valid: false })
watch(requestType, () => {
  navigationGuard(requestType.value.valid)
})

const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenantId as string)

const { requestTypeOptions } = useIpoes()
const { disabledFletsSeparateApplication } = useApplicationRestriction()
const { createFletsSeparate } = useCreateFletsSeparate()
const handleCreateFletsSeparate = async (request: FletsSeparatePostRequest) => {
  await createFletsSeparate(request)
  // フレッツ回線別契約回線の新規作成に成功した場合、直前の画面（一覧）に戻る
  navigationGuard(false)
  router.back()
}
const { createHikariCollaboResponse, createHikariCollabo } = useCreateHikariCollabo()
const handleCreateHikariCollabo = async (request: HikariCollaboPostRequest) => {
  await createHikariCollabo(request)
  // 光コラボ回線の新規作成に成功した場合、工事日予約画面を開く
  navigationGuard(false)
  applicantConfirmDialog.value = true
}

const ipoeId = computed(() => createHikariCollaboResponse.value?.ipoeId ?? '')
const { hikariCollabo, getHikariCollabo } = useGetIpoe()
const { customerNoteList, getAllSummaryIpoeList } = useGetAllSummaryIpoeList()
const { availableTime, checkAvailableTime } = useCheckAvailableTime()
const { contractor, getContractor } = useGetContractor()

const applicantConfirmDialog = ref(false)
const fieldSurveyReserveDialog = ref(false)
const constructionReserveDialog = ref(false)

const isConfirmation = ref(false)
const changeConfirmation = (bool: boolean) => (isConfirmation.value = bool)
watch(isConfirmation, () => window.scrollTo({ top: 0, behavior: 'smooth' }))

const ticketIssueRequirement = computed(() => !!createHikariCollaboResponse.value?.ticketIssueRequirement)
const fieldSurveyRequirement = computed(() => !!createHikariCollaboResponse.value?.fieldSurveyRequirement)
const siteRouteSurvey = computed(() => !!createHikariCollaboResponse.value?.constructionOption?.siteRouteSurvey)

const formedRequestTypeOptions = computed(() =>
  requestTypeOptions.map(option => ({
    text: option.text,
    value: option.value as string,
    disabled:
      (option.value === RequestTypes.HikariCollabo &&
        (!availableTime?.value?.available || !contractor.value?.addressCode)) ||
      (option.value === RequestTypes.FletsSeparate && disabledFletsSeparateApplication),
  })),
)
const subLabelReason = computed(() => {
  // 取得前・取得失敗時は受付時間・住所コードの判定ができないため、理由を表示しない
  if (!availableTime.value || !contractor.value) {
    return ''
  }
  return !availableTime.value.available ? 'availableTime' : !contractor.value.addressCode ? 'addressCode' : ''
})

const backToList = () => {
  router.back()
}

const confirmDialog = computed(() => {
  if (ticketIssueRequirement.value) {
    return { submit: backToList }
  } else if (applicantConfirmDialog.value) {
    return {
      text: t('ipoeConstruction.createdMessage'),
      warning: t('ipoeConstruction.createdWarningMessage'),
      submit: () => {
        applicantConfirmDialog.value = false
        fieldSurveyReserveDialog.value = fieldSurveyRequirement.value || siteRouteSurvey.value
        constructionReserveDialog.value = !fieldSurveyRequirement.value && !siteRouteSurvey.value
      },
      submitLabel: t('ipoeConstruction.moveToApplicantion'),
      close: backToList,
      cancelLabel: t('common.close'),
    }
  }
  return undefined
})

// 宅内工事は、現地調査の次に予約する場合と、新規作成直後に予約する場合があるため
// 宅内工事の予約時に使う 光コラボ回線の情報  は、再取得した値 または 新規作成した値 を使う
const constructionReserveHikariCollabo = computed(() => hikariCollabo.value || createHikariCollaboResponse.value)
const fieldSurveyReserveDialogSubmit = async () => {
  await getHikariCollabo(ipoeId.value)
  fieldSurveyReserveDialog.value = false
  constructionReserveDialog.value = true
}
const reserveDialogClose = () => {
  fieldSurveyReserveDialog.value = false
  constructionReserveDialog.value = false
  backToList()
}
// 広告
// 17683: キャンペーンページ画面は不要になったが、必要になる可能性があるため削除はしない
// 再表示する場合は true に戻し、キャンペーン関連のテストも修正する
const showPR = ref(false)
const ipoeType = ref<IpoeType>()
const applyInCPPage = (type: IpoeType) => {
  ipoeType.value = type
  showPR.value = false
}

onBeforeMount(() => {
  checkAvailableTime()
  getContractor()
  getAllSummaryIpoeList()
})
</script>

<template>
  <CardContainer>
    <WidePlanCP v-if="showPR" @apply-plan="applyInCPPage" />
    <div v-if="isConfirmation" class="mb-4">
      {{ t('confirm.create') }}
    </div>
    <InnerCard v-if="!showPR" :title="t('ipoes.requestType')">
      <template #help>
        <i18n-t keypath="ipoes.help.requestType" scope="global">
          <template #flets>
            <NuxtLink :to="IPOE_LINK.FLETS" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
          <template #fiber>
            <NuxtLink :to="IPOE_LINK.FIBER" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
        </i18n-t>
      </template>
      <RadioForm
        v-model="requestType.input"
        :options="formedRequestTypeOptions"
        :disabled="isConfirmation"
        required
        class="pt-3"
        data-cy="ipoe-create-request-type-radio-button"
        @valid="(valid: boolean) => (requestType.valid = valid)"
      >
        <template #sublabel="{ disabled, value }: { disabled: boolean; value: string }">
          <template v-if="disabled && value === RequestTypes.HikariCollabo">
            <div v-if="subLabelReason === 'availableTime'" class="pt-2 text-warning">
              {{ t('ipoes.message.outsideReceptionHour') }}
            </div>
            <i18n-t
              v-if="subLabelReason === 'addressCode'"
              tag="div"
              keypath="ipoes.message.addressCodeRequired"
              scope="global"
              class="pt-2 text-warning"
            >
              <template #contractor>
                <NuxtLink :to="`/tenants/${tenantId}/contracts/contractor`" class="text-warning">
                  {{ t('sideBar.contractor') }}
                </NuxtLink>
              </template>
            </i18n-t>
          </template>
        </template>
      </RadioForm>
    </InnerCard>
    <FletsSeparateCreate
      v-if="requestType.input === RequestTypes.FletsSeparate"
      v-model:is-confirmation="isConfirmation"
      :ipoe-type="ipoeType"
      :customer-note-list="customerNoteList"
      @submit="handleCreateFletsSeparate"
      @cancel="backToList"
      @confirm="changeConfirmation"
    />
    <HikariCollaboNewCreate
      v-if="requestType.input === RequestTypes.HikariCollabo"
      :ipoe-type="ipoeType"
      :is-confirmation="isConfirmation"
      :customer-note-list="customerNoteList"
      @submit="handleCreateHikariCollabo"
      @cancel="backToList"
      @confirm="changeConfirmation"
    />

    <DialogBase
      :open="ticketIssueRequirement || applicantConfirmDialog"
      :submit-label="confirmDialog?.submitLabel ?? t('common.close')"
      :cancel-label="confirmDialog?.cancelLabel"
      @submit="confirmDialog?.submit"
      @close="confirmDialog?.close"
    >
      <i18n-t
        v-if="ticketIssueRequirement"
        keypath="ipoeConstruction.createTicketMessage"
        tag="div"
        scope="global"
        class="text-center text-pre-wrap"
      >
        <template #angora1>
          <NuxtLink :to="IPOE_LINK.LOGIN" target="_blank">
            {{ t('common.here') }}
          </NuxtLink>
        </template>
        <template #angora2>
          <NuxtLink :to="IPOE_LINK.TICKET" target="_blank">
            {{ t('common.here') }}
          </NuxtLink>
        </template>
      </i18n-t>
      <div v-else class="text-center">
        <div>{{ confirmDialog?.text }}</div>
        <div class="text-warning mt-6 text-pre-wrap">{{ confirmDialog?.warning }}</div>
      </div>
    </DialogBase>
    <ReserveDateDialog
      v-if="!!createHikariCollaboResponse"
      :type="ReserveDateTypes.FieldSurvey"
      :open="fieldSurveyReserveDialog"
      :hikari-collabo="createHikariCollaboResponse"
      @submit="fieldSurveyReserveDialogSubmit"
      @close="reserveDialogClose"
    />
    <ReserveDateDialog
      v-if="!!constructionReserveHikariCollabo"
      :type="ReserveDateTypes.Construction"
      :open="constructionReserveDialog"
      :hikari-collabo="constructionReserveHikariCollabo"
      @submit="reserveDialogClose"
      @close="reserveDialogClose"
    />
  </CardContainer>
</template>
