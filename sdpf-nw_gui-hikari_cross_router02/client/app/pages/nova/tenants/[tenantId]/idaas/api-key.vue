<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ErrorResponse } from '@/api/types'
import { RouteName } from '@/route/constants'
import type { GmoApiKeyPostRequest } from '@/api/gmoApiKey/types'
import { IDAAS_LINK } from '@/api/threatInfo/constants'
import type { ButtonType } from '@/components/nova/idaas/types'
import { ButtonTypes } from '@/components/nova/idaas/constants'

definePageMeta({
  name: RouteName.IDaaS.ApiKeySetting,
})

const Modes = {
  Detail: 'detail',
  CreateComplete: 'createComplete',
  CreateFail: 'createFail',
  DeleteComplete: 'deleteComplete',
} as const
type Mode = (typeof Modes)[keyof typeof Modes]

const { t } = useI18n()
const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)
const rules = useRules()
const { loading } = useLoading()

const { gmoApiKey, getGmoApiKey, createGmoApiKey, deleteGmoApiKey } = useGmoApiKey()

const mode = ref<Mode>()
const inputData = ref<GmoApiKeyPostRequest>({ gmoApiKey: '' })
const formValid = ref<boolean | null>(null)
const openDeleteDialog = ref<boolean>(false)

const id = computed(() => gmoApiKey.value?.id ?? '')

const resultCard = computed(() => {
  if (mode.value === Modes.CreateFail) {
    return {
      title: t('nova.apiKeySetting.createFail'),
      text: t('nova.apiKeySetting.note.createFail'),
      buttonType: ButtonTypes.MoveToSetting,
    }
  } else if (mode.value === Modes.CreateComplete) {
    return {
      title: t('nova.apiKeySetting.createComplete'),
      text: t('nova.apiKeySetting.note.createComplete'),
      buttonType: ButtonTypes.MoveToReport,
    }
  } else if (mode.value === Modes.DeleteComplete) {
    return {
      title: t('nova.apiKeySetting.deleteComplete'),
      text: t('nova.apiKeySetting.note.deleteComplete'),
      buttonType: ButtonTypes.MoveToSetting,
    }
  }
  return { title: '', text: '' }
})

const handleResultClick = (type?: ButtonType) => {
  if (type === ButtonTypes.MoveToReport) {
    navigateTo({ name: RouteName.IDaaS.AuthenticationRiskReports, params: { tenantId: tenantId.value } })
  } else {
    mode.value = Modes.Detail
  }
}

const moveToManual = () => {
  navigateTo(IDAAS_LINK.REGISTER_API_KEY_MANUAL, {
    open: { target: '_blank', windowFeatures: { noopener: true, noreferrer: true } },
  })
}

const handleCreate = async () => {
  try {
    await createGmoApiKey(inputData.value)
    inputData.value.gmoApiKey = ''
    formValid.value = null
    mode.value = Modes.CreateComplete
  } catch {
    mode.value = Modes.CreateFail
  }
}

const handleDelete = async () => {
  try {
    await deleteGmoApiKey(id.value)
    mode.value = Modes.DeleteComplete
  } finally {
    openDeleteDialog.value = false
  }
}

onBeforeMount(async () => {
  try {
    await getGmoApiKey()
    mode.value = Modes.Detail
  } catch (error) {
    // 未登録の場合404エラーが返る
    if ((error as ErrorResponse).statusCode === 404) {
      mode.value = Modes.Detail
    }
  }
})
</script>

<template>
  <div>
    <NovaPageHeader />

    <div v-if="mode === Modes.Detail">
      <!-- API Key 登録済み -->
      <v-card v-if="!!gmoApiKey" class="my-5">
        <NovaCardTitleWithBorder :title="t('nova.apiKeySetting.information')" />
        <v-card-text>
          <div class="my-4">
            <NovaDetailGrid :label="t('nova.apiKeySetting.authorizationToken')">
              <div data-cy="idaas-api-key-detail-gmo-api-key">
                {{ t('nova.apiKeySetting.registered') }}
              </div>
            </NovaDetailGrid>
          </div>
          <div class="flex-end-center">
            <NovaCustomButton
              :disabled="loading"
              outlined
              color="error"
              data-cy="idaas-api-key-delete-button"
              @click="openDeleteDialog = true"
            >
              {{ t('nova.apiKeySetting.deleteButton') }}
            </NovaCustomButton>
          </div>
        </v-card-text>
      </v-card>

      <!-- 未登録 -->
      <div v-else>
        <v-card class="my-5 px-4 pt-4">
          <div class="flex-space-between-start">
            <div class="font-weight-bold" data-cy="idaas-api-key-create-message">
              {{ t('nova.apiKeySetting.note.create') }}
            </div>
            <v-btn
              variant="text"
              color="primary"
              density="compact"
              append-icon="nova:up-right-square"
              @click="moveToManual"
            >
              {{ t('nova.apiKeySetting.moveToManual') }}
            </v-btn>
          </div>
          <div class="text-xl font-weight-bold mt-6 mb-2">{{ t('nova.apiKeySetting.information') }}</div>
          <v-divider :thickness="2" />
          <div class="flex-start-start my-4">
            <div class="font-weight-bold mr-2">{{ t('nova.apiKeySetting.authorizationToken') }}</div>
            <v-chip label size="small" color="error" class="mr-4">
              {{ t('nova.common.required') }}
            </v-chip>
            <v-form v-model="formValid">
              <NovaInputForm
                v-model="inputData.gmoApiKey"
                :input-props="{
                  placeholder: '67fad6dc66',
                  width: '500px',
                  rules: [rules.gmoApiKey],
                  required: true,
                  maxLength: 44,
                  disabled: loading,
                }"
                data-cy="idaas-api-key-create-gmo-api-key"
              >
                <template #explanation>
                  {{ t('nova.invalid.gmoApiKey') }}
                </template>
              </NovaInputForm>
            </v-form>
          </div>
        </v-card>
        <div class="flex-center-center mt-4">
          <NovaCustomButton
            :disabled="!formValid || loading"
            data-cy="idaas-api-key-create-button"
            @click="handleCreate"
          >
            {{ t('nova.apiKeySetting.createButton') }}
          </NovaCustomButton>
        </div>
      </div>
    </div>

    <div v-else-if="mode">
      <NovaApiKeyResultCard v-bind="resultCard" @click="handleResultClick" />
    </div>

    <!-- 初回アクセスの場合はloading表示 -->
    <NovaProgressCircular v-else-if="loading" />

    <NovaDialogBase v-model="openDeleteDialog" :title="t('nova.apiKeySetting.deleteDialogTitle')">
      <div data-cy="idaas-api-key-delete-confirm-dialog">
        {{ t('nova.apiKeySetting.note.deleteDialogConfirm') }}
      </div>
      <template #actions>
        <NovaCustomButton
          outlined
          data-cy="idaas-api-key-delete-confirm-dialog-cancel-button"
          @click="openDeleteDialog = false"
        >
          {{ t('nova.common.cancel') }}
        </NovaCustomButton>
        <NovaCustomButton
          class="ml-4"
          :disabled="loading"
          color="error"
          data-cy="idaas-api-key-delete-confirm-dialog-delete-button"
          @click="handleDelete"
        >
          {{ t('nova.apiKeySetting.deleteButton') }}
        </NovaCustomButton>
      </template>
    </NovaDialogBase>
  </div>
</template>
