<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { MIN_BUSINESS_DAYS_UNTIL_AVAILABLE } from '@/api/phoneTicketingSupport/constants'
import { ServiceClosedDaysServiceTypes } from '@/api/serviceClosedDays/constants'

const { t } = useI18n()
const { loading } = useLoading()
const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenantId as string)

const { navigationGuard } = useNavigationGuard()
navigationGuard(true)

const { getPhoneTicketingSupport, phoneTicketingSupport } = useGetPhoneTicketingSupport()
const { deletePhoneTicketingSupport } = useDeletePhoneTicketingSupport()
const { disabledDates, getServiceClosedDays, serviceClosedDaysFetchFailed } = useServiceClosedDays()

const { getOrderIdLink, orderStatusTypeTranslation } = useOrders()
const orderIdLink = computed(() =>
  getOrderIdLink({ tenantId: tenantId.value, orderId: phoneTicketingSupport.value?.orderId }),
)

const minDate = computed(() => calcMinDate(MIN_BUSINESS_DAYS_UNTIL_AVAILABLE, disabledDates))
const effectiveDate = ref('')
const inputValid = ref({
  effectiveDate: false,
})

const isConfirmation = ref(false)
watch(isConfirmation, () => window.scrollTo({ top: 0, behavior: 'smooth' }))

const submitDisabled = computed(
  () => Object.values(inputValid.value).some(valid => !valid) || serviceClosedDaysFetchFailed.value,
)
const handleSubmit = async () => {
  if (isConfirmation.value) {
    await deletePhoneTicketingSupport({ effectiveDate: effectiveDate.value })
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
      {{ t('phoneTicketingSupport.delete') }}
    </div>
    <InnerCard :title="`${t('sideBar.phoneTicketingSupport')} ${t('common.delete')}`">
      <DetailGrid>
        <div>{{ t('phoneTicketingSupport.supportId') }}</div>
        <div>{{ phoneTicketingSupport?.supportId }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('phoneTicketingSupport.supportUsage') }}</div>
        <div>{{ t('phoneTicketingSupport.enabled') }}</div>
      </DetailGrid>
      <InputGrid required :label="t('details.serviceEndDate')">
        <DatePicker
          v-model="effectiveDate"
          :min-date="minDate"
          :disabled-dates="disabledDates"
          required
          :disabled="isConfirmation || serviceClosedDaysFetchFailed"
          data-cy="phone-ticketing-support-remove-effective-date"
          @valid="(valid: boolean) => (inputValid.effectiveDate = valid)"
        />
      </InputGrid>
      <DetailGrid>
        <div>{{ t('phoneTicketingSupport.picName') }}</div>
        <div>{{ phoneTicketingSupport?.picName }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('phoneTicketingSupport.picPhoneNumber') }}</div>
        <div>{{ phoneTicketingSupport?.picPhoneNumber }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('phoneTicketingSupport.supportPhoneNumber') }}</div>
        <div>{{ phoneTicketingSupport?.supportPhoneNumber }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.orderId') }}</div>
        <NuxtLink :to="orderIdLink"> {{ phoneTicketingSupport?.orderId }}</NuxtLink>
      </DetailGrid>
      <DetailGrid v-if="phoneTicketingSupport?.orderStatus">
        <div>{{ t('details.orderStatus') }}</div>
        <div>{{ orderStatusTypeTranslation[phoneTicketingSupport.orderStatus] }}</div>
      </DetailGrid>
    </InnerCard>

    <div class="flex-flex-end-center pt-2">
      <CancelButton v-model:is-confirmation="isConfirmation" @cancel="router.back()" />
      <CustomButton
        class="ml-6"
        icon="right-arrow"
        :width="180"
        :disabled="submitDisabled || loading"
        :text="isConfirmation ? t('common.abolition') : t('common.confirm')"
        data-cy="phone-ticketing-support-remove-submit-button"
        @click="handleSubmit"
      />
    </div>
  </CardContainer>
</template>
