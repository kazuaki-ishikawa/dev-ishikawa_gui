<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RouteName } from '@/route/constants'
import { TermsOfServiceBasePath } from '@/api/termsOfService/constants'

definePageMeta({
  name: RouteName.Support.SecurityHelpDesk,
})

const Modes = {
  Detail: 'detail',
  Create: 'create',
  Delete: 'delete',
} as const
type Mode = (typeof Modes)[keyof typeof Modes]

const { t } = useI18n()
const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)
const { loading } = useLoading()

const { securityHelpDesk, getSecurityHelpDesk, editable, status } = useGetSecurityHelpDesk()
const { wanSecurityNumberOfLines, getWanSecurityNumberOfLines } = useGetWanSecurityNumberOfLines()
const {
  securityTermsOfServiceAccepted,
  getTermsOfServiceAccepted: getSecurityTermsOfServiceAccepted,
  moveToSecurityTermOfService,
} = useTermsOfService(TermsOfServiceBasePath.Security)
const { createSecurityHelpDesk } = useCreateSecurityHelpDesk()
const { deleteSecurityHelpDesk } = useDeleteSecurityHelpDesk()

const dialogType = ref<typeof Modes.Delete | typeof Modes.Create>()
const terminalCountError = ref(false)
const simCountError = ref(false)
const hasCountError = computed(() => terminalCountError.value || simCountError.value)
const supportedTerminalCount = computed(() => securityHelpDesk.value?.supportedTerminalCount ?? 0)
const isCountsEmpty = computed(
  () => !hasCountError.value && supportedTerminalCount.value + wanSecurityNumberOfLines.value === 0,
)

const mode = ref<Mode>(Modes.Detail)
const modeLabels = computed(() => {
  switch (mode.value) {
    case Modes.Detail:
      return {
        title: t('nova.securityHelpDesk.detail'),
        subTitle: '',
        description: '',
      }
    case Modes.Create:
      return {
        title: t('nova.securityHelpDesk.createComplete'),
        subTitle: t('nova.securityHelpDesk.message.complete', { mode: t('nova.common.start') }),
        description: t('nova.securityHelpDesk.message.completeDescription', { mode: t('nova.common.start') }),
      }
    case Modes.Delete:
      return {
        title: t('nova.securityHelpDesk.deleteComplete'),
        subTitle: t('nova.securityHelpDesk.message.complete', { mode: t('nova.common.deleteTitle') }),
        description: t('nova.securityHelpDesk.message.completeDescription', { mode: t('nova.common.deleteTitle') }),
      }
    default:
      return { title: '', subTitle: '', description: '' }
  }
})
const dialogLabels = computed(() => {
  switch (dialogType.value) {
    case Modes.Create:
      return {
        title: t('nova.common.start'),
        description: t('nova.securityHelpDesk.message.confirmation', { mode: t('nova.common.start') }),
        submitLabel: t('nova.securityHelpDesk.applyCreation'),
      }
    case Modes.Delete:
      return {
        title: t('nova.common.end'),
        description: t('nova.securityHelpDesk.message.confirmation', { mode: t('nova.common.deleteTitle') }),
        submitLabel: t('nova.securityHelpDesk.applyDeletion'),
      }
    default:
      return { title: '', description: '', submitLabel: '' }
  }
})

const isCreatable = computed(() =>
  [SecurityHelpDeskStatus.Unused, SecurityHelpDeskStatus.Deleted].includes(status.value),
)

const moveToSupport = () => {
  navigateTo({ name: RouteName.Support.List, params: { tenantId: tenantId.value } })
}

const handleDialogClose = (value: boolean) => {
  if (!value) {
    dialogType.value = undefined
  }
}

const handleSubmit = async () => {
  try {
    if (dialogType.value === Modes.Create) {
      securityHelpDesk.value = await createSecurityHelpDesk()
      mode.value = Modes.Create
    } else if (dialogType.value === Modes.Delete) {
      securityHelpDesk.value = await deleteSecurityHelpDesk()
      mode.value = Modes.Delete
    }
  } finally {
    dialogType.value = undefined
  }
}

onBeforeMount(async () => {
  await getSecurityTermsOfServiceAccepted()
  if (!securityTermsOfServiceAccepted.value) {
    return
  }

  const [securityHelpDeskResult, wanSecurityNumberOfLinesResult] = await Promise.allSettled([
    getSecurityHelpDesk(),
    getWanSecurityNumberOfLines(),
  ])
  terminalCountError.value = securityHelpDeskResult.status === 'rejected'
  simCountError.value = wanSecurityNumberOfLinesResult.status === 'rejected'
})
</script>

