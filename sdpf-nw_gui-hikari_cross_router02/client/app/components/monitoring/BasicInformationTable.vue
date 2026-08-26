<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import type { HealthStatusResponse } from '@/api/healthStatus/types'

type PropType = {
  healthStatus?: HealthStatusResponse
}
defineProps<PropType>()
const { t } = useI18n()

const headers = [
  { label: 'status', class: 'cell' },
  { label: 'terminalId', class: 'cell' },
  { label: 'terminalName', class: 'cell' },
  { label: 'vpnId', class: 'cell' },
]
</script>

<template>
  <div class="basic-information-table">
    <div class="header">
      <div v-for="header in headers" :key="header.label" class="flex-flex-start-center" :class="header.class">
        {{ t(`monitorings.${header.label}`) }}
      </div>
    </div>
    <div class="body">
      <div class="row">
        <div><StatusIndicator :status="healthStatus?.terminal.terminalStatus" /></div>
        <div class="bg-primary-light flex-flex-start-center pl-2">{{ healthStatus?.terminal.terminalId }}</div>
        <div class="bg-primary-light flex-flex-start-center pl-2">
          {{ healthStatus?.terminal.customerNote || '-' }}
        </div>
        <div class="bg-primary-light flex-flex-start-center pl-2">{{ healthStatus?.vpn?.vpnId || '-' }}</div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$primary-color: rgb(var(--v-theme-primary));
$light-secondary-color: rgb(var(--v-theme-light-secondary));
$padding: 0.5rem;

.common-grid {
  display: grid;
  grid-template-columns: 120px 150px 150px 1fr;
  gap: $padding * 0.5;
}
.bg-primary-light {
  background-color: $light-secondary-color;
}
.basic-information-table {
  .header {
    @extend .common-grid;
    padding-bottom: $padding;
    font-size: 0.85rem;

    .cell {
      padding-left: $padding * 0.6875;
      border-left: v.$split-bold-border;
      margin-left: -$padding * 0.35;
      &:first-of-type {
        border-left: none;
      }
    }
  }
  .body {
    border-radius: v.$child-border-radius;
    height: 80px;
    overflow: hidden;
    .row {
      @extend .common-grid;
      height: 100%;
    }
  }
}
</style>
