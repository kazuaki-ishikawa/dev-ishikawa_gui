<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { VPN_LINK } from '@/api/vpns/constants'
import type { VpnPostRequest } from '@/api/vpns/types'

const Steps = {
  Select: 0,
  Create: 1,
} as const
const VpnSelection = {
  Create: 'create',
  NotUsing: 'notUsing',
} as const

type PropsType = {
  customerNoteList: Array<{ id: string; customerNote: string }>
  vpnListOptions: Array<{ text: string; value: string }>
}
const props = defineProps<PropsType>()
const vpnId = defineModel<string | undefined>('vpnId', { required: true })

const inputData = ref<VpnPostRequest>({ customerNote: '', internalAddress: '' })
const inputValid = ref({ customerNote: false, internalAddress: false })

type Emits = {
  (e: 'prev'): void
  (e: 'next'): void
  (e: 'submit', request: VpnPostRequest): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const rules = useRules()
const { loading } = useLoading()

const step = ref(0)

// VPNの選択画面
const vpnSetting = ref<string>(VpnSelection.Create)
const vpnOptions = computed(() => {
  return [
    { text: t('quickSetup.vpnCreate'), value: VpnSelection.Create },
    { text: t('quickSetup.vpnNotUsing'), value: VpnSelection.NotUsing },
    ...props.vpnListOptions,
  ]
})

const handleSelectNextClick = () => {
  switch (vpnSetting.value) {
    case VpnSelection.Create:
      step.value++
      break
    case VpnSelection.NotUsing:
      vpnId.value = ''
      emits('next')
      break
    default:
      vpnId.value = vpnSetting.value
      emits('next')
      break
  }
}

// VPNの新規作成
const isConfirmation = ref(false)
const disabled = computed(() => Object.values(inputValid.value).some(valid => !valid))

const handleVpnCreateClick = () => {
  if (isConfirmation.value) {
    emits('submit', inputData.value)
  } else {
    isConfirmation.value = true
  }
}

const message = computed(() => {
  switch (step.value) {
    case Steps.Select:
      return t('quickSetup.confirmUsingVpn')
    default:
      return isConfirmation.value ? t('confirm.create') : t('quickSetup.inputVonInformation')
  }
})
const helpLink = computed(() => {
  switch (step.value) {
    case Steps.Create:
      return isConfirmation.value ? undefined : VPN_LINK.VPN
    default:
      return undefined
  }
})
const buttons = computed(() => {
  switch (step.value) {
    case Steps.Select:
      return {
        prevLabel: t('common.return'),
        prevClick: () => emits('prev'),
        nextLabel: t('common.next'),
        nextClick: handleSelectNextClick,
      }
    default:
      return {
        prevLabel: t('common.return'),
        prevClick: () => {
          isConfirmation.value ? (isConfirmation.value = false) : step.value--
        },
        nextLabel: isConfirmation.value ? t('common.create') : t('common.confirm'),
        nextDisabled: disabled.value || loading.value,
        nextClick: handleVpnCreateClick,
      }
  }
})

onBeforeMount(() => {
  if (vpnId.value === undefined) {
    return
  }
  const found = props.vpnListOptions.find(vpn => vpn.value === vpnId.value)
  vpnSetting.value = found?.value ?? (vpnId.value ? VpnSelection.Create : VpnSelection.NotUsing)
})
</script>

<template>
  <QuickSetupTemplate
    :prev-label="buttons.prevLabel"
    :next-label="buttons.nextLabel"
    :next-disabled="buttons.nextDisabled"
    :current-step="{ step: 'vpnCreation' }"
    @prev="buttons.prevClick"
    @next="buttons.nextClick"
  >
    <template #message>{{ message }}</template>
    <template v-if="helpLink" #help>
      <NuxtLink :to="helpLink" target="_blank">{{ helpLink }}</NuxtLink>
    </template>
    <template v-if="step === Steps.Select">
      <SelectForm v-model="vpnSetting" :options="vpnOptions" required data-cy="quick-setup-vpn-select-vpn" />
    </template>
    <template v-else-if="step === Steps.Create">
      <div v-if="isConfirmation" class="mb-2 text-error">{{ t('vpn.createResourceNote') }}</div>
      <InputGrid required :label="t('vpn.name')">
        <InputForm
          v-model="inputData.customerNote"
          :rules="[rules.customerNote, rules.duplicateCustomerNote(customerNoteList)]"
          maxlength="64"
          required
          placeholder="拠点間通信用VPN"
          :disabled="isConfirmation"
          data-cy="quick-setup-vpn-input-customer-note"
          @valid="(valid: boolean) => (inputValid.customerNote = valid)"
        />
      </InputGrid>
      <InputGrid required :label="t('vpn.internalAddress')" :help="t('vpn.help.internalAddress')">
        <InputPrefixedIpForm
          v-model="inputData.internalAddress"
          :prefix="26"
          :rules="[rules.ipAddress]"
          maxlength="15"
          required
          placeholder="10.192.0.0"
          :disabled="isConfirmation"
          data-cy="quick-setup-vpn-input-internal-address"
          @valid="(valid: boolean) => (inputValid.internalAddress = valid)"
        />
      </InputGrid>
    </template>
  </QuickSetupTemplate>
</template>