<template>
  <div>
    <NovaPageHeader />

    <NovaCautionCard
      v-if="!securityTermsOfServiceAccepted"
      :title="t('nova.common.caution')"
      icon="alert-triangle"
      class="mt-3"
    >
      <div class="flex-space-between-center">
        <div>{{ t('nova.securityHelpDesk.message.caution') }}</div>
        <NovaCustomButton
          append-icon="nova:up-right-square"
          class="ml-2"
          @click="moveToSecurityTermOfService(tenantId)"
        >
          {{ t('nova.securityHelpDesk.confirmation') }}
        </NovaCustomButton>
      </div>
    </NovaCautionCard>

    <!-- セキュリティヘルプデスク詳細画面 -->
    <v-card v-if="mode === Modes.Detail" class="my-5" :title="modeLabels.title">
      <v-card-item>
        <div>
          <NovaDetailGrid :label="t('nova.securityHelpDesk.status')">
            {{ securityHelpDesk?.enabled ? t('nova.securityHelpDesk.using') : t('nova.securityHelpDesk.notUsing') }}
          </NovaDetailGrid>
          <NovaDetailGrid
            v-if="!isCreatable"
            :label="
              status === SecurityHelpDeskStatus.Deleting
                ? t('nova.details.serviceEndDate')
                : t('nova.details.serviceStartDate')
            "
          >
            <div>{{ formatDate(securityHelpDesk?.effectiveDate) }}</div>
          </NovaDetailGrid>
          <template v-if="!isCountsEmpty">
            <NovaDetailGrid :label="t('nova.securityHelpDesk.supportedTerminalCount')">
              {{ terminalCountError ? '-' : supportedTerminalCount }}
            </NovaDetailGrid>
            <NovaDetailGrid :label="t('nova.securityHelpDesk.supportedMobileLineCount')">
              {{ simCountError ? '-' : wanSecurityNumberOfLines }}
            </NovaDetailGrid>
          </template>
          <template v-if="!isCreatable">
            <NovaDetailGrid :label="t('nova.securityHelpDesk.supportUrl')">
              <NuxtLink v-if="securityHelpDesk?.supportUrl" :to="securityHelpDesk.supportUrl" target="_blank">
                {{ t('securityHelpDesk.contacts') }}
              </NuxtLink>
              <div v-else>-</div>
            </NovaDetailGrid>
            <NovaDetailGrid :label="t('nova.securityHelpDesk.supportEmail')">
              {{ securityHelpDesk?.supportEmail ?? '-' }}
            </NovaDetailGrid>
            <NovaDetailGrid :label="t('nova.details.orderId')">
              <NuxtLink
                v-if="securityHelpDesk?.orderId"
                :to="{ name: RouteName.Order.Detail, params: { tenantId, id: securityHelpDesk.orderId } }"
                >{{ securityHelpDesk.orderId }}
              </NuxtLink>
              <div v-else>-</div>
            </NovaDetailGrid>
          </template>
        </div>

        <div v-if="securityTermsOfServiceAccepted" class="my-4 text-pre-wrap">
          <div v-if="securityHelpDesk?.enabled">
            {{ t('nova.securityHelpDesk.note.usingCaution') }}
          </div>
          <i18n-t v-else keypath="nova.securityHelpDesk.note.notUsingCaution" tag="div" scope="global">
            <template #linkText>
              <NuxtLink to="https://sdpf.ntt.com/" target="_blank">
                {{ t('nova.securityHelpDesk.note.service') }}
              </NuxtLink>
            </template>
          </i18n-t>
        </div>

        <div class="flex-end-center mb-4">
          <NovaCustomButton
            v-if="isCreatable"
            :disabled="!securityTermsOfServiceAccepted || isCountsEmpty || hasCountError || !editable || loading"
            @click="dialogType = Modes.Create"
          >
            {{ t('nova.securityHelpDesk.create') }}
          </NovaCustomButton>
          <NovaCustomButton
            v-if="status === SecurityHelpDeskStatus.Created"
            outlined
            color="error"
            :disabled="!editable || loading"
            @click="dialogType = Modes.Delete"
          >
            {{ t('nova.securityHelpDesk.delete') }}
          </NovaCustomButton>
        </div>
      </v-card-item>
    </v-card>

    <!-- 利用開始/廃止申込完了画面 -->
    <template v-else>
      <v-card class="my-5">
        <NovaCardTitleWithBorder :title="modeLabels.title">
          <div class="font-weight-bold">{{ modeLabels.subTitle }}</div>
          <div class="text-pre-wrap my-3">{{ modeLabels.description }}</div>
        </NovaCardTitleWithBorder>
      </v-card>
      <div class="flex-center-center">
        <NovaCustomButton outlined @click="moveToSupport">
          {{ t('nova.common.moveToSupport') }}
        </NovaCustomButton>
      </div>
    </template>

    <NovaDialogBase :model-value="!!dialogType" :title="dialogLabels.title" @update:model-value="handleDialogClose">
      <div class="text-pre-wrap">{{ dialogLabels.description }}</div>

      <template #actions>
        <NovaCustomButton outlined @click="dialogType = undefined">
          {{ t('nova.common.cancel') }}
        </NovaCustomButton>
        <NovaCustomButton
          class="ml-4"
          :color="dialogType === Modes.Delete ? 'error' : 'interactive'"
          @click="handleSubmit"
        >
          {{ dialogLabels.submitLabel }}
        </NovaCustomButton>
      </template>
    </NovaDialogBase>
  </div>
</template>
