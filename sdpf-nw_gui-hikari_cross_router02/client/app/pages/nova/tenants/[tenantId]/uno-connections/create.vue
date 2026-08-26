<script setup lang="ts">
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { ResourceStatusTypes } from '@/api/constants'
import { initialUnoConnectionCreateData, UNO_URL } from '@/api/unoConnections/constants'
import type { UnoConnectionPostRequest } from '@/api/unoConnections/types'
import { RouteName } from '@/route/constants'
import { NovaIconTypes } from '@/components/icons/constants'

definePageMeta({
  name: RouteName.UnoConnection.Create,
})

const route = useRoute()
const router = useRouter()

const { t } = useI18n()
const rules = useRules()
const { loading } = useLoading()
const { navigationGuard } = useNavigationGuard()

const { getSummaryVpnList, activeVpnListOptions } = useGetSummaryVpnList()
const { unoConnection, createUnoConnection } = useCreateUnoConnection()
const { customerNoteList, getUnoConnectionList } = useUnoConnections()

const tenantId = computed(() => route.params.tenantId as string)

const Steps = {
  Input: 1,
  Confirm: 2,
  Complete: 3,
}
const stepItems = computed(() => [
  { title: t('nova.unoConnections.inputStep'), value: Steps.Input },
  { title: t('nova.common.confirm'), value: Steps.Confirm },
  { title: t('nova.common.complete'), value: Steps.Complete },
])
const step = ref(Steps.Input)

// 開通希望日は今日を0日目として180日後まで選択可能
const MAX_APPLICATION_DAYS = 180
const minApplicationDate = dayjs().format()
const maxApplicationDate = dayjs().add(MAX_APPLICATION_DAYS, 'day').format()

const inputData = ref<UnoConnectionPostRequest>({ ...initialUnoConnectionCreateData })
const formValid = ref<boolean>(false)
const isConfirmation = computed(() => step.value === Steps.Confirm)

const stepLabels = computed(() => {
  switch (step.value) {
    case Steps.Input:
      return {
        title: '',
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
        cancelButton: t('nova.unoConnections.moveToList'),
        submitButton: t('nova.common.moveToOrderDetail'),
      }
    default:
      return { title: '' }
  }
})

const disabled = computed(() => {
  if (step.value === Steps.Complete) {
    return !unoConnection.value?.orderId
  }
  return !formValid.value
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
        name: RouteName.UnoConnection.List,
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
        await createUnoConnection(inputData.value)
        navigationGuard(false)
        step.value++
      } catch {
        // エラー通知は useCreateUnoConnection 内で表示済み
      }
      break
    case Steps.Complete:
      if (!unoConnection.value?.orderId) {
        return
      }
      return navigateTo({
        name: RouteName.Order.Detail,
        params: { tenantId: tenantId.value, id: unoConnection.value.orderId },
        replace: true,
      })
  }
}

watch(step, () => window.scrollTo({ top: 0, behavior: 'smooth' }))

onBeforeMount(async () => {
  navigationGuard(true)
  getSummaryVpnList()
  await getUnoConnectionList()
})
</script>

