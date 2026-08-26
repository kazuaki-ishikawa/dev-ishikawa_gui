<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { TerminalTypes } from '@/api/constants'
import { initialGuaranteeIwanInputData, initialGuaranteeIwanValid } from '@/api/guarantees/constants'
import { ReserveDateTypes } from '@/api/hikariCollaboUtil/constants'
import { IPOE_LINK } from '@/api/ipoes/constants'

const { t } = useI18n()
const rules = useRules()
const route = useRoute()
const router = useRouter()
const guaranteeId = computed(() => route.params.id as string)

const { navigationGuard } = useNavigationGuard()
navigationGuard(true)

const { loading } = useLoading()
const { getTimeText } = useHikariCollaboUtils()
const { duringReceptionHours, NecessaryOptions } = useGuarantees()
const { guarantee, editable, removable, getGuarantee } = useGetGuarantee()
const { deleteGuarantee } = useDeleteGuarantee()
const { updateGuaranteeOrder } = useUpdateGuaranteeOrder()
const { resourceSummaryTerminalList, getAllResourceSummaryTerminalList } = useGetAllResourceSummaryTerminalList()
const { inProgressSwitchover, getTerminal } = useGetTerminal()

const inputData = ref({ ...initialGuaranteeIwanInputData })
const inputValid = ref({ ...initialGuaranteeIwanValid })
const openNotificationDialog = ref(false)

const removalReserveTime = computed(() => getTimeText(inputData.value.time))
const isOperationAdjustment = computed({
  get: () => inputData.value.operationAdjustment === 'true',
  set: (value: boolean) => {
    inputData.value.operationAdjustment = `${value}`
  },
})
watch(isOperationAdjustment, next => {
  // 入力項目とバリデーションを制御
  inputValid.value = { ...inputValid.value, date: next, time: next }
  inputData.value = {
    ...inputData.value,
    date: next ? '' : inputData.value.date,
    time: next ? '' : inputData.value.time,
  }
})

// 希望日選択ダイアログ
const openReserveDateDialog = ref(false)
const reservedDates = computed(() => ({ date: inputData.value.date, time: inputData.value.time }))
const handleReserveDateSubmit = (selected: { date: string; time: string }) => {
  openReserveDateDialog.value = false
  inputData.value = { ...inputData.value, ...selected }
  inputValid.value = { ...inputValid.value, date: true, time: true }
}
// 事前連絡先と同じボタン
const constructionPreContactChecked = ref(false)
const handleConstructionSamePreContactClick = (checked: boolean) => {
  constructionPreContactChecked.value = checked
  if (checked) {
    inputData.value = {
      ...inputData.value,
      attendanceCompanyName: inputData.value.preContactCompanyName,
      attendancePersonName: inputData.value.preContactPersonName,
      attendancePhoneNumber: inputData.value.preContactPhoneNumber,
    }
  }
}

const isConfirmation = ref(false)
watch(isConfirmation, () => window.scrollTo({ top: 0, behavior: 'smooth' }))

const invalid = computed(() => Object.values(inputValid.value).some(valid => !valid))
const submitDisabled = computed(
  () => !guarantee.value?.installationPlaceCode || invalid.value || (!editable.value && !removable.value),
)
const isOrderRequest = computed(() => !!guarantee.value?.removal && !!guarantee.value?.orderId)
const handleSubmit = async () => {
  if (isConfirmation.value) {
    if (isOrderRequest.value && !!guarantee.value?.orderId) {
      // 詳細の「回収日選択」からの遷移の場合はオーダー更新を使う
      await updateGuaranteeOrder(guarantee.value.orderId, {
        request: {
          removal: { date: inputData.value.date, time: inputData.value.time },
        },
      })
      navigationGuard(false)
      openNotificationDialog.value = true
    } else if (!isOrderRequest.value) {
      // 詳細の「廃止」からの遷移の場合は通常のDELETEを使う
      await deleteGuarantee(guaranteeId.value, {
        removal: {
          ...inputData.value,
          operationAdjustment: isOperationAdjustment.value,
          date: inputData.value.date || undefined,
          time: inputData.value.time || undefined,
          admissionApplicationRequired: inputData.value.admissionApplicationRequired === 'true',
        },
      })
      navigationGuard(false)
      openNotificationDialog.value = true
    }
  } else {
    isConfirmation.value = true
  }
}

