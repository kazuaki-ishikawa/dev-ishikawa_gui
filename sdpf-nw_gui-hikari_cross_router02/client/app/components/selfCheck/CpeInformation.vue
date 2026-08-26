<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import type { HealthDiagnosisResponseBody } from '@/api/healthDiagnosis/types'

type PropType = {
  healthDiagnosis?: HealthDiagnosisResponseBody
  model: string | undefined
}
const props = defineProps<PropType>()

const { t } = useI18n()

const headers = [
  { text: t('monitorings.terminalId'), key: 'terminalId' },
  { text: t('selfCheck.terminalName'), key: 'model' },
  { text: t('selfCheck.currentDatetime'), key: 'currentDatetime' },
  { text: t('selfCheck.operatingTime'), key: 'operatingTime' },
  { text: t('selfCheck.lastBootDatetime'), key: 'lastBootDatetime' },
]
const items = computed(() => [
  {
    terminalId: props.healthDiagnosis?.terminalId ?? '',
    model: props.model ?? '',
    currentDatetime: formatDateTime(props.healthDiagnosis?.currentDatetime),
    operatingTime: props.healthDiagnosis?.operatingTime ?? '-',
    lastBootDatetime: formatDateTime(props.healthDiagnosis?.lastBootDatetime),
  },
])
</script>

<template>
  <div>
    <div class="mb-2 text-secondary">{{ t('selfCheck.comTerminalInformation') }}</div>
    <SeparatedTable :headers="headers" :items="items" />
  </div>
</template>
