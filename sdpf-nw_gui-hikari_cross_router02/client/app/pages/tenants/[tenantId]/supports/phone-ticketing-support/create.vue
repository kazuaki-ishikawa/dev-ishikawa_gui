<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { MIN_BUSINESS_DAYS_UNTIL_AVAILABLE } from '@/api/phoneTicketingSupport/constants'
import { ServiceClosedDaysServiceTypes } from '@/api/serviceClosedDays/constants'

const { t } = useI18n()
const rules = useRules()
const { loading } = useLoading()
const router = useRouter()

const isConfirmation = ref(false)
const { navigationGuard } = useNavigationGuard()
navigationGuard(true)

const { getPhoneTicketingSupport, editable, status } = useGetPhoneTicketingSupport()
const { createPhoneTicketingSupport } = useCreatePhoneTicketingSupport()
const { disabledDates, getServiceClosedDays, serviceClosedDaysFetchFailed } = useServiceClosedDays()

const createPhoneTicketingSupportRequest = ref({
  effectiveDate: '',
  picName: '',
  picPhoneNumber: '',
})
const inputValid = ref({
  effectiveDate: false,
  picName: false,
  picPhoneNumber: false,
})

const minDate = computed(() => calcMinDate(MIN_BUSINESS_DAYS_UNTIL_AVAILABLE, disabledDates))

const submitDisabled = computed(
  () =>
    status.value !== PhoneTicketingSupportStatus.Deleted ||
    !editable.value ||
    Object.values(inputValid.value).some(valid => !valid) ||
    serviceClosedDaysFetchFailed.value,
)
const handleSubmit = async () => {
  if (isConfirmation.value) {
    await createPhoneTicketingSupport(createPhoneTicketingSupportRequest.value)
    navigationGuard(false)
    router.back()
  } else {
    isConfirmation.value = true
  }
}

onBeforeMount(() => {
  getServiceClosedDays(ServiceClosedDaysServiceTypes.PhoneTicketingSupport)
  getPhoneTicketingSupport()
})
</script>

<template>
  <CardContainer>
    <div v-if="isConfirmation" class="mb-2">
      <div class="mb-2">{{ t('phoneTicketingSupport.create') }}</div>
    </div>
    <InnerCard :title="`${t('sideBar.phoneTicketingSupport')} ${t('common.createNew')}`">
      <InputGrid required :label="t('details.serviceStartDate')">
        <DatePicker
          v-model="createPhoneTicketingSupportRequest.effectiveDate"
          :min-date="minDate"
          :disabled-dates="disabledDates"
          required
          :disabled="isConfirmation || serviceClosedDaysFetchFailed"
          data-cy="phone-ticketing-support-create-effective-date"
          @valid="(valid: boolean) => (inputValid.effectiveDate = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('phoneTicketingSupport.picName')">
        <InputForm
          v-model="createPhoneTicketingSupportRequest.picName"
          :rules="[rules.fullwidthCharacter, rules.fullwidthSpace]"
          maxlength="20"
          required
          :placeholder="t('placeholder.name')"
          :disabled="isConfirmation"
          data-cy="phone-ticketing-support-create-pic-name"
          @valid="(valid: boolean) => (inputValid.picName = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('phoneTicketingSupport.picPhoneNumber')">
        <InputForm
          v-model="createPhoneTicketingSupportRequest.picPhoneNumber"
          :rules="[rules.phoneNumber]"
          maxlength="13"
          required
          placeholder="03-1234-5678"
          :disabled="isConfirmation"
          data-cy="phone-ticketing-support-create-pic-phone-number"
          @valid="(valid: boolean) => (inputValid.picPhoneNumber = valid)"
        />
      </InputGrid>
    </InnerCard>

    <div class="flex-flex-end-center mt-5">
      <CancelButton v-model:is-confirmation="isConfirmation" @cancel="router.back()" />
      <CustomButton
        class="ml-6"
        icon="right-arrow"
        :width="180"
        :disabled="submitDisabled || loading"
        :text="isConfirmation ? t('common.create') : t('common.confirm')"
        data-cy="phone-ticketing-support-create-submit-button"
        @click="handleSubmit"
      />
    </div>
  </CardContainer>
</template>
