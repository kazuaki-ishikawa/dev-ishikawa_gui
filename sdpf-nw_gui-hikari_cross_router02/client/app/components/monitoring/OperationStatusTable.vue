<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { TerminalTypes } from '@/api/constants'
import { HealthStatus } from '@/api/healthStatus/constants'
import type { MixedHealthStatusResponse } from '@/components/monitoring/types'
import { IconTypes } from '@/components/icons/constants'

type PropType = {
  healthStatuses: MixedHealthStatusResponse[]
  reconcilingTerminalIds: Set<string>
}
const props = defineProps<PropType>()

type Emits = {
  (e: 'moveToDetail', terminalId: string): void
  (e: 'moveToSelfCheck', terminalId: string): void
  (e: 'reconcileStatus', terminalId: string): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()

const headers = [
  { label: 'terminalId', class: 'cell' },
  { label: 'terminalName', class: 'cell' },
  { label: 'terminalStatus', class: 'cell' },
  { label: 'ipoeId', class: 'cell' },
  { label: 'ipoeType', class: 'cell' },
  { label: 'internetCommunication', class: 'cell text-size-13px' },
  { label: 'vpnId', class: 'cell' },
  { label: 'vpnConnection', class: 'cell' },
  { label: 'reconcileStatus', class: 'cell', help: t('monitorings.reconcileStatusHelpTooltip') },
]

const { getGuaranteeStatus, getVpnStatus } = useHealthStatus()

const tableItems = computed(() =>
  props.healthStatuses.map(row => {
    const isSwitchover = row.terminal.isSwitchover
    const guaranteeStatus = row.guarantee ? getGuaranteeStatus(row) : undefined
    // ギャランティステータスが warning で 迂回実行中の場合は 「迂回実行中」と表示する
    const guaranteeStatusText =
      guaranteeStatus === HealthStatus.Warning && isSwitchover ? t('terminals.isSwitchover') : undefined
    const vpnStatus = getVpnStatus(row)
    // VPNステータスが warning の時は「迂回実行中」と表示する
    const vpnStatusText = vpnStatus === HealthStatus.Warning ? t('terminals.isSwitchover') : undefined
    return {
      ...row,
      isSwitchover,
      guaranteeStatus,
      guaranteeStatusText,
      vpnStatus,
      vpnStatusText,
      // ステータス再取得の通信中はボタンを非活性化する
      isReconcileDisabled: props.reconcilingTerminalIds.has(row.terminal.terminalId),
    }
  }),
)
</script>

<template>
  <div class="operation-table-container">
    <div class="operation-table">
      <div class="header">
        <div v-for="header in headers" :key="header.label" class="flex-flex-start-center" :class="header.class">
          {{ t(`monitorings.${header.label}`) }}
          <HelpTooltip v-if="header.help" class="px-2 pt-1" size="smallMiddle">
            {{ header.help }}
          </HelpTooltip>
        </div>
      </div>
      <div class="body">
        <div v-for="row in tableItems" :key="row.terminal.terminalId" class="row">
          <!-- 端末ID -->
          <div class="terminal-id text-center">
            <div v-if="row.terminal.terminalType" class="terminal-type border-b-sm">
              {{ t(`terminals.${row.terminal.terminalType}`) }}
            </div>
            <div class="id flex-center-center">
              <div class="py-2" @click.stop="emits('moveToDetail', row.terminal.terminalId)">
                <span class="mr-2">{{ row.terminal.terminalId }}</span>
                <SvgIcon :type="IconTypes.CaretRight" size="xSmall" />
              </div>
            </div>
            <div v-if="row.terminal.terminalType === TerminalTypes.Rental" class="pb-2">
              <button class="self-check-button" @click.stop="emits('moveToSelfCheck', row.terminal.terminalId)">
                <span class="mr-1">{{ t('monitorings.selfCheck') }}</span>
                <SvgIcon :type="IconTypes.CaretRight" size="xSmall" color="secondary" />
              </button>
            </div>
          </div>
          <!-- 端末名 -->
          <div class="customer-name flex-flex-start-center">{{ row.terminal.customerNote || '-' }}</div>
          <!-- 端末ステータス -->
          <StatusIndicator :status="row.terminal.terminalStatus" />
          <!-- 回線ID -->
          <div class="circuit">
            <div v-if="row.guarantee?.guaranteeId" class="id flex-flex-start-center">
              {{ row.guarantee.guaranteeId }}
            </div>
            <div v-if="row.ipoe?.ipoeId" class="id flex-flex-start-center">{{ row.ipoe.ipoeId }}</div>
            <div v-if="row.mobile?.mobileId" class="id flex-flex-start-center">{{ row.mobile.mobileId }}</div>
          </div>
          <!-- 種別 -->
          <div class="circuit">
            <div v-if="row.guarantee?.guaranteeId" class="type flex-flex-start-center">
              {{ t('monitorings.guarantee') }}
            </div>
            <div v-if="row.ipoe?.ipoeId" class="type text-xs flex-flex-start-center">{{ t('monitorings.ipoe') }}</div>
            <div v-if="row.mobile?.mobileId" class="type flex-flex-start-center">{{ t('monitorings.mobile') }}</div>
          </div>
          <!-- インターネット通信 -->
          <div class="circuit">
            <template v-if="!!row.guarantee">
              <div v-if="row.guaranteeStatus === 'none'" class="flex-flex-start-center pl-2 bg-white">-</div>
              <StatusIndicator v-else :status="row.guaranteeStatus" :text="row.guaranteeStatusText" />
            </template>
            <StatusIndicator v-if="!!row.ipoe" :status="row.ipoe.ipoeStatus" />
            <StatusIndicator v-if="!!row.mobile" :status="row.mobile?.mobileStatus" />
          </div>
          <!-- VPN ID -->
          <div class="flex-flex-start-center pl-2 bg-white">{{ row?.vpn?.vpnId || '-' }}</div>
          <!-- VPN接続 -->
          <div v-if="row.vpnStatus === 'none'" class="flex-flex-start-center pl-2 bg-white">-</div>
          <StatusIndicator v-else :status="row.vpnStatus" :text="row.vpnStatusText" />
          <!-- ステータス再取得 -->
          <div class="status-reconcile flex-center-center bg-white">
            <CustomButton
              icon="right-arrow"
              :text="t('monitorings.reconcileStatus')"
              :width="180"
              :disabled="row.isReconcileDisabled"
              @click.stop="emits('reconcileStatus', row.terminal.terminalId)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$primary-color: rgb(var(--v-theme-primary));
$light-color: rgb(var(--v-theme-secondary));
$light-primary-color: rgb(var(--v-theme-light-primary));
$container-bg-color: rgb(var(--v-theme-highlight));
$padding: 0.5rem;

.common-grid {
  display: grid;
  grid-template-columns: 140px minmax(122px, 1fr) 130px 122px 188px 137px 122px 137px 200px;
  gap: $padding * 0.5;
  padding-bottom: $padding * 0.5;
}

.operation-table-container {
  overflow-x: auto;
}
.operation-table {
  padding-bottom: $padding * 0.5;
  font-size: 0.85rem;
  .header {
    @extend .common-grid;
    padding-bottom: $padding;

    .cell {
      padding-left: $padding * 0.6875;
      border-left: v.$split-bold-border;
      margin-left: -$padding * 0.35;
      &:first-of-type {
        border-left: none;
      }
    }
    .text-size-13px {
      font-size: 13px;
    }
  }
  .body {
    border-radius: v.$child-border-radius;
    .row {
      @extend .common-grid;
      .terminal-type {
        font-size: 0.75rem;
        padding-top: 6px;
        padding-bottom: 6px;
      }
      .self-check-button {
        user-select: none;
        border-style: none;
        border-radius: 0.75rem;
      }
      // 祖先要素の .body に overflow:hidden を付けられないため、個々の要素にborder-radiusを設定する
      &:first-child:not(:only-child) {
        .terminal-id {
          border-radius: 10px 0 0 0;
        }
        .status-reconcile {
          border-radius: 0 10px 0 0;
        }
      }
      &:last-child:not(:only-child) {
        .terminal-id {
          border-radius: 0 0 0 10px;
        }
        .status-reconcile {
          border-radius: 0 0 10px 0;
        }
      }
      &:only-child {
        .terminal-id {
          border-radius: 10px 0 0 10px;
        }
        .status-reconcile {
          border-radius: 0 10px 10px 0;
        }
      }

      &:last-of-type {
        padding-bottom: 0;
      }
      .terminal-id {
        background: linear-gradient(90deg, $light-color, $primary-color);
        color: $container-bg-color;
        display: grid;
        grid-template-rows: 1fr max-content;
        .id {
          &:hover {
            cursor: pointer;
            opacity: 0.8;
          }
        }
        button {
          font-size: smaller;
          color: $light-color;
          background-color: $container-bg-color;
          margin: 0 auto;
          &:hover {
            cursor: pointer;
            opacity: 0.8;
          }
        }
      }
      .customer-name {
        background-color: $light-primary-color;
        padding: 0 $padding;
        word-break: break-all;
      }
      .circuit {
        display: grid;
        gap: $padding * 0.5;
        .id {
          padding: $padding;
          background-color: $light-primary-color;
        }
        .type {
          padding: $padding;
          background-color: #fff;
        }
      }
      .fic {
        display: grid;
        gap: $padding * 0.5;
        .id {
          padding: $padding;
          background-color: #fff;
        }
      }
    }
  }
}
</style>
