<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { BreakOutResponse } from '@/api/breakOut/types'
import type { GuaranteeResponse } from '@/api/guarantees/types'
import { TERMINAL_LINK } from '@/api/terminals/constants'
import type {
  TerminalMobileInputDataType,
  TerminalInputDataType,
  TerminalInputValidType,
  TerminalMobileValidType,
} from '@/api/terminals/types'
import type { ResourceSummaryVpnResponse } from '@/api/vpns/types'
import type { IpoeListOptionType } from '@/components/terminals/types'

type PropsType = {
  customerNoteList: Array<{ id: string; customerNote: string }>
  vpn: ResourceSummaryVpnResponse | null
  breakOutList: BreakOutResponse[]
  guaranteeList: GuaranteeResponse[]
  ipoeListOptions: IpoeListOptionType[]
  disabledDates?: (value: Date) => boolean
}
const mobile = defineModel<TerminalMobileInputDataType>('mobile', { required: true })
const mobileValid = defineModel<TerminalMobileValidType>('mobileValid', { required: true })
const terminals = defineModel<TerminalInputDataType[]>('terminals', { required: true })
const terminalValids = defineModel<TerminalInputValidType[]>('terminalValids', { required: true })

defineProps<PropsType>()

const { t } = useI18n()
const editing = ref<string[]>([])
const editButtonClick = (value: string) => {
  const isEdit = editing.value.includes(value)
  editing.value = isEdit ? editing.value.filter(text => text !== value) : [...editing.value, value]
}

const isMobileEdit = computed(() => editing.value.includes('mobile'))
const mobileButton = computed(() => {
  const disabled = isMobileEdit.value && Object.values(mobileValid.value).some(valid => !valid)
  const text = isMobileEdit.value ? t('common.save') : t('common.edit')
  const click = () => editButtonClick('mobile')
  return { disabled, text, click }
})

const terminalValidList = computed(() =>
  terminalValids.value.map(terminalValid =>
    Object.values(terminalValid).some(valid =>
      typeof valid === 'object' ? Object.values(valid).some(v => !v) : !valid,
    ),
  ),
)
</script>

<template>
  <div>
    <CollapseCard v-if="!!vpn" title="VPN" data-cy="quick-setup-terminal-confirm-vpn">
      <DetailGrid>
        <div>VPN ID</div>
        <div>{{ vpn.vpnId }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('vpn.name') }}</div>
        <div>{{ vpn.customerNote }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('vpn.internalAddress') }}</div>
        <div>{{ vpn.internalAddress }}</div>
      </DetailGrid>
    </CollapseCard>
    <InnerCard v-if="!vpn" data-cy="quick-setup-terminal-confirm-vpn-not-using">
      <div class="text-secondary text-lg">VPN</div>
      <div>{{ t('quickSetup.vpnNotUsing') }}</div>
    </InnerCard>
    <CollapseCard :title="t('terminals.mobileInformation')" data-cy="quick-setup-terminal-confirm-mobile">
      <template #help>
        <NuxtLink :to="TERMINAL_LINK.MOBILE" target="_blank">{{ TERMINAL_LINK.MOBILE }}</NuxtLink>
      </template>
      <CustomButton
        class="ml-auto"
        icon="right-arrow"
        :width="180"
        :text="mobileButton.text"
        :disabled="mobileButton.disabled"
        data-cy="quick-setup-terminal-confirm-mobile-button"
        @click="mobileButton.click"
      />
      <EditTerminalMobile v-model:mobile="mobile" v-model:valid="mobileValid" :disabled="!isMobileEdit" />
      <div class="mt-5 mb-1 text-secondary text-xl">{{ t('terminals.picInformation') }}</div>
      <EditTerminalMobilePicInformation
        v-model:mobile="mobile"
        v-model:valid="mobileValid"
        is-quick-setup
        :disabled="!isMobileEdit"
      />
    </CollapseCard>
    <CollapseCard
      v-for="(_terminal, index) in terminals"
      :key="`${t('sideBar.terminal')} ${index + 1}`"
      :title="`${t('sideBar.terminal')} ${index + 1}`"
      data-cy="quick-setup-terminal-confirm-terminals"
    >
      <CustomButton
        class="ml-auto"
        icon="right-arrow"
        :width="180"
        :text="editing.includes(`terminal-${index}`) ? t('common.save') : t('common.edit')"
        :disabled="editing.includes(`terminal-${index}`) && terminalValidList[index]"
        :data-cy="`quick-setup-terminal-confirm-terminals-button-${index}`"
        @click="() => editButtonClick(`terminal-${index}`)"
      />
      <EditTerminalData
        v-model:terminal="terminals[index]!"
        v-model:valid="terminalValids[index]!"
        is-bulk
        :customer-note-list="customerNoteList"
        :disabled="!editing.includes(`terminal-${index}`)"
        :break-out-list="breakOutList"
        :guarantee-list="guaranteeList"
        :ipoe-list-options="ipoeListOptions"
        :disabled-dates="disabledDates"
        :data-cy="`quick-setup-terminal-confirm-terminals-${index}`"
      />
    </CollapseCard>
    <div v-if="editing.length > 0" class="d-flex justify-end text-warning">{{ t('quickSetup.confirmMessage') }}</div>
  </div>
</template>
