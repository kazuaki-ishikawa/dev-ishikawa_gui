<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ResourceStatusTypes } from '@/api/constants'
import { VPN_LINK } from '@/api/vpns/constants'
import type { VpnPostRequest, VpnResponse } from '@/api/vpns/types'
import { RouteName } from '@/route/constants'

definePageMeta({
  name: RouteName.Vpn.Create,
})

const route = useRoute()
const router = useRouter()

const { t } = useI18n()
const rules = useRules()
const { loading } = useLoading()
const { navigationGuard } = useNavigationGuard()

const { getSummaryVpnList, customerNoteList } = useGetSummaryVpnList()
const { createVpn } = useCreateVpn()

const tenantId = computed(() => route.params.tenantId as string)

const Steps = {
  Input: 1,
  Confirm: 2,
  Complete: 3,
}
const stepItems = computed(() => [
  { title: t('nova.vpn.updateInputStep'), value: Steps.Input },
  { title: t('nova.common.confirm'), value: Steps.Confirm },
  { title: t('nova.common.complete'), value: Steps.Complete },
])
const step = ref(Steps.Input)
const vpn = ref<VpnResponse>()

const inputData = ref<VpnPostRequest>({ customerNote: '', internalAddress: '' })
const formValid = ref<boolean>(false)
const isConfirmation = computed(() => step.value === Steps.Confirm)

const stepLabels = computed(() => {
  switch (step.value) {
    case Steps.Input:
      return {
        title: t('nova.applicationForNew.inputTitle'),
        cancelButton: t('nova.common.cancel'),
        submitButton: t('nova.common.reviewApplicationDetails'),
      }
    case Steps.Confirm:
      return {
        title: t('nova.applicationForNew.confirmTitle'),
        cancelButton: t('nova.common.return'),
        submitButton: t('nova.common.apply'),
      }
    case Steps.Complete:
      return {
        title: t('nova.applicationForNew.completeTitle'),
        cancelButton: t('nova.vpn.moveToList'),
        submitButton: t('nova.common.moveToOrderDetail'),
      }
    default:
      return { title: '' }
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
      vpn.value = await createVpn(inputData.value)
      navigationGuard(false)
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
  getSummaryVpnList()
  navigationGuard(true)
})
</script>

<template>
  <div>
    <NovaPageHeader />

    <NovaCustomStepper v-model="step" :steps="stepItems" />
    <v-card class="mb-5">
      <NovaCardTitleWithBorder :title="stepLabels.title">
        <i18n-t v-if="step === Steps.Input" keypath="nova.vpn.note.create" scope="global" class="text-pre-wrap">
          <template #linkText>
            <NuxtLink :to="VPN_LINK.VPN" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
        </i18n-t>

        <template v-if="step === Steps.Confirm">
          <div>{{ t('nova.applicationForNew.confirmDescription-1') }}</div>
          <div class="text-error">{{ t('nova.vpn.note.internalAddress') }}</div>
          <div>{{ t('nova.applicationForNew.confirmDescription-2') }}</div>
        </template>

        <template v-if="step === Steps.Complete">
          <NovaCardItemCompleted
            :order-id="vpn?.orderId ?? ''"
            :message="t('nova.applicationForNew.sentMail', { type: t('nova.vpn.create') })"
          />
          <div class="text-pre-wrap">{{ t('nova.applicationForNew.completeDescription') }}</div>
        </template>
      </NovaCardTitleWithBorder>

      <v-card-item>
        <v-form v-if="step < Steps.Complete" v-model="formValid" @submit.prevent>
          <NovaInputGrid required :label="t('nova.vpn.name')">
            <NovaInputForm
              v-model="inputData.customerNote"
              :input-props="{
                placeholder: '拠点間通信用VPN',
                width: '500px',
                rules: [rules.customerNote, rules.duplicateCustomerNote(customerNoteList)],
                required: true,
                maxLength: 64,
              }"
              :is-confirmation="isConfirmation"
              data-cy="vpns-create-customer-note"
            />
          </NovaInputGrid>
          <NovaInputGrid required :label="t('nova.vpn.internalAddress')">
            <template #help>{{ t('nova.vpn.help.internalAddress') }}</template>
            <NovaInputPrefixedIpForm
              v-model="inputData.internalAddress"
              :prefix="26"
              :input-props="{
                placeholder: '10.192.0.0',
                width: '500px',
                rules: [rules.ipAddress],
                required: true,
              }"
              :is-confirmation="isConfirmation"
              data-cy="vpns-create-internal-address"
            >
              <template #explanation>
                <div>{{ t('invalid.maxlength.halfwidth', { maxlength: 15 }) }}</div>
                <div v-if="step === Steps.Input" class="text-error">{{ t('nova.vpn.note.internalAddress') }}</div>
              </template>
            </NovaInputPrefixedIpForm>
          </NovaInputGrid>
        </v-form>
      </v-card-item>
    </v-card>

    <div class="flex-center-center ga-6 py-4">
      <NovaCustomButton outlined data-cy="vpns-create-cancel-button" @click="handleCancel">
        {{ stepLabels.cancelButton }}
      </NovaCustomButton>
      <NovaCustomButton :disabled="!formValid || loading" data-cy="vpns-create-submit-button" @click="handleSubmit">
        {{ stepLabels.submitButton }}
      </NovaCustomButton>
    </div>
  </div>
</template>
