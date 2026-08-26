<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { CircuitTypes } from '@/api/constants'
import { ConnectionTypes } from '@/api/guarantees/constants'
import { SituationTypes } from '@/api/healthDiagnosis/constants'
import type { HealthDiagnosisResponseBody } from '@/api/healthDiagnosis/types'
import { HealthStatus } from '@/api/healthStatus/constants'
import type { HealthStatusResponse, FicHealthStatusResponse, BgpPingHealthStatusType } from '@/api/healthStatus/types'
import { IconTypes } from '@/components/icons/constants'

const EMPTY_DATA = 'none' as const

type PropType = {
  tenantId: string
  isSelfTerminal: boolean
  healthDiagnosis: HealthDiagnosisResponseBody
  healthStatus?: HealthStatusResponse
  ficHealthStatuses?: FicHealthStatusResponse[]
  mainGuaranteeConnected?: boolean
  inProgressSwitchover?: boolean
}
const props = defineProps<PropType>()

const { t } = useI18n()

const { getGuaranteeStatus } = useHealthStatus()

const ficStatus = computed(
  () => props.ficHealthStatuses?.find(fic => fic.vpnId === props.healthStatus?.vpn?.vpnId)?.ficStatus ?? EMPTY_DATA,
)

const ipsecStatusText = computed(() => {
  const mainCircuitType = props.healthDiagnosis?.communicationStatus.find(
    status => status.situation === SituationTypes.Main,
  )?.circuitType
  if (mainCircuitType === CircuitTypes.Guarantee) {
    const backupCircuitType = props.healthDiagnosis?.communicationStatus.find(
      status => status.situation === SituationTypes.Backup,
    )?.circuitType
    switch (backupCircuitType) {
      case CircuitTypes.Ipoe:
        return t('selfCheck.ipoeVpn')
      case CircuitTypes.Mobile:
        return t('selfCheck.mobileVpn')
      default:
        return t('selfCheck.ipsecStatus')
    }
  } else {
    return t('selfCheck.ipsecStatus')
  }
})

const getGuaranteeBgpVpnStatus = (vpnBgpStatus?: BgpPingHealthStatusType) => {
  if (!vpnBgpStatus?.act && !vpnBgpStatus?.sby) {
    return EMPTY_DATA
  }

  if (vpnBgpStatus.act === HealthStatus.OK && vpnBgpStatus.sby === HealthStatus.OK) {
    return HealthStatus.OK
  } else if (vpnBgpStatus.act !== vpnBgpStatus.sby) {
    return HealthStatus.Warning
  } else if (vpnBgpStatus.act === HealthStatus.NG && vpnBgpStatus.sby === HealthStatus.NG) {
    return HealthStatus.NG
  }
  return EMPTY_DATA
}

const item = computed(() => {
  const vpnBgpStatus = props.healthStatus?.guaranteeBgp?.vpnBgpStatus
  const ipsecStatus = props.healthStatus?.vpn?.ipsecStatus ?? EMPTY_DATA
  const guaranteeBgpInternet = props.healthStatus ? getGuaranteeStatus(props.healthStatus) : EMPTY_DATA
  const guaranteeBgpVpn = getGuaranteeBgpVpnStatus(vpnBgpStatus)

  return {
    terminalStatus: props.isSelfTerminal ? EMPTY_DATA : props.healthDiagnosis.terminalStatus,
    guaranteeBgpInternet,
    guaranteeBgpInternetText:
      guaranteeBgpInternet === HealthStatus.Warning && props.inProgressSwitchover
        ? t('terminals.isSwitchover')
        : undefined,
    guaranteeBgpVpn,
    guaranteeBgpVpnText:
      guaranteeBgpVpn === HealthStatus.Warning && props.inProgressSwitchover ? t('terminals.isSwitchover') : undefined,
    ipoeStatus: props.healthStatus?.ipoe?.ipoeStatus ?? EMPTY_DATA,
    mobileStatus: props.healthStatus?.mobile?.mobileStatus ?? EMPTY_DATA,
    ipsecStatus: props.mainGuaranteeConnected && ipsecStatus === HealthStatus.NG ? 'disconnected' : ipsecStatus,
    ficStatus: ficStatus.value,
  }
})
// ユーザーが利用しているリソースのみを表示
const headers = computed(() => {
  const allHeaders = [
    { text: t('selfCheck.comTerminal'), key: 'terminalStatus' as const },
    { text: t('selfCheck.guaranteeBgpInternet'), key: 'guaranteeBgpInternet' as const },
    { text: t('selfCheck.guaranteeBgpVpn'), key: 'guaranteeBgpVpn' as const },
    { text: t('selfCheck.pingIpoe'), key: 'ipoeStatus' as const },
    { text: t('selfCheck.pingMobile'), key: 'mobileStatus' as const },
    { text: ipsecStatusText.value, key: 'ipsecStatus' as const },
    { text: t('selfCheck.ficConnection'), key: 'ficStatus' as const },
  ]
  return allHeaders.filter(header => item.value[header.key] !== EMPTY_DATA)
})

