<script setup lang="ts">
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import { ResourceStatusTypes } from '@/api/constants'
import { RouteAdvertisementTypes } from '@/api/ficConnections/constants'
import type { FicConnectionPutRequest } from '@/api/ficConnections/types'
import { RouteName } from '@/route/constants'

definePageMeta({
  name: RouteName.FicConnection.Edit,
})

const Steps = {
  Input: 1,
  Confirm: 2,
  Complete: 3,
} as const

const route = useRoute()
const router = useRouter()

const { t } = useI18n()

const rules = useRules()
const { loading } = useLoading()
const { navigationGuard } = useNavigationGuard()

const tenantId = computed(() => route.params.tenantId as string)
const ficConnectionId = computed(() => route.params.id as string)

const stepItems = computed(() => [
  { title: t('nova.applicationForNew.inputTitle'), value: Steps.Input },
  { title: t('nova.common.confirm'), value: Steps.Confirm },
  { title: t('nova.common.complete'), value: Steps.Complete },
])
const step = ref<number>(Steps.Input)

const inputData = ref<Required<FicConnectionPutRequest>>({
  customerNote: '',
  routeAdvertisement: RouteAdvertisementTypes.Full,
})
const formValid = ref<boolean | null>(null)

const { routeAdvertisementOptions } = useFicConnections()
const { updateFicConnection } = useUpdateFicConnection()
const { ficConnection, getFicConnection, editable } = useGetFicConnection()
const { getFicConnectionList, customerNoteList } = useGetFicConnectionList()

const originalData = computed(() => ({
  customerNote: ficConnection.value?.customerNote ?? '',
  routeAdvertisement: ficConnection.value?.routeAdvertisement ?? RouteAdvertisementTypes.Full,
}))
watch(originalData, () => (inputData.value = { ...originalData.value }))
watchEffect(() => navigationGuard(step.value !== Steps.Complete && !isEqual(inputData.value, originalData.value)))

const putRequest = computed<FicConnectionPutRequest>(() => ({
  customerNote:
    inputData.value.customerNote !== originalData.value.customerNote ? inputData.value.customerNote : undefined,
  routeAdvertisement:
    inputData.value.routeAdvertisement !== originalData.value.routeAdvertisement
      ? inputData.value.routeAdvertisement
      : undefined,
}))

const disabled = computed(() => {
  switch (step.value) {
    case Steps.Complete:
      // 完了画面ではオーダー詳細への遷移ができれば良い
      return !ficConnection.value?.orderId
    default:
      return !editable.value || !formValid.value || isEqual(inputData.value, originalData.value)
  }
})
const stepLabels = computed(() => {
  switch (step.value) {
    case Steps.Input:
      return {
        title: t('nova.update.inputTitle'),
        description: '',
        cancelButton: t('nova.common.cancel'),
        submitButton: t('nova.common.confirm'),
      }
    case Steps.Confirm:
      return {
        title: t('nova.update.confirmTitle'),
        description: t('nova.update.confirmDescription'),
        cancelButton: t('nova.common.return'),
        submitButton: t('nova.common.apply'),
      }
    case Steps.Complete:
      return {
        title: t('nova.update.completeTitle'),
        description: t('nova.update.completeDescription'),
        cancelButton: t('nova.fic.moveToList'),
        submitButton: t('nova.common.moveToOrderDetail'),
      }
    default:
      return { title: '', description: '' }
  }
})

