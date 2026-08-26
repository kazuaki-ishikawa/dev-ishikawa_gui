<script lang="ts" setup>
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { CommunicationStatus, SituationTypes } from '@/api/healthDiagnosis/constants'
import type { HealthDiagnosisResponseBody } from '@/api/healthDiagnosis/types'

type PropType = {
  healthDiagnosis?: HealthDiagnosisResponseBody
}
const props = defineProps<PropType>()
const { t } = useI18n()
const { $vuetify } = useNuxtApp()
const colors = computed(() => $vuetify.theme.current.value.colors)

const statusTypes = {
  main: 'main',
  backup: 'backup',
  disconnected: 'disconnected',
}

const mainCircuit = computed(() =>
  props.healthDiagnosis?.communicationStatus.find(status => status.situation === SituationTypes.Main),
)
const backupCircuit = computed(() =>
  props.healthDiagnosis?.communicationStatus.find(status => status.situation === SituationTypes.Backup),
)

const status = computed(() =>
  mainCircuit.value?.status === CommunicationStatus.OK
    ? statusTypes.main
    : backupCircuit.value?.status === CommunicationStatus.OK
      ? statusTypes.backup
      : statusTypes.disconnected,
)

const circuitType = computed(() =>
  status.value === statusTypes.main ? mainCircuit.value?.circuitType : backupCircuit.value?.circuitType,
)

const statusColor = computed(() => {
  if (
    (mainCircuit.value?.status === CommunicationStatus.OK && backupCircuit.value?.status === undefined) ||
    (mainCircuit.value?.status === CommunicationStatus.OK && backupCircuit.value?.status === CommunicationStatus.OK)
  ) {
    return colors.value.success as string
  } else if (
    (mainCircuit.value?.status === CommunicationStatus.NG && backupCircuit.value?.status === undefined) ||
    (mainCircuit.value?.status === CommunicationStatus.NG && backupCircuit.value?.status === CommunicationStatus.NG)
  ) {
    return colors.value.error as string
  } else {
    return colors.value.warning as string
  }
})

const currentDatetime = computed(() =>
  dayjs(props.healthDiagnosis?.currentDatetime).format(t('selfCheck.currentDatetimeFormat')),
)
</script>

<template>
  <div class="text-lg text-secondary">{{ t('selfCheck.currentCommunicationStatus') }}</div>
  <div class="grid-cols-5">
    <!-- カード -->
    <div :style="{ color: statusColor }" class="card">
      <div v-if="status !== statusTypes.disconnected">
        <div>{{ t(`alerts.${status}`) }}</div>
        <div class="text-xl pl-1">{{ t(`monitorings.${circuitType}`) }}</div>
      </div>
      <div v-else>
        {{ t(`alerts.disconnected`) }}
      </div>
    </div>
    <!-- メッセージ -->
    <div class="message">
      <div
        v-if="statusColor !== colors.success"
        class="no-line-failure text-size-2xl pa-2"
        :style="{ color: statusColor }"
      >
        {{ t('selfCheck.lineFailure') }}
      </div>
      <div v-else class="text-size-2xl pa-2" :style="{ color: statusColor }">{{ t('selfCheck.noLineFailure') }}</div>
      <div class="pl-2">({{ currentDatetime }})</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.grid-cols-5 {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
}
.card {
  grid-column: span 3 / span 3;
  font-size: 2.25rem;
}
.message {
  grid-column: span 2 / span 2;
}
.text-size-2xl {
  font-size: 1.5rem;
}
.card-bottom {
  border-top: 1px solid #fff;
}
.card-bottom-left {
  border-right: 1px solid #fff;
  display: flex;
  justify-content: center;
  align-items: center;
}
.no-line-failure {
  background-color: rgb(var(--v-theme-light-primary));
}
</style>