const headerType = ref('')
const handleHeaderClick = (clickedHeader: string) => {
  headerType.value = headerType.value !== clickedHeader ? clickedHeader : ''
}
</script>

<template>
  <div>
    <SeparatedTable :headers="headers" :items="[item]">
      <template #header="{ data }">
        <template v-if="['guaranteeBgpInternet', 'guaranteeBgpVpn'].includes(data.key)">
          <div class="flex-space-between-center h-100">
            <div class="pl-3 flex-grow-1 text-pre-wrap position-relative">{{ data.text }}</div>
            <SvgIcon
              class="mr-3 cursor-pointer"
              :type="IconTypes.CaretDown"
              size="small"
              color="secondary"
              @click="handleHeaderClick(data.key)"
            />
            <div v-if="headerType === data.key" class="bgp-status-table position-absolute">
              <BgpStatusTable
                :header-type="headerType === 'guaranteeBgpInternet' ? ConnectionTypes.Internet : ConnectionTypes.Vpn"
                :health-status="healthStatus"
              />
            </div>
          </div>
        </template>
        <div v-else class="flex-center-center h-100 text-pre-wrap">{{ data.text }}</div>
      </template>

      <template #terminalStatus="{ data }">
        <StatusIndicator
          v-if="data === HealthStatus.OK || data === HealthStatus.NG || data === HealthStatus.Warning"
          :status="data"
        />
        <div v-else>{{ data }}</div>
      </template>
      <template #guaranteeBgpInternet="{ row }">
        <StatusIndicator
          v-if="
            row.guaranteeBgpInternet === HealthStatus.OK ||
            row.guaranteeBgpInternet === HealthStatus.NG ||
            row.guaranteeBgpInternet === HealthStatus.Warning
          "
          :status="row.guaranteeBgpInternet"
          :text="row.guaranteeBgpInternetText"
        />
      </template>
      <template #guaranteeBgpVpn="{ row }">
        <StatusIndicator
          v-if="
            row.guaranteeBgpVpn === HealthStatus.OK ||
            row.guaranteeBgpVpn === HealthStatus.NG ||
            row.guaranteeBgpVpn === HealthStatus.Warning
          "
          :status="row.guaranteeBgpVpn"
          :text="row.guaranteeBgpVpnText"
        />
      </template>
      <template #ipoeStatus="{ data }">
        <StatusIndicator
          v-if="data === HealthStatus.OK || data === HealthStatus.NG || data === HealthStatus.Warning"
          :status="data"
        />
        <div v-else>{{ data }}</div>
      </template>
      <template #mobileStatus="{ data }">
        <StatusIndicator
          v-if="data === HealthStatus.OK || data === HealthStatus.NG || data === HealthStatus.Warning"
          :status="data"
        />
        <div v-else>{{ data }}</div>
      </template>
      <template #ficStatus="{ data }">
        <StatusIndicator
          v-if="data === HealthStatus.OK || data === HealthStatus.NG || data === HealthStatus.Warning"
          :status="data"
        />
        <div v-else>{{ data }}</div>
      </template>
      <template #ipsecStatus="{ data }">
        <StatusIndicator
          v-if="data === HealthStatus.OK || data === HealthStatus.NG || data === HealthStatus.Warning"
          :status="data"
        />
        <CustomTooltip v-else-if="data === 'disconnected'" class="h-100 w-100">
          <template #activator>
            <StatusIndicator :status="data" />
          </template>
          <template #default>{{ t('selfCheck.guaranteeIpsecDisconnectedMessage') }}</template>
        </CustomTooltip>
        <div v-else>{{ data }}</div>
      </template>
    </SeparatedTable>
  </div>
</template>

<style lang="scss" scoped>
.bgp-status-table {
  margin-top: 180px;
  z-index: 10;
}
</style>