const submit = computed(() => {
  const click = () => handleSubmit()
  const text = isConfirmation.value ? t('common.abolition') : t('common.confirm')
  return { click, text }
})

onBeforeMount(async () => {
  await getGuarantee(guaranteeId.value)

  if (guarantee.value?.removal) {
    inputData.value = {
      ...initialGuaranteeIwanInputData,
      operationAdjustment: `${guarantee.value.removal.operationAdjustment}`,
      admissionApplicationRequired: `${guarantee.value.removal.admissionApplicationRequired}`,
      preContactCompanyName: guarantee.value.removal.preContactCompanyName,
      preContactPersonName: guarantee.value.removal.preContactPersonName,
      preContactPhoneNumber: guarantee.value.removal.preContactPhoneNumber,
      attendanceCompanyName: guarantee.value.removal.attendanceCompanyName,
      attendancePersonName: guarantee.value.removal.attendancePersonName,
      attendancePhoneNumber: guarantee.value.removal.attendancePhoneNumber,
    }
    inputValid.value = {
      ...initialGuaranteeIwanValid,
      admissionApplicationRequired: true,
      preContactCompanyName: !!guarantee.value.removal.preContactCompanyName,
      preContactPersonName: !!guarantee.value.removal.preContactPersonName,
      preContactPhoneNumber: !!guarantee.value.removal.preContactPhoneNumber,
      attendanceCompanyName: !!guarantee.value.removal.attendanceCompanyName,
      attendancePersonName: !!guarantee.value.removal.attendancePersonName,
      attendancePhoneNumber: !!guarantee.value.removal.attendancePhoneNumber,
    }
  } else {
    // guarantee.removal がない場合は、迂回設定中の検証が必要になる
    if (guarantee.value?.terminalId) {
      await getAllResourceSummaryTerminalList({ terminalId: [guarantee.value.terminalId] })
      const terminalType = resourceSummaryTerminalList.value.terminals.find(
        terminal => terminal.terminalId === guarantee.value?.terminalId,
      )?.terminalType
      if (terminalType === TerminalTypes.Rental) {
        getTerminal(guarantee.value.terminalId)
      }
    }
    inputData.value = { ...initialGuaranteeIwanInputData }
    inputValid.value = { ...initialGuaranteeIwanValid }
  }
})
</script>

