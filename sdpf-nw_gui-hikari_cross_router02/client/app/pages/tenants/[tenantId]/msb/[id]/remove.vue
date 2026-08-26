<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { initialMsbDeleteInputData, initialMsbDeleteValid } from '@/api/msb/constants'
import type { MsbDeleteRequest } from '@/api/msb/types'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const rules = useRules()
const tenantId = computed(() => route.params.tenantId as string)

const inputData = ref({ ...initialMsbDeleteInputData })
const inputValid = ref({ ...initialMsbDeleteValid })

const { loading } = useLoading()
const { navigationGuard } = useNavigationGuard()
navigationGuard(true)

const { msb, getMsb } = useGetMsb()
const { deleteMsb } = useDeleteMsb()

const isConfirmation = ref(false)
const disabled = computed(() => Object.values(inputValid.value).some(valid => !valid))

const switchConfirm = () => {
  isConfirmation.value = !isConfirmation.value
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleDelete = async () => {
  if (!msb.value?.resourceId) {
    return
  }
  const request: MsbDeleteRequest = {
    reason: inputData.value.reason,
    emailAddress: inputData.value.emailAddress,
    customerSpecialNote: inputData.value.customerSpecialNote || null,
  }
  await deleteMsb(msb.value.resourceId, request)
  navigationGuard(false)
  await navigateTo({ path: `/tenants/${tenantId.value}/msb` }, { replace: true })
}

onBeforeMount(() => getMsb({ showNotFoundError: true }))
</script>

<template>
  <CardContainer>
    <InnerCard :title="t('msb.customerInformation')">
      <InputGrid required :label="t('msb.reason')">
        <InputForm
          v-model="inputData.reason"
          :rules="[rules.fullwidthCharacter]"
          maxlength="254"
          required
          placeholder="廃止理由"
          :disabled="isConfirmation"
          data-cy="msb-id-remove-reason"
          @valid="valid => (inputValid.reason = valid)"
        />
      </InputGrid>
      <InputGrid
        required
        :label="t('msb.deprecationNoticeEmailAddress')"
        :help="t('msb.help.deprecationNoticeEmailAddress')"
      >
        <InputForm
          v-model="inputData.emailAddress"
          :rules="[rules.mailAddress]"
          maxlength="254"
          required
          placeholder="mail@example.com"
          :disabled="isConfirmation"
          data-cy="msb-id-remove-email-address"
          @valid="valid => (inputValid.emailAddress = valid)"
        />
      </InputGrid>
      <InputGrid :label="t('msb.customerSpecialNote')">
        <InputForm
          v-model="inputData.customerSpecialNote"
          :rules="[rules.fullwidthCharacter]"
          maxlength="254"
          placeholder="弊社個別案内時記入"
          :disabled="isConfirmation"
          data-cy="msb-id-remove-customer-special-note"
          @valid="valid => (inputValid.customerSpecialNote = valid)"
        />
      </InputGrid>
    </InnerCard>

    <div class="flex-flex-end-center pt-2">
      <CancelButton
        v-model:is-confirmation="isConfirmation"
        @cancel="isConfirmation ? switchConfirm() : router.back()"
      />
      <CustomButton
        class="ml-6"
        icon="right-arrow"
        color="warning"
        :disabled="disabled || loading"
        :width="180"
        :text="isConfirmation ? t('common.delete') : t('common.confirm')"
        data-cy="msb-id-remove-submit-button"
        @click="isConfirmation ? handleDelete() : switchConfirm()"
      />
    </div>
  </CardContainer>
</template>
