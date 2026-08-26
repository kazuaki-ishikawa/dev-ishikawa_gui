<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { TenantReferenceAuthKeyCategoryTypes } from '@/api/tenantReferenceAuthKey/constants'
import { TermsOfServiceBasePath } from '@/api/termsOfService/constants'

const route = useRoute()
const { t } = useI18n()
const rules = useRules()
const { loading } = useLoading()

const { createTenantReferenceAuthKey } = useCreateTenantReferenceAuthKey()
const { securityTermsOfServiceAccepted, moveToSecurityTermOfService } = useTermsOfService(
  TermsOfServiceBasePath.Security,
)
const { setNotificationMessageState } = useNotificationDialog()

const tenantId = computed(() => route.params.tenantId as string)
const inputMailAddress = ref<string[]>([''])
const inputValid = ref(false)
const openDialog = ref(false)

const handleDialogOpen = () => {
  inputMailAddress.value = inputMailAddress.value.filter(Boolean)
  openDialog.value = true
}
const handleSubmit = async () => {
  try {
    await createTenantReferenceAuthKey({
      category: TenantReferenceAuthKeyCategoryTypes.ThreatDetectionShared,
      mailAddress: inputMailAddress.value,
    })
    setNotificationMessageState({ message: t('threatDetectionShared.message.createdAuthKey') })
  } catch (error) {
    console.error(error)
  } finally {
    openDialog.value = false
  }
}
</script>

<template>
  <CardContainer>
    <div v-if="!securityTermsOfServiceAccepted">
      <CustomButton
        icon="up-right-square"
        :text="t('terms.confirmation')"
        :width="180"
        class="ml-auto"
        data-cy="security-contracts-threat-detection-shared-create-auth-key-terms-of-service-button"
        @click="() => moveToSecurityTermOfService(tenantId)"
      />
      <div
        class="text-warning mb-4"
        data-cy="security-contracts-threat-detection-shared-create-auth-key-terms-of-service-message"
      >
        {{ t('threatDetectionShared.message.requiredSecurityAccepted') }}
      </div>
    </div>

    <InnerCard :title="t('threatDetectionShared.createAuthKey')">
      <template #description>
        <div class="my-2">{{ t('threatDetectionShared.message.createAuthKey') }}</div>
        <div class="text-sm text-warning text-pre-wrap">{{ t('threatDetectionShared.note.createAuthKey') }}</div>
      </template>
      <InputGrid required :label="t('threatDetectionShared.mailAddress')">
        <MultipleInputForm
          v-model:values="inputMailAddress"
          required
          :rules="[rules.mailAddress]"
          :min-items="1"
          :max-items="5"
          :maxlength="60"
          :disabled="!securityTermsOfServiceAccepted"
          placeholder="example@test.com"
          data-cy="security-contracts-threat-detection-shared-create-auth-key-mail-address"
          @valid="(valid: boolean) => (inputValid = valid)"
        />
      </InputGrid>
      <div class="flex-flex-end-center ga-6 mt-4">
        <ClearButton
          :text="t('search.clear')"
          :width="180"
          data-cy="security-contracts-threat-detection-shared-create-auth-key-clear-button"
          @click="inputMailAddress = ['']"
        />
        <CustomButton
          :text="t('common.create')"
          :width="180"
          :disabled="loading || !inputValid || !securityTermsOfServiceAccepted"
          icon="right-arrow"
          data-cy="security-contracts-threat-detection-shared-create-auth-key-submit-button"
          @click="handleDialogOpen"
        />
      </div>
    </InnerCard>
    <DialogBase
      :open="openDialog"
      :submit-label="t('common.send')"
      :cancel-label="t('common.cancel')"
      cancel-icon="left-arrow"
      :disabled="loading"
      @submit="handleSubmit"
      @close="openDialog = false"
    >
      <div class="text-center text-pre-wrap">
        <div>{{ t('threatDetectionShared.message.confirmCreateAuthKey') }}</div>
        <div class="my-4">{{ inputMailAddress.join('\n') }}</div>
      </div>
    </DialogBase>
  </CardContainer>
</template>