<template>
  <div>
    <CardContainer>
      <div v-if="isConfirmation" class="mb-4">
        {{ t('confirm.abolition') }}
      </div>
      <div
        v-if="!duringReceptionHours"
        class="text-warning mb-2 text-pre-wrap"
        data-cy="guarantees-circuits-id-remove-outside-reception-hour"
      >
        {{ t('guarantees.outsideReceptionHour') }}
      </div>
      <InnerCard :title="t('guarantees.basicInformation')">
        <DetailGrid>
          <div>{{ t('guarantees.guaranteeId') }}</div>
          <div>{{ guarantee?.guaranteeId }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('guarantees.customerNote') }}</div>
          <div>{{ guarantee?.customerNote }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('details.resourceStatus') }}</div>
          <div>{{ guarantee?.resourceStatus }}</div>
        </DetailGrid>
      </InnerCard>

      <InnerCard :title="t('guarantees.removalDateTime')">
        <template #button>
          <CustomButton
            icon="right-arrow"
            :text="t('guarantees.selectRemovalDateTime')"
            :width="250"
            :disabled="!duringReceptionHours || isConfirmation || isOperationAdjustment"
            data-cy="guarantees-circuits-id-remove-reserve-date-button"
            @click="openReserveDateDialog = true"
          />
        </template>
        <InputGrid
          :required="!isOrderRequest"
          :label="t('guarantees.admissionApplicationRequired')"
          :help="t('guarantees.help.admissionApplicationRequired')"
        >
          <RadioForm
            v-model="inputData.admissionApplicationRequired"
            :options="NecessaryOptions"
            :required="!isOrderRequest"
            :disabled="isConfirmation || isOrderRequest"
            data-cy="guarantees-circuits-id-remove-admission-application-required"
            @valid="(valid: boolean) => (inputValid.admissionApplicationRequired = valid)"
          />
        </InputGrid>
        <InputGrid required :label="t('guarantees.reserveDate')">
          <InputForm
            :model-value="`${formatDate(inputData.date)}  ${removalReserveTime}`"
            placeholder="2024-01-01"
            disabled
            data-cy="guarantees-circuits-id-remove-date-time"
          />
        </InputGrid>
        <InputGrid :label="t('guarantees.operationAdjustment')">
          <CheckboxBase
            v-model:value="isOperationAdjustment"
            :disabled="isConfirmation || isOrderRequest"
            data-cy="guarantees-circuits-id-remove-operation-adjustment"
          />
          <div v-if="isOperationAdjustment" class="text-warning text-sm text-pre-wrap">
            {{ t('guarantees.note.removeOperationAdjustment') }}
          </div>
        </InputGrid>
      </InnerCard>

      <InnerCard :title="t('guarantees.removalConstructionDetailsInformation')">
        <!-- 事前連絡先 -->
        <div class="pt-3 text-lg text-secondary">{{ t('guarantees.preContact') }}</div>
        <InputGrid :required="!isOrderRequest" :label="t('guarantees.preContactCompanyName')">
          <InputForm
            v-model="inputData.preContactCompanyName"
            :required="!isOrderRequest"
            :rules="[rules.fullwidthCharacter, rules.noConsecutiveSpaces]"
            maxlength="15"
            placeholder="株式会社"
            :disabled="isConfirmation || isOrderRequest"
            data-cy="guarantees-circuits-id-remove-pre-contact-company-name"
            @valid="(valid: boolean) => (inputValid.preContactCompanyName = valid)"
          />
        </InputGrid>
        <InputGrid :required="!isOrderRequest" :label="t('guarantees.preContactPersonName')">
          <InputForm
            v-model="inputData.preContactPersonName"
            :required="!isOrderRequest"
            :rules="[rules.fullwidthCharacter, rules.fullwidthSpace, rules.noConsecutiveSpaces]"
            maxlength="6"
            :placeholder="t('placeholder.name')"
            :disabled="isConfirmation || isOrderRequest"
            data-cy="guarantees-circuits-id-remove-pre-contact-person-name"
            @valid="(valid: boolean) => (inputValid.preContactPersonName = valid)"
          />
        </InputGrid>
        <InputGrid :required="!isOrderRequest" :label="t('guarantees.preContactPhoneNumber')">
          <InputForm
            v-model="inputData.preContactPhoneNumber"
            :required="!isOrderRequest"
            :rules="[rules.phoneNumber]"
            maxlength="13"
            placeholder="03-0000-0000"
            :disabled="isConfirmation || isOrderRequest"
            data-cy="guarantees-circuits-id-remove-pre-contact-phone-number"
            @valid="(valid: boolean) => (inputValid.preContactPhoneNumber = valid)"
          />
        </InputGrid>
        <!-- 立会者情報 -->
        <AttendanceInformationLabel
          :checked="constructionPreContactChecked"
          :show-checkbox="!isOrderRequest"
          :disabled="isConfirmation"
          data-cy="guarantees-circuits-id-remove-attendance-information-label"
          @update:checked="handleConstructionSamePreContactClick"
        />
        <InputGrid :required="!isOrderRequest" :label="t('guarantees.attendanceCompanyName')">
          <InputForm
            v-model="inputData.attendanceCompanyName"
            :required="!isOrderRequest"
            :rules="[rules.fullwidthCharacter, rules.noConsecutiveSpaces]"
            maxlength="15"
            placeholder="株式会社"
            :disabled="isConfirmation || constructionPreContactChecked || isOrderRequest"
            data-cy="guarantees-circuits-id-remove-attendance-company-name"
            @valid="(valid: boolean) => (inputValid.attendanceCompanyName = valid)"
          />
        </InputGrid>
        <InputGrid :required="!isOrderRequest" :label="t('guarantees.attendancePersonName')">
          <InputForm
            v-model="inputData.attendancePersonName"
            :required="!isOrderRequest"
            :rules="[rules.fullwidthCharacter, rules.fullwidthSpace, rules.noConsecutiveSpaces]"
            maxlength="6"
            :placeholder="t('placeholder.name')"
            :disabled="isConfirmation || constructionPreContactChecked || isOrderRequest"
            data-cy="guarantees-circuits-id-remove-attendance-person-name"
            @valid="(valid: boolean) => (inputValid.attendancePersonName = valid)"
          />
        </InputGrid>
        <InputGrid :required="!isOrderRequest" :label="t('guarantees.attendancePhoneNumber')">
          <InputForm
            v-model="inputData.attendancePhoneNumber"
            :required="!isOrderRequest"
            :rules="[rules.phoneNumber]"
            maxlength="13"
            placeholder="03-0000-0000"
            :disabled="isConfirmation || constructionPreContactChecked || isOrderRequest"
            data-cy="guarantees-circuits-id-remove-attendance-phone-number"
            @valid="(valid: boolean) => (inputValid.attendancePhoneNumber = valid)"
          />
        </InputGrid>
      </InnerCard>

      <div class="grid-flow-col justify-end ga-4">
        <CancelButton
          v-model:is-confirmation="isConfirmation"
          data-cy="guarantees-circuits-id-remove-cancel-button"
          @cancel="router.back()"
        />
        <CustomButton
          icon="right-arrow"
          :text="submit.text"
          :width="180"
          :disabled="!duringReceptionHours || submitDisabled || loading || inProgressSwitchover"
          data-cy="guarantees-circuits-id-remove-submit-button"
          @click="submit.click"
        />
      </div>
    </CardContainer>
    <GuaranteeReserveDateDialog
      :open="openReserveDateDialog"
      :installation-place-code="guarantee?.installationPlaceCode ?? ''"
      :type="ReserveDateTypes.Removal"
      :reserved-dates="reservedDates"
      @close="openReserveDateDialog = false"
      @submit="handleReserveDateSubmit"
    />
    <DialogBase
      :open="openNotificationDialog"
      :submit-label="t('common.close')"
      :submit-width="280"
      submit-color="info"
      @submit="router.back()"
      @close="router.back()"
    >
      <i18n-t
        v-if="isOperationAdjustment"
        keypath="guarantees.createTicketMessage"
        tag="div"
        scope="global"
        class="text-center text-pre-wrap"
      >
        <template #menu>{{ t('common.delete') }}</template>
        <template #angora1>
          <NuxtLink :to="IPOE_LINK.LOGIN" target="_blank">{{ t('common.here') }}</NuxtLink>
        </template>
        <template #angora2>
          <NuxtLink :to="IPOE_LINK.TICKET" target="_blank">{{ t('common.here') }}</NuxtLink>
        </template>
      </i18n-t>
      <div v-else class="text-center text-lg">
        {{ t('guarantees.removedMessage') }}
      </div>
    </DialogBase>
  </div>
</template>

<style lang="scss" scoped>
.grid-flow-col {
  display: grid;
  grid-auto-flow: column;
}
</style>
