<script setup lang="ts">
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import { ResourceStatusTypes } from '@/api/constants'
import type { VpnPutRequest } from '@/api/vpns/types'
import { RouteName } from '@/route/constants'

definePageMeta({
  name: RouteName.Vpn.Edit,
})

const Steps = {
  Input: 1,
  Confirm: 2,
  Complete: 3,
}

const route = useRoute()
const router = useRouter()

const { t } = useI18n()

const rules = useRules()
const { loading } = useLoading()
const { navigationGuard } = useNavigationGuard()

const tenantId = computed(() => route.params.tenantId as string)
const vpnId = computed(() => route.params.id as string)

const stepItems = computed(() => [
  { title: t('nova.vpn.updateInputStep'), value: Steps.Input },
  { title: t('nova.common.confirm'), value: Steps.Confirm },
  { title: t('nova.common.complete'), value: Steps.Complete },
])
const step = ref(Steps.Input)

const inputData = ref<VpnPutRequest>({ customerNote: '' })
const formValid = ref<boolean | null>(null)

const { updateVpn } = useUpdateVpn()
const { getVpn, vpn, routeItems, editable } = useGetVpn()
const { getSummaryVpnList, customerNoteList } = useGetSummaryVpnList()

const originalData = computed(() => ({ customerNote: vpn.value?.customerNote ?? '' }))
watch(originalData, () => (inputData.value = { ...originalData.value }))
watchEffect(() => navigationGuard(!isEqual(inputData.value, originalData.value)))

const disabled = computed(() => {
  switch (step.value) {
    case Steps.Complete:
      // 完了画面ではオーダー詳細への遷移ができれば良い
      return !vpn.value?.orderId
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
        submitButton: t('nova.common.reviewApplicationDetails'),
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
        cancelButton: t('nova.vpn.moveToList'),
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
        name: RouteName.Vpn.List,
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
      vpn.value = await updateVpn(vpnId.value, inputData.value)
      step.value++
      break
    case Steps.Complete:
      if (!vpn.value?.orderId) {
        return
      }
      return navigateTo({
        name: RouteName.Order.Detail,
        params: { tenantId: tenantId.value, id: vpn.value.orderId },
        replace: true,
      })
  }
}

watch(step, () => window.scrollTo({ top: 0, behavior: 'smooth' }))
onBeforeMount(() => {
  getVpn(vpnId.value)
  getSummaryVpnList()
})
</script>

<template>
  <div>
    <NovaPageHeader :customer-note="vpn?.customerNote" />

    <NovaCustomStepper v-model="step" :steps="stepItems" />

    <v-card class="mb-5">
      <NovaCardTitleWithBorder :title="stepLabels.title">
        <NovaCardItemCompleted
          v-if="step === Steps.Complete"
          :order-id="vpn?.orderId ?? ''"
          :message="t('nova.vpn.message.updated')"
        />
        <span class="text-pre-wrap">{{ stepLabels.description }}</span>
      </NovaCardTitleWithBorder>

      <v-card-item>
        <v-form v-if="step < Steps.Complete" v-model="formValid" @submit.prevent>
          <div class="pb-3 font-weight-bold text-title-medium">
            {{ t('nova.details.basicInformation') }}
          </div>
          <NovaInputGrid required :label="t('nova.vpn.name')">
            <NovaInputForm
              v-model="inputData.customerNote"
              :input-props="{
                placeholder: '拠点間通信用VPN',
                rules: [rules.customerNote, rules.duplicateCustomerNote(customerNoteList, vpnId)],
                maxLength: 64,
                required: true,
              }"
              :original="originalData.customerNote"
              :is-confirmation="step === Steps.Confirm"
              data-cy="vpns-id-edit-customer-note"
            />
          </NovaInputGrid>
          <NovaInputGrid :label="t('nova.vpn.vpnId')">
            {{ vpn?.vpnId }}
          </NovaInputGrid>
          <NovaInputGrid :label="t('nova.vpn.internalAddress')">
            {{ vpn?.internalAddress }}
          </NovaInputGrid>
          <NovaInputGrid :label="t('nova.details.orderId')">
            {{ vpn?.orderId }}
          </NovaInputGrid>
          <NovaInputGrid :label="t('nova.details.creationTime')">
            {{ formatDateTime(vpn?.creationTime) }}
          </NovaInputGrid>
          <NovaInputGrid :label="t('nova.details.updateTime')">
            {{ formatDateTime(vpn?.updateTime) }}
          </NovaInputGrid>
          <NovaInputGrid :label="t('nova.details.serviceStartTime')">
            {{ formatDateTime(vpn?.serviceStartTime) }}
          </NovaInputGrid>
          <NovaInputGrid :label="t('nova.vpn.routeCount')">
            {{ vpn?.routeCount }}
          </NovaInputGrid>
        </v-form>
      </v-card-item>
    </v-card>

    <v-card v-if="step < Steps.Complete" class="my-5">
      <NovaCardTitleWithBorder :title="t('nova.vpn.routeList')" />
      <v-card-item>
        <NovaVpnRouteTable :items="routeItems" />
      </v-card-item>
    </v-card>

    <div class="flex-center-center ga-6 py-4">
      <NovaCustomButton outlined data-cy="vpns-id-edit-cancel-button" @click="handleCancel">
        {{ stepLabels.cancelButton }}
      </NovaCustomButton>
      <NovaCustomButton :disabled="disabled || loading" data-cy="vpns-id-edit-submit-button" @click="handleSubmit">
        {{ stepLabels.submitButton }}
      </NovaCustomButton>
    </div>
  </div>
</template>