<template>
  <div>
    <NovaPageHeader />

    <NovaCustomStepper v-model="step" :steps="stepItems" />
    <v-card class="mb-5">
      <NovaCardTitleWithBorder
        v-if="step !== Steps.Input"
        :title="stepLabels.title"
        data-cy="uno-connections-create-step-title"
      >
        <template v-if="step === Steps.Confirm">
          <div>{{ t('nova.applicationForNew.confirmDescription-1') }}</div>
          <div>{{ t('nova.applicationForNew.confirmDescription-2') }}</div>
        </template>

        <template v-if="step === Steps.Complete">
          <NovaCardItemCompleted
            :order-id="unoConnection?.orderId ?? ''"
            :message="t('nova.applicationForNew.sentMail', { type: t('nova.unoConnections.create') })"
          />
          <div class="text-pre-wrap">{{ t('nova.applicationForNew.completeDescription') }}</div>
        </template>
      </NovaCardTitleWithBorder>

      <v-form v-if="step < Steps.Complete" v-model="formValid" @submit.prevent>
        <NovaCardTitleWithBorder
          :title="t('nova.unoConnections.customerNoteSection')"
          data-cy="uno-connections-create-customer-note-section"
        >
          <template #help> TODO: #17551 内容が決まり次第文言追加 </template>
          <template #button>
            <NuxtLink
              v-if="step === Steps.Input"
              :to="UNO_URL.ABOLITION_TUTORIAL"
              target="_blank"
              class="d-inline-flex align-center ga-1 text-sm text-decoration-none font-weight-regular"
            >
              {{ t('nova.unoConnections.createTutorial') }}
              <v-icon :icon="`nova:${NovaIconTypes.UpRightSquare}`" size="small" />
            </NuxtLink>
          </template>
        </NovaCardTitleWithBorder>
        <v-card-item>
          <NovaInputGrid required :label="t('nova.unoConnections.customerNote')">
            <NovaInputForm
              v-model="inputData.customerNote"
              :input-props="{
                placeholder: 'Arcstar Universal One接続',
                width: '500px',
                rules: [rules.customerNote, rules.duplicateCustomerNote(customerNoteList)],
                required: true,
                maxLength: 64,
              }"
              :is-confirmation="isConfirmation"
              data-cy="uno-connections-create-customer-note"
            >
              <template #explanation>
                {{ t('nova.invalid.maxlength.none', { maxlength: 64 }) }}
              </template>
            </NovaInputForm>
          </NovaInputGrid>
        </v-card-item>

        <NovaCardTitleWithBorder
          :title="t('nova.unoConnections.rinkSection')"
          data-cy="uno-connections-create-rink-section"
        />
        <v-card-item>
          <NovaInputGrid required :label="t('nova.unoConnections.sourceVpnId')">
            <NovaSelectForm
              v-model="inputData.vpnId"
              :input-props="{
                options: activeVpnListOptions,
                placeholder: 'V000000002 / 拠点間通信用VPN',
                required: true,
              }"
              :is-confirmation="isConfirmation"
              data-cy="uno-connections-create-vpn-id"
            />
          </NovaInputGrid>
        </v-card-item>

        <NovaCardTitleWithBorder
          :title="t('nova.unoConnections.unoSection')"
          data-cy="uno-connections-create-uno-section"
        />
        <v-card-item>
          <NovaInputGrid required :label="t('nova.unoConnections.unoContractNumber')">
            <NovaInputForm
              v-model="inputData.unoContractNumber"
              :input-props="{
                placeholder: 'N123456789',
                width: '500px',
                rules: [rules.nNumber],
                required: true,
                maxLength: 10,
              }"
              :is-confirmation="isConfirmation"
              data-cy="uno-connections-create-uno-contract-number"
            >
              <template #explanation>
                {{ t('nova.invalid.nNumber') }}
              </template>
            </NovaInputForm>
          </NovaInputGrid>
          <NovaInputGrid required :label="t('nova.unoConnections.destinationVpnNumber')">
            <NovaInputForm
              v-model="inputData.unoVpnId"
              :input-props="{
                placeholder: 'V12345678',
                width: '500px',
                rules: [rules.vNumber],
                required: true,
                maxLength: 9,
              }"
              :is-confirmation="isConfirmation"
              data-cy="uno-connections-create-uno-vpn-id"
            >
              <template #explanation>
                {{ t('nova.invalid.vNumber') }}
              </template>
            </NovaInputForm>
          </NovaInputGrid>
          <NovaInputGrid
            required
            :label="t('nova.unoConnections.unoApplicationDate')"
            :help-icon="NovaIconTypes.HelpCircle"
          >
            <template #help> TODO: #17551 文言が決まり次第追加 </template>
            <NovaDatePickerForm
              v-model="inputData.unoApplicationDate"
              :input-props="{
                required: true,
                minDate: minApplicationDate,
                maxDate: maxApplicationDate,
                width: '200px',
              }"
              :is-confirmation="isConfirmation"
              data-cy="uno-connections-create-application-date"
            />
          </NovaInputGrid>
        </v-card-item>
      </v-form>
    </v-card>

    <div class="flex-center-center ga-6 py-4">
      <NovaCustomButton outlined data-cy="uno-connections-create-cancel-button" @click="handleCancel">
        {{ stepLabels.cancelButton }}
      </NovaCustomButton>
      <NovaCustomButton
        :disabled="disabled || loading"
        data-cy="uno-connections-create-submit-button"
        @click="handleSubmit"
      >
        {{ stepLabels.submitButton }}
      </NovaCustomButton>
    </div>
  </div>
</template>