const handleCancel = () => {
  switch (step.value) {
    case Steps.Input:
      router.back()
      break
    case Steps.Confirm:
      step.value--
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
      step.value++
      break
    case Steps.Confirm:
      try {
        ficConnection.value = await updateFicConnection(ficConnectionId.value, putRequest.value)
        step.value++
      } catch {
        // エラー通知は useAPI 内で行う
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
  getFicConnection(ficConnectionId.value)
  getFicConnectionList()
})
</script>

<template>
  <div>
    <NovaPageHeader :customer-note="ficConnection?.customerNote" />

    <NovaCustomStepper v-model="step" :steps="stepItems" />

    <v-card class="mb-5">
      <NovaCardTitleWithBorder :title="stepLabels.title">
        <NovaCardItemCompleted
          v-if="step === Steps.Complete"
          :order-id="ficConnection?.orderId ?? ''"
          :message="t('nova.fic.message.updated')"
        />
        <span class="text-pre-wrap">{{ stepLabels.description }}</span>
      </NovaCardTitleWithBorder>

      <v-card-item>
        <v-form v-if="step < Steps.Complete" v-model="formValid" @submit.prevent>
          <NovaInputGrid :label="t('nova.fic.ficId')">
            {{ ficConnection?.ficConnectionId }}
          </NovaInputGrid>
          <NovaInputGrid required :label="t('nova.fic.customerNote')">
            <NovaInputForm
              v-model="inputData.customerNote"
              :input-props="{
                placeholder: t('nova.fic.customerNote'),
                maxLength: 64,
                rules: [rules.customerNote, rules.duplicateCustomerNote(customerNoteList, ficConnectionId)],
                required: true,
              }"
              :original="originalData.customerNote"
              :is-confirmation="step === Steps.Confirm"
            >
              <template #explanation>
                {{ t('nova.invalid.maxlength.none', { maxlength: 64 }) }}
              </template>
            </NovaInputForm>
          </NovaInputGrid>
          <NovaInputGrid label="VPN ID">
            {{ ficConnection?.vpnId }}
          </NovaInputGrid>
          <NovaInputGrid required :label="t('nova.fic.routeAdvertisement')">
            <NovaSelectForm
              v-model="inputData.routeAdvertisement"
              :input-props="{
                options: routeAdvertisementOptions,
                placeholder: routeAdvertisementOptions[0]?.text,
                width: '640px',
                required: true,
              }"
              :original="originalData.routeAdvertisement"
              :is-confirmation="step === Steps.Confirm"
            />
          </NovaInputGrid>
          <NovaInputGrid :label="t('nova.fic.ficPremium')">
            {{ ficConnection?.ficPremium ? t('nova.common.use') : t('nova.common.disuse') }}
          </NovaInputGrid>
          <NovaInputGrid :label="t('nova.fic.referenceFicConnectionId')">
            <template #help>{{ t('nova.fic.help.referenceFicConnectionId') }}</template>
            {{ ficConnection?.referenceFicConnectionId }}
          </NovaInputGrid>
          <NovaInputGrid :label="t('nova.fic.publicServiceKey')">
            <span class="text-break">{{ ficConnection?.publicServiceKey }}</span>
          </NovaInputGrid>
          <NovaInputGrid :label="t('nova.fic.bandwidth')">
            {{ ficConnection?.bandwidth }}
          </NovaInputGrid>
          <NovaInputGrid :label="t('nova.details.resourceStatus')">
            {{ ficConnection?.resourceStatus }}
          </NovaInputGrid>
          <NovaInputGrid :label="t('nova.details.orderId')">
            <NuxtLink
              v-if="ficConnection?.orderId"
              :to="{ name: RouteName.Order.Detail, params: { tenantId, id: ficConnection.orderId } }"
            >
              {{ ficConnection.orderId }}
            </NuxtLink>
          </NovaInputGrid>
          <NovaInputGrid :label="t('nova.details.creationTime')">
            {{ formatDateTime(ficConnection?.creationTime) }}
          </NovaInputGrid>
          <NovaInputGrid :label="t('nova.details.updateTime')">
            {{ formatDateTime(ficConnection?.updateTime) }}
          </NovaInputGrid>
          <NovaInputGrid :label="t('nova.details.serviceStartTime')">
            {{ formatDateTime(ficConnection?.serviceStartTime) }}
          </NovaInputGrid>
        </v-form>
      </v-card-item>
    </v-card>

    <div class="flex-center-center ga-6 py-4">
      <NovaCustomButton outlined @click="handleCancel">
        {{ stepLabels.cancelButton }}
      </NovaCustomButton>
      <NovaCustomButton :disabled="disabled || loading" @click="handleSubmit">
        {{ stepLabels.submitButton }}
      </NovaCustomButton>
    </div>
  </div>
</template>
