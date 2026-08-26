<script setup lang="ts">
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import { ResourceStatusTypes } from '@/api/constants'
import { FIC_URL, FicRequestTypes, RouteAdvertisementTypes } from '@/api/ficConnections/constants'
import type { FicConnectionPostRequest, FicRequestType } from '@/api/ficConnections/types'
import { RouteName } from '@/route/constants'

definePageMeta({
  name: RouteName.FicConnection.Create,
})

const Steps = {
  RequestType: 1,
  Input: 2,
  Confirm: 3,
  Complete: 4,
} as const

const { t } = useI18n()
const route = useRoute()

const { loading } = useLoading()
const { navigationGuard } = useNavigationGuard()
const { ficConnection, createFicConnection } = useCreateFicConnection()

const tenantId = computed(() => route.params.tenantId as string)

const stepItems = [
  { title: t('nova.fic.requestType'), value: Steps.RequestType },
  { title: t('nova.applicationForNew.inputTitle'), value: Steps.Input },
  { title: t('nova.common.confirm'), value: Steps.Confirm },
  { title: t('nova.common.complete'), value: Steps.Complete },
]
const step = ref<number>(Steps.RequestType)

const requestType = ref<FicRequestType>()

const initialInputData: Required<FicConnectionPostRequest> = {
  customerNote: '',
  vpnId: '',
  routeAdvertisement: RouteAdvertisementTypes.Full,
  ficPremium: false,
}
const inputData = ref<Required<FicConnectionPostRequest>>({ ...initialInputData })
const formValid = ref<boolean | null>(null)
watchEffect(() => navigationGuard(step.value !== Steps.Complete && !isEqual(inputData.value, initialInputData)))

const { getSummaryVpnList, unterminatedVpnListOptions } = useGetSummaryVpnList()
const { getFicConnectionList, customerNoteList } = useGetFicConnectionList()

const openInNewTab = (path: string, query?: Record<string, string>) =>
  navigateTo({ path, query }, { open: { target: '_blank', windowFeatures: { noopener: true, noreferrer: true } } })

const moveToSimpleFicConsole = () => {
  const simpleFicConsoleURL = (window as { consoleSolutionURL?: string }).consoleSolutionURL ?? ''
  return openInNewTab(simpleFicConsoleURL, { tenant_id: tenantId.value })
}
const isSimpleFicConnection = computed(() => requestType.value === FicRequestTypes.SimpleFicConnection)
const disabled = computed(() => {
  switch (step.value) {
    case Steps.Input:
      return !formValid.value
    case Steps.Complete:
      return !ficConnection.value?.orderId
    default:
      return false
  }
})
const stepLabels = computed(() => {
  switch (step.value) {
    case Steps.Input:
      return {
        cancelButton: t('nova.common.cancel'),
        submitButton: t('nova.common.confirm'),
      }
    case Steps.Confirm:
      return {
        cancelButton: t('nova.common.return'),
        submitButton: t('nova.common.apply'),
      }
    case Steps.Complete:
      return {
        cancelButton: t('nova.fic.moveToList'),
        submitButton: t('nova.common.moveToOrderDetail'),
      }
    default:
      return { cancelButton: '', submitButton: '' }
  }
})

const handleStart = () => {
  step.value = Steps.Input
}

const handleCancel = () => {
  switch (step.value) {
    case Steps.Input:
      step.value = Steps.RequestType
      break
    case Steps.Confirm:
      step.value = Steps.Input
      break
    case Steps.Complete:
      return navigateTo({
        name: RouteName.FicConnection.List,
        params: { tenantId: tenantId.value },
        query: { resourceStatus: [ResourceStatusTypes.Active, ResourceStatusTypes.Inactive] },
        replace: true,
      })
  }
}
const handleSubmit = async () => {
  switch (step.value) {
    case Steps.Input:
      step.value = Steps.Confirm
      break
    case Steps.Confirm:
      try {
        await createFicConnection(inputData.value)
        step.value = Steps.Complete
      } catch {
        // エラー通知は useCreateFicConnection 内で表示済み
      }
      break
    case Steps.Complete:
      if (!ficConnection.value?.orderId) {
        return
      }
      return navigateTo({
        name: RouteName.Order.Detail,
        params: { tenantId: tenantId.value, id: ficConnection.value.orderId },
        replace: true,
      })
  }
}

watch(step, () => window.scrollTo({ top: 0, behavior: 'smooth' }))
onBeforeMount(() => {
  getSummaryVpnList()
  getFicConnectionList()
})
</script>

<template>
  <div>
    <NovaPageHeader />
    <NovaCustomStepper v-if="!isSimpleFicConnection" v-model="step" :steps="stepItems" />
    <v-card flat rounded="md">
      <template v-if="step === Steps.RequestType">
        <NovaCardTitleWithBorder :title="t('nova.fic.requestType')">
          <template #help>
            <i18n-t keypath="nova.fic.help.requestType" scope="global">
              <template #linkText1>
                <NuxtLink :to="FIC_URL.FIC_TUTORIAL" target="_blank">{{ t('nova.common.here') }}</NuxtLink>
              </template>
              <template #linkText2>
                <NuxtLink :to="FIC_URL.SIMPLE_FIC_TUTORIAL" target="_blank">{{ t('nova.common.here') }}</NuxtLink>
              </template>
            </i18n-t>
          </template>
        </NovaCardTitleWithBorder>
        <v-card-item>
          <NovaFicApplicationType
            v-model="requestType"
            @click:simple-console="moveToSimpleFicConsole"
            @click:start="handleStart"
          />
        </v-card-item>
      </template>

      <template v-if="step === Steps.Input || step === Steps.Confirm">
        <NovaCardTitleWithBorder
          :title="step === Steps.Confirm ? t('nova.create.confirmTitle') : t('nova.applicationForNew.inputTitle')"
        />
        <v-card-item>
          <v-form v-model="formValid" @submit.prevent>
            <NovaFicApplicationInput
              v-model="inputData"
              :vpn-list-options="unterminatedVpnListOptions"
              :customer-note-list="customerNoteList"
              :is-confirmation="step === Steps.Confirm"
              :request-type="requestType"
            />
          </v-form>
        </v-card-item>
      </template>

      <NovaCardTitleWithBorder v-if="step === Steps.Complete" :title="t('nova.fic.complete.title')">
        <NovaCardItemCompleted :order-id="ficConnection?.orderId ?? ''" :message="t('nova.fic.complete.message')" />

        <div class="font-weight-bold mb-1">{{ t('nova.fic.complete.sellerKey') }}</div>
        <div class="text-break mb-5">{{ ficConnection?.publicServiceKey }}</div>
        <div>{{ t('nova.fic.complete.note1') }}</div>
        <div>{{ t('nova.fic.complete.note2') }}</div>
        <div class="pb-4 border-b-md">
          {{ t('nova.fic.complete.note3') }}
        </div>
      </NovaCardTitleWithBorder>
    </v-card>

    <div v-if="step !== Steps.RequestType" class="flex-center-center ga-6 py-4">
      <NovaCustomButton outlined @click="handleCancel">{{ stepLabels.cancelButton }}</NovaCustomButton>
      <NovaCustomButton :disabled="disabled || loading" @click="handleSubmit">
        {{ stepLabels.submitButton }}
      </NovaCustomButton>
    </div>
  </div>
</template>
