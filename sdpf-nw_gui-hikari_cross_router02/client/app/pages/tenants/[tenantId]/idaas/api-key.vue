<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { GmoApiKeyPostRequest } from '@/api/gmoApiKey/types'
import { IDAAS_LINK } from '@/api/threatInfo/constants'

const { t } = useI18n()
const { loading } = useLoading()
const route = useRoute()
const rules = useRules()
const tenantId = computed(() => route.params.tenantId as string)

const { gmoApiKey, getGmoApiKey, createGmoApiKey, deleteGmoApiKey } = useGmoApiKey()
const inputData = ref<GmoApiKeyPostRequest>({ gmoApiKey: '' })
const inputValid = ref({ gmoApiKey: false })

const id = computed(() => gmoApiKey.value?.id ?? '')

const openDialog = ref<boolean>(false)
const openDeleteConfirmDialog = ref<boolean>(false)

const handleCreateGmoApiKey = async () => {
  try {
    await createGmoApiKey(inputData.value)
    inputData.value.gmoApiKey = ''
    inputValid.value.gmoApiKey = false
    openDialog.value = true
  } catch {
    // エラーハンドリングは useGmoApiKey で完結しているため、ここでは何もしない
  }
}
const handleDeleteGmoApiKey = async () => {
  try {
    await deleteGmoApiKey(id.value)
  } finally {
    openDeleteConfirmDialog.value = false
  }
}

const moveToAuthenticationRiskReports = async () => {
  await navigateTo(`/tenants/${tenantId.value}/idaas/authentication-risk-reports`)
}

onBeforeMount(() => {
  getGmoApiKey()
})
</script>

<template>
  <LoadingAnimation v-if="loading">
    <div class="text-center">{{ t('trafficDetails.loadingMessage') }}</div>
  </LoadingAnimation>
  <CardContainer v-else>
    <i18n-t
      v-if="!id"
      keypath="idaas.message.create.text"
      tag="div"
      scope="global"
      class="mb-5"
      data-cy="idaas-gmo-api-key-create-message"
    >
      <template #linkText>
        <NuxtLink :to="IDAAS_LINK.REGISTER_API_KEY_MANUAL" target="_blank">
          {{ t('idaas.message.create.linkText') }}
        </NuxtLink>
      </template>
    </i18n-t>
    <InnerCard :title="t('idaas.apiKeyInformation')">
      <InputGrid v-if="!id" required :label="t('idaas.apiKeyToken')">
        <InputForm
          v-model="inputData.gmoApiKey"
          maxlength="44"
          required
          :rules="[rules.gmoApiKey]"
          data-cy="idaas-gmo-api-key-create-gmo-api-key"
          @valid="(valid: boolean) => (inputValid.gmoApiKey = valid)"
        />
      </InputGrid>
      <DetailGrid v-else :title="t('idaas.apiKeyInformation')">
        <div>{{ t('idaas.apiKeyToken') }}</div>
        <div data-cy="idaas-gmo-api-key-detail-gmo-api-key">{{ t('idaas.registered') }}</div>
      </DetailGrid>
    </InnerCard>
    <div class="flex-flex-end-center mt-4">
      <CustomButton
        v-if="!id"
        icon="right-arrow"
        :width="180"
        :text="t('common.register')"
        :disabled="!inputValid.gmoApiKey || loading"
        data-cy="idaas-gmo-api-key-create-button"
        @click="handleCreateGmoApiKey"
      />
      <CustomButton
        v-else
        icon="right-arrow"
        color="warning"
        :width="180"
        :text="t('idaas.delete')"
        data-cy="idaas-gmo-api-key-delete-button"
        @click="() => (openDeleteConfirmDialog = true)"
      />
    </div>
    <DialogBase
      :open="openDialog"
      :submit-label="t('idaas.authenticationRiskReports')"
      :cancel-label="t('common.close')"
      :cancel-icon="'right-arrow'"
      :disabled="loading"
      :submit-width="180"
      @submit="moveToAuthenticationRiskReports"
      @close="() => (openDialog = false)"
    >
      <div class="mb-4 text-center" data-cy="idaas-gmo-api-key-create-dialog-content">{{ t('idaas.message.created') }}</div>
    </DialogBase>
    <DialogBase
      :open="openDeleteConfirmDialog"
      :submit-label="t('idaas.delete')"
      submit-color="warning"
      :cancel-label="t('common.cancel')"
      :cancel-icon="'right-arrow'"
      :disabled="loading"
      @submit="handleDeleteGmoApiKey"
      @close="() => (openDeleteConfirmDialog = false)"
    >
      <div class="text-pre-wrap mb-4 text-center" data-cy="idaas-gmo-api-key-delete-confirm-dialog-content">
        {{ t('idaas.message.deleteConfirm') }}
      </div>
    </DialogBase>
  </CardContainer>
</template>
