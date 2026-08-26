<script lang="ts" setup>
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { navigationGuard } = useNavigationGuard()
const rules = useRules()
const { loading } = useLoading()
const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenantId as string)

const { getPhoneTicketingSupport, phoneTicketingSupport, editable } = useGetPhoneTicketingSupport()
const { updatePhoneTicketingSupport } = useUpdatePhoneTicketingSupport()

const { getOrderIdLink, orderStatusTypeTranslation } = useOrders()
const orderIdLink = computed(() =>
  getOrderIdLink({ tenantId: tenantId.value, orderId: phoneTicketingSupport.value?.orderId }),
)

const updatePhoneTicketingSupportRequest = ref({
  picName: '',
  picPhoneNumber: '',
})
const inputValid = ref({
  picName: true,
  picPhoneNumber: true,
})
const isConfirmation = ref(false)
watch(isConfirmation, () => window.scrollTo({ top: 0, behavior: 'smooth' }))

const originalData = computed(() => ({
  picName: phoneTicketingSupport.value?.picName ?? '',
  picPhoneNumber: phoneTicketingSupport.value?.picPhoneNumber ?? '',
}))

watchEffect(() => {
  navigationGuard(!isEqual(updatePhoneTicketingSupportRequest.value, originalData.value))
})

const submitDisabled = computed(
  () =>
    !editable.value ||
    isEqual(updatePhoneTicketingSupportRequest.value, originalData.value) ||
    Object.values(inputValid.value).some(valid => !valid),
)

const handleSubmit = async () => {
  if (isConfirmation.value) {
    await updatePhoneTicketingSupport(updatePhoneTicketingSupportRequest.value)
    navigationGuard(false)
    router.back()
  } else {
    isConfirmation.value = true
  }
}

onBeforeMount(async () => {
  await getPhoneTicketingSupport()
  updatePhoneTicketingSupportRequest.value = {
    picName: phoneTicketingSupport.value?.picName ?? '',
    picPhoneNumber: phoneTicketingSupport.value?.picPhoneNumber ?? '',
  }
})
</script>

<template>
  <CardContainer>
    <div v-if="isConfirmation" class="mb-2">
      {{ t('phoneTicketingSupport.update') }}
    </div>
    <InnerCard :title="`${t('sideBar.phoneTicketingSupport')} ${t('common.edit')}`">
      <DetailGrid>
        <div>{{ t('phoneTicketingSupport.supportId') }}</div>
        <div>{{ phoneTicketingSupport?.supportId }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('phoneTicketingSupport.supportUsage') }}</div>
        <div>{{ t('phoneTicketingSupport.enabled') }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.serviceStartDate') }}</div>
        <div>{{ formatDate(phoneTicketingSupport?.effectiveDate) }}</div>
      </DetailGrid>
      <InputGrid required :label="t('phoneTicketingSupport.picName')">
        <InputForm
          v-model="updatePhoneTicketingSupportRequest.picName"
          :rules="[rules.fullwidthCharacter, rules.fullwidthSpace]"
          maxlength="20"
          required
          :placeholder="t('placeholder.name')"
          :disabled="isConfirmation"
          data-cy="phone-ticketing-support-edit-pic-name"
          @valid="(valid: boolean) => (inputValid.picName = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('phoneTicketingSupport.picPhoneNumber')">
        <InputForm
          v-model="updatePhoneTicketingSupportRequest.picPhoneNumber"
          :rules="[rules.phoneNumber]"
          maxlength="13"
          required
          placeholder="03-1234-5678"
          :disabled="isConfirmation"
          data-cy="phone-ticketing-support-edit-pic-phone-number"
          @valid="(valid: boolean) => (inputValid.picPhoneNumber = valid)"
        />
      </InputGrid>
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
      <CancelButton
        v-model:is-confirmation="isConfirmation"
        data-cy="phone-ticketing-support-edit-cancel-button"
        @cancel="router.back()"
      />
      <CustomButton
        class="ml-6"
        icon="right-arrow"
        :width="180"
        :disabled="submitDisabled || loading"
        :text="isConfirmation ? t('common.save') : t('common.confirm')"
        data-cy="phone-ticketing-support-edit-save-button"
        @click="handleSubmit"
      />
    </div>
  </CardContainer>
</template>
