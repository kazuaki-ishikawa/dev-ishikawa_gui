<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import type { HealthDiagnosisResponseBody } from '@/api/healthDiagnosis/types'
import type { TerminalResponse } from '@/api/terminals/types'
import { LanTypes } from '@/api/terminals/constants'

type PropType = {
  healthDiagnosis?: HealthDiagnosisResponseBody
  terminal: TerminalResponse | null
}
const props = defineProps<PropType>()
const { t } = useI18n()

const usingPortNames = computed(() => {
  const usingPortList =
    props.terminal?.lanType === LanTypes.RoutedPort
      ? props.terminal.lans.map(lan => lan.portNumber).filter(Boolean)
      : []

  return usingPortList.map(port => `ethernet${port - 1}`)
})
</script>

<template>
  <div>
    <div class="mb-2 text-secondary">{{ t('selfCheck.interfaceInformation') }}</div>
    <InterfaceTable
      :lan-ports="healthDiagnosis?.lanPorts"
      :wan-ports="healthDiagnosis?.wanPorts"
      :using-port-names="usingPortNames"
    />
  </div>
</template>
