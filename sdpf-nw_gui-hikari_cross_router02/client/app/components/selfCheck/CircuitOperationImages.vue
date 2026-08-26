<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { CircuitTypes } from '@/api/constants'
import type { StatusType, HealthDiagnosisResponseBody } from '@/api/healthDiagnosis/types'
import { Status, SituationTypes } from '@/api/healthDiagnosis/constants'

type PropType = {
  healthDiagnosis: HealthDiagnosisResponseBody
  isSelfTerminal: boolean
}
const props = defineProps<PropType>()
const { t } = useI18n()

const { $vuetify } = useNuxtApp()
const colors = computed(() => $vuetify.theme.current.value.colors)

const infoColor = computed(() => colors.value.info as string)
const statusColor = (status?: StatusType) => {
  switch (status) {
    case Status.OK:
      return colors.value.info as string
    case Status.Warning:
      return colors.value.warning as string
    default:
      return colors.value.error as string
  }
}

const customerColor = computed(() => statusColor(props.healthDiagnosis.customerEquipmentStatus))
const terminalColor = computed(() => statusColor(props.healthDiagnosis.terminalStatus))
const ipoeOnuColor = computed(() => statusColor(props.healthDiagnosis.ipoeOnuStatus))
const ipoeWanColor = computed(() => statusColor(props.healthDiagnosis.ipoeWanStatus))
const guaranteeOnuColor = computed(() => statusColor(props.healthDiagnosis.guaranteeOnuStatus))
const guaranteeWanColor = computed(() => statusColor(props.healthDiagnosis.guaranteeWanStatus))
const mobileWanColor = computed(() => statusColor(props.healthDiagnosis.mobileWanStatus))
const internetDeviceColor = computed(() => statusColor(props.healthDiagnosis.internetStatus))
const vpnDeviceColor = computed(() => statusColor(props.healthDiagnosis.vpnStatus))
const ficRouterColor = computed(() => statusColor(props.healthDiagnosis.ficRouterStatus))

const showMainIpoeIcons = computed(
  () =>
    !!props.healthDiagnosis.communicationStatus.find(
      status => status.circuitType === CircuitTypes.Ipoe && status.situation === SituationTypes.Main,
    ),
)
const showMainMobileIcons = computed(
  () =>
    !!props.healthDiagnosis.communicationStatus.find(
      status => status.circuitType === CircuitTypes.Mobile && status.situation === SituationTypes.Main,
    ),
)
const showBackupIpoeIcons = computed(
  () =>
    !!props.healthDiagnosis.communicationStatus.find(
      status => status.circuitType === CircuitTypes.Ipoe && status.situation === SituationTypes.Backup,
    ),
)
const showGuaranteeIcons = computed(
  () =>
    !!props.healthDiagnosis.communicationStatus.find(
      status => status.circuitType === CircuitTypes.Guarantee && status.situation === SituationTypes.Main,
    ),
)
const showBackupMobileIcons = computed(
  () =>
    !!props.healthDiagnosis.communicationStatus.find(
      status => status.circuitType === CircuitTypes.Mobile && status.situation === SituationTypes.Backup,
    ),
)
const showVpnIcon = computed(() => !!props.healthDiagnosis.vpnStatus)
const showFicIcon = computed(() => !!props.healthDiagnosis.ficRouterStatus)
const showBackup = computed(() => showMainMobileIcons.value || showBackupIpoeIcons.value || showBackupMobileIcons.value)

const viewBoxWidth = computed(() => {
  // VPN接続なし(vpn非表示)の場合は fic も接続がないはずなので2つまとめて非表示になる
  const diff = showVpnIcon.value ? (showFicIcon.value ? 0 : 75) : 50 * 2
  return 625 - diff
})
const viewBoxHeight = computed(() => {
  return showVpnIcon.value ? 160 : 100
})
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    :viewBox="`0 0 ${viewBoxWidth} ${viewBoxHeight}`"
    font-size="10px"
    font-family="HiraginoSans-W6, Hiragino Sans"
  >
    <!-- 凡例 -->
    <g data-name="legend">
      <circle cx="4" cy="4" r="4" fill="#767676" />
      <text x="10" y="7" font-size="8" fill="#000">{{ t('selfCheck.ok') }}</text>
      <circle cx="40" cy="4" r="4" fill="#f5aa00" />
      <text x="46" y="7" font-size="8" fill="#000">{{ t('selfCheck.warning') }}</text>
      <circle cx="76" cy="4" r="4" fill="#ff2800" />
      <text x="82" y="7" font-size="8" fill="#000">{{ t('selfCheck.ng') }}</text>
    </g>

    <!-- お客様機器 -->
    <g
      v-if="!isSelfTerminal"
      data-name="customer"
      :fill="customerColor"
      :transform="`translate(0 ${showVpnIcon ? 58 : 20})`"
    >
      <line x2="43.423" transform="translate(69.39 38.172)" fill="none" :stroke="infoColor" stroke-width="2" />
      <g>
        <path
          d="M77.307,55l-6.24-5.869a1.653,1.653,0,0,0-1.122-.457H8.018a1.665,1.665,0,0,0-1.125.457L.655,55c-1.291,1.206-.546,3.62,1.122,3.62H76.186c1.668,0,2.413-2.414,1.122-3.62M26.173,56.021l4.23-4.906H47.441l4.232,4.906Z"
          transform="translate(0 2.255)"
        />
        <path
          d="M8.83,49.724H68.478a1.77,1.77,0,0,0,1.775-1.774V11.256a1.771,1.771,0,0,0-1.775-1.774H8.83a1.766,1.766,0,0,0-1.771,1.774V47.95A1.765,1.765,0,0,0,8.83,49.724M11.117,13.34H66.074V45.757H11.117Z"
          transform="translate(0.327 0.439)"
        />
      </g>
      <text transform="translate(23 75)">
        <tspan x="-10" y="0">{{ t('selfCheck.customerTerminal') }}</tspan>
      </text>
    </g>
    <!-- サービスルーター -->
    <g
      v-if="!isSelfTerminal"
      data-name="terminal"
      :fill="terminalColor"
      :transform="`translate(0 ${showVpnIcon ? 58 : 20})`"
    >
      <g fill="none" :stroke="infoColor" stroke-width="2">
        <line v-if="showGuaranteeIcons || showMainIpoeIcons" x1="10" x2="38" transform="translate(135.309 38.172)" />
      </g>
      <path
        d="M122.822,13.276c-6.926,0-18.647,1.309-18.647,6.216V51.671c0,.08,0,.156.009.232,0,.042.019.078.024.119,0,.013.005.023.006.035a2.976,2.976,0,0,0,.4,1.161,4.179,4.179,0,0,0,.843.988c3.228,2.843,11.828,3.681,17.365,3.681s14.136-.838,17.364-3.681a4.184,4.184,0,0,0,.844-.988,3,3,0,0,0,.4-1.165c0-.01,0-.02.005-.03.005-.041.021-.078.024-.12.007-.075.009-.153.009-.232V19.492c0-4.907-11.72-6.216-18.646-6.216m0,1.162c8.765,0,15.871,1.937,15.871,4.329s-7.106,4.328-15.871,4.328-15.872-1.938-15.872-4.328,7.106-4.329,15.872-4.329"
        transform="translate(4.827 0.615)"
      />
      <text transform="translate(91 70)" font-size="0.6rem">
        <tspan x="0" y="0">{{ t('terminals.rentalTerminal') }}</tspan>
      </text>
    </g>
    <!-- お客さま自営ルーター -->
    <g
      v-if="isSelfTerminal"
      data-name="self-terminal"
      :fill="terminalColor"
      :transform="`translate(0 ${showVpnIcon ? 58 : 20})`"
    >
      <line x2="104" transform="translate(69.39 38.172)" fill="none" :stroke="infoColor" stroke-width="2" />
      <path
        d="M122.822,13.276c-6.926,0-18.647,1.309-18.647,6.216V51.671c0,.08,0,.156.009.232,0,.042.019.078.024.119,0,.013.005.023.006.035a2.976,2.976,0,0,0,.4,1.161,4.179,4.179,0,0,0,.843.988c3.228,2.843,11.828,3.681,17.365,3.681s14.136-.838,17.364-3.681a4.184,4.184,0,0,0,.844-.988,3,3,0,0,0,.4-1.165c0-.01,0-.02.005-.03.005-.041.021-.078.024-.12.007-.075.009-.153.009-.232V19.492c0-4.907-11.72-6.216-18.646-6.216m0,1.162c8.765,0,15.871,1.937,15.871,4.329s-7.106,4.328-15.871,4.328-15.872-1.938-15.872-4.328,7.106-4.329,15.872-4.329"
        transform="translate(-70 0.615)"
      />
      <text transform="translate(18 70)" font-size="0.6rem">
        <tspan x="0" y="0">{{ t('terminals.selfTerminal') }}</tspan>
      </text>
    </g>
    <!-- アクセス回線＜メイン＞ (ギャランティアクセス or IPoE回線) -->
    <g
      v-if="showGuaranteeIcons || showMainIpoeIcons"
      data-name="main-onu"
      :fill="showGuaranteeIcons ? guaranteeOnuColor : ipoeOnuColor"
      :transform="showBackup ? `translate(-1 ${showVpnIcon ? 10 : -10})` : `translate(-5 ${showVpnIcon ? 58 : 20})`"
    >
      <path
        d="M199.37.482h-7.513a.94.94,0,0,0-.94.939V25.915H189.51a.942.942,0,0,0-.939.94v.939a.942.942,0,0,0,.939.94h12.209a.942.942,0,0,0,.939-.94v-.939a.942.942,0,0,0-.939-.94H200.31V1.421a.94.94,0,0,0-.94-.939m-3.756,15.965a1.174,1.174,0,1,1,1.174-1.174,1.174,1.174,0,0,1-1.174,1.174m0-5.166a1.173,1.173,0,1,1,1.174-1.174,1.174,1.174,0,0,1-1.174,1.174m0-5.165a1.174,1.174,0,1,1,1.174-1.174,1.174,1.174,0,0,1-1.174,1.174"
        :transform="showBackup ? 'translate(8.737 30.022)' : 'translate(3 22)'"
      />
      <path
        v-if="showBackup && showVpnIcon"
        d="M142.339,255.641 h-2 v-30.007 c0-6.321,4.908-11.463,10.94-11.463h9.94v2h-9.94c-4.93,0-8.94,4.245-8.94,9.463 V207.641z"
        transform="translate(32 -168.5)"
        :fill="infoColor"
      />
      <path
        v-if="showBackup"
        d="M142.339,255.641 h-2 v-10.007 c0-6.321,4.908-11.463,10.94-11.463h9.94v2h-9.94c-4.93,0-8.94,4.245-8.94,9.463 V207.641z"
        transform="translate(32 -188.5)"
        :fill="infoColor"
      />
      <line
        x2="17"
        :transform="`translate(244.127 ${showBackup ? 45 : 38})`"
        fill="none"
        :stroke="infoColor"
        stroke-width="2"
      />
      <text :transform="`translate(215 ${showBackup ? 50 : 42})`" font-family="Helvetica-Bold, Helvetica">
        <tspan x="0" y="0">ONU</tspan>
      </text>
    </g>
    <g
      v-if="showGuaranteeIcons || showMainIpoeIcons"
      data-name="main-wan"
      :fill="showGuaranteeIcons ? guaranteeWanColor : ipoeWanColor"
      :transform="showBackup ? `translate(-1 ${showVpnIcon ? 10 : -10})` : `translate(-5 ${showVpnIcon ? 51 : 13})`"
    >
      <path
        d="M269.465,0a14.63,14.63,0,1,0,14.63,14.631A14.648,14.648,0,0,0,269.465,0m-12.6,16.043h4.2a24.088,24.088,0,0,0,.5,3.767H257.9a12.594,12.594,0,0,1-1.034-3.767M270.407,8.51V2.03c2.059.593,3.844,3.075,4.841,6.48Zm5.287,1.883a22.564,22.564,0,0,1,.387,3.767h-5.674V10.393ZM268.523,2.03V8.51h-4.842c1-3.4,2.782-5.887,4.842-6.48m0,8.363V14.16h-5.675a22.557,22.557,0,0,1,.387-3.767ZM261.04,14.16h-4.23a12.557,12.557,0,0,1,.72-3.767h3.85a25.268,25.268,0,0,0-.34,3.767m1.84,1.883h5.643V19.81h-5.088a21.831,21.831,0,0,1-.555-3.767m5.643,5.65v5.537c-1.866-.537-3.507-2.618-4.541-5.537Zm1.883,5.537V21.694h4.54c-1.034,2.919-2.675,5-4.54,5.537m0-7.421V16.043h5.642a21.933,21.933,0,0,1-.554,3.767Zm7.455-3.767h4.2a12.563,12.563,0,0,1-1.034,3.767h-3.664a24.091,24.091,0,0,0,.5-3.767m.027-1.883a25.139,25.139,0,0,0-.34-3.767h3.85a12.556,12.556,0,0,1,.72,3.767Zm2.671-5.65h-3.421a15.631,15.631,0,0,0-2.506-5.446A12.747,12.747,0,0,1,280.56,8.51M264.3,3.064a15.61,15.61,0,0,0-2.5,5.446h-3.423A12.747,12.747,0,0,1,264.3,3.064m-5.355,18.63h3.114a14.85,14.85,0,0,0,2.241,4.5,12.756,12.756,0,0,1-5.355-4.5m15.692,4.5a14.85,14.85,0,0,0,2.241-4.5h3.114a12.756,12.756,0,0,1-5.355,4.5"
        transform="translate(11.807 30)"
      />
      <path
        v-if="showBackup && !showVpnIcon"
        d="M159.13,208.713h-2v-12.079c0-5.218-3.658-9.463-8.155-9.463h-43.155v-2h43.155 c5.6,0,10.155,5.143,10.155,11.463V208.713z"
        transform="translate(255.9 -141)"
        :fill="infoColor"
        :stroke-width="0"
      />
      <g transform="translate(300 0)">
        <rect x="0" y="32" :width="showGuaranteeIcons ? 62 : 80" height="28" fill="white" />
        <text y="41.5">
          {{ showGuaranteeIcons ? t('selfCheck.guaranteeWan') : t('selfCheck.ipoeWan') }}
        </text>
        <text y="57.5">
          {{ showGuaranteeIcons ? t('selfCheck.wanSuffix') : t('selfCheck.wanIPoESuffix') }}
        </text>
      </g>
    </g>
    <!-- アクセス回線＜バックアップ＞ (モバイル回線 or IPoE回線) -->
    <g
      v-if="showBackupIpoeIcons"
      data-name="backup-onu"
      :fill="ipoeOnuColor"
      :transform="`translate(-1 ${showVpnIcon ? 66 : 20})`"
    >
      <path
        d="M199.37.482h-7.513a.94.94,0,0,0-.94.939V25.915H189.51a.942.942,0,0,0-.939.94v.939a.942.942,0,0,0,.939.94h12.209a.942.942,0,0,0,.939-.94v-.939a.942.942,0,0,0-.939-.94H200.31V1.421a.94.94,0,0,0-.94-.939m-3.756,15.965a1.174,1.174,0,1,1,1.174-1.174,1.174,1.174,0,0,1-1.174,1.174m0-5.166a1.173,1.173,0,1,1,1.174-1.174,1.174,1.174,0,0,1-1.174,1.174m0-5.165a1.174,1.174,0,1,1,1.174-1.174,1.174,1.174,0,0,1-1.174,1.174"
        transform="translate(8.737 50.022)"
      />
      <line x2="17.788" transform="translate(244.127 63.676)" fill="none" :stroke="infoColor" stroke-width="2" />
      <text transform="translate(214.736 67.529)" font-family="Helvetica-Bold, Helvetica">
        <tspan x="0" y="0">ONU</tspan>
      </text>
    </g>
    <g
      v-if="showBackup"
      data-name="backup-wan"
      :fill="showBackupIpoeIcons ? ipoeWanColor : mobileWanColor"
      :transform="`translate(${showVpnIcon ? 0 : -1} ${showVpnIcon ? 66 : 20})`"
    >
      <path
        d="M236.465,47a14.63,14.63,0,1,0,14.63,14.631A14.648,14.648,0,0,0,236.465,47m-12.6,16.043h4.2a24.088,24.088,0,0,0,.5,3.767H224.9a12.594,12.594,0,0,1-1.034-3.767m13.537-7.534V49.03c2.059.593,3.844,3.075,4.841,6.48Zm5.287,1.883a22.559,22.559,0,0,1,.387,3.767h-5.674V57.393Zm-7.171-8.363v6.48h-4.842c1-3.4,2.782-5.887,4.842-6.48m0,8.363V61.16h-5.675a22.561,22.561,0,0,1,.387-3.767ZM228.04,61.16h-4.23a12.557,12.557,0,0,1,.72-3.767h3.851a25.276,25.276,0,0,0-.34,3.767m1.84,1.883h5.643V66.81h-5.088a21.826,21.826,0,0,1-.555-3.767m5.643,5.65v5.537c-1.866-.537-3.507-2.618-4.541-5.537Zm1.883,5.537V68.694h4.54c-1.034,2.919-2.675,5-4.54,5.537m0-7.421V63.043h5.642a21.927,21.927,0,0,1-.553,3.767Zm7.455-3.767h4.2a12.563,12.563,0,0,1-1.034,3.767h-3.664a24.088,24.088,0,0,0,.5-3.767m.027-1.883a25.139,25.139,0,0,0-.34-3.767H248.4a12.557,12.557,0,0,1,.72,3.767Zm2.671-5.65h-3.422a15.63,15.63,0,0,0-2.506-5.446,12.747,12.747,0,0,1,5.927,5.446M231.3,50.064a15.61,15.61,0,0,0-2.5,5.446h-3.423a12.747,12.747,0,0,1,5.927-5.446m-5.355,18.63h3.114a14.849,14.849,0,0,0,2.241,4.5,12.756,12.756,0,0,1-5.355-4.5m15.692,4.5a14.849,14.849,0,0,0,2.241-4.5h3.114a12.756,12.756,0,0,1-5.355,4.5"
        :transform="`translate(${showBackupIpoeIcons ? 44 : 10.278} ${
          showGuaranteeIcons || showMainIpoeIcons ? 2.178 : showVpnIcon ? -33 : -24
        })`"
      />
      <g
        v-if="!showGuaranteeIcons && !showMainIpoeIcons"
        :transform="`translate(1 ${showVpnIcon ? 9 : 16})`"
        :fill="infoColor"
        stroke-width="2"
      >
        <line x1="1" x2="75" transform="translate(145.2 21)" :stroke="infoColor" />
        <g v-if="showVpnIcon">
          <path
            d="M142.339,255.641 h-2 v-30.007 c0-6.321,4.908-11.463,10.94-11.463h75.94v2h-75.94c-4.93,0-8.94,4.245-8.94,9.463 V207.641z"
            transform="translate(232.5 -235)"
            stroke-width="0"
          />
          <path
            d="M193.18,235.348 h-69.377 c -6.321,0 -11.463 -5.143 -11.463 -11.463 v-22.244 h2 v22.244 c0,5.218,4.245,9.463,9.463,9.463 h69.377V235.348z"
            transform="translate(260.5 -180)"
            stroke-width="0"
          />
          <line x1="36.8" x2="-16.8" transform="translate(338 21)" :stroke="infoColor" />
        </g>
        <line v-else x1="90" x2="-42" transform="translate(364 20)" :stroke="infoColor" />
      </g>
      <g v-else :fill="infoColor" stroke-width="0">
        <g v-if="showVpnIcon">
          <path
            v-if="showBackupMobileIcons"
            d="M193.18,235.348 h-39.377 c -6.321,0 -11.463 -5.143 -11.463 -11.463 v-22.244 h2 v22.244 c0,5.218,4.245,9.463,9.463,9.463 h39.377V235.348z"
            transform="translate(29 -170.5)"
          />
          <path
            v-if="showBackupIpoeIcons"
            d="M193.18,235.348 h-9.377 c -6.321,0 -11.463 -5.143 -11.463 -11.463 v-22.244 h2 v22.244 c0,5.218,4.245,9.463,9.463,9.463 h9.377V235.348z"
            transform="translate(-1 -170.5)"
          />
        </g>
        <g v-else-if="showBackupMobileIcons">
          <path
            d="M193.18,235.348 h-42.377 c -6.321,0 -11.463 -5.143 -11.463 -11.463 v-14.244 h2 v14.244 c0,5.218,4.245,9.463,9.463,9.463 h42.377V235.348z"
            transform="translate(33 -170.5)"
          />
          <path
            d="M162.667,235.348h-85.761v-2h85.761c5.218,0,9.463-4.245,9.463-9.463v-14.275h2v14.275 C174.13,230.205,168.987,235.348,162.667,235.348z"
            transform="translate(240.8 -170.5)"
          />
        </g>
        <g v-else>
          <path
            d="M193.18,235.348 h-9.377 c -6.321,0 -11.463 -5.143 -11.463 -11.463 v-14.244 h2 v14.244 c0,5.218,4.245,9.463,9.463,9.463 h9.377V235.348z"
            transform="translate(0 -170.5)"
          />
          <path
            d="M162.667,235.348h-30.761v-2h30.761c5.218,0,9.463-4.245,9.463-9.463v-14.275h2v14.275 C174.13,230.205,168.987,235.348,162.667,235.348z"
            transform="translate(240.8 -170.5)"
          />
        </g>
      </g>
      <text
        :transform="`translate(${showBackupIpoeIcons ? 300 : 268} ${
          showGuaranteeIcons || showMainIpoeIcons ? 68.5 : showVpnIcon ? 33.5 : 42.5
        })`"
        letter-spacing="-0.08em"
      >
        <tspan x="0" y="-8">
          {{ showBackupIpoeIcons ? t('selfCheck.ipoeWan') : t('selfCheck.mobileWan') }}
        </tspan>
        <tspan x="0" y="8">
          {{ showBackupIpoeIcons ? t('selfCheck.wanIPoESuffix') : t('selfCheck.wanSuffix') }}
        </tspan>
      </text>
    </g>
    <!-- お客さま自営ルーターVPNありの時の罫線 -->
    <g
      v-if="!showBackup && showVpnIcon"
      data-name="wan-vpn-internet-mesh"
      :fill="infoColor"
      stroke-width="2"
      transform="translate(0 20)"
    >
      <path
        d="M142.339,255.641 h-2 v-30.007 c0-6.321,4.908-11.463,10.94-11.463h9.94v2h-9.94c-4.93,0-8.94,4.245-8.94,9.463 V207.641z"
        transform="translate(275 -180)"
      />
      <line x1="-14" x2="25" transform="translate(392.28 76.5)" :stroke="infoColor" />
      <path
        d="M193.18,235.348 h-9.377 c -6.321,0 -11.463 -5.143 -11.463 -11.463 v-22.244 h2 v22.244 c0,5.218,4.245,9.463,9.463,9.463 h9.377V235.348z"
        transform="translate(243 -124.5)"
      />
      <line x1="0" x2="26" transform="translate(436 35.15)" :stroke="infoColor" />
      <line x1="0" x2="15" transform="translate(436 109.85)" :stroke="infoColor" />
    </g>
    <!-- メッシュ -->
    <g
      v-if="showBackup && showVpnIcon && (showGuaranteeIcons || showMainIpoeIcons)"
      data-name="wan-vpn-internet-mesh"
      transform="translate(400 55)"
      fill="none"
      :stroke="infoColor"
      stroke-width="2"
    >
      <line
        v-if="showGuaranteeIcons || showMainIpoeIcons"
        :x1="`${showMainIpoeIcons ? 72 : 70}`"
        :x2="`${showMainIpoeIcons ? -0.5 : -30}`"
        :y1="`70`"
        :transform="`translate(${showMainIpoeIcons ? -15 : -5} 0)`"
      />
      <line
        v-if="showBackupMobileIcons || showBackupIpoeIcons"
        :x1="showBackupIpoeIcons ? 92 : 112"
        :x2="showBackupIpoeIcons ? 0 : -30"
        y1="-72"
        :transform="`translate(${showBackupIpoeIcons ? -25 : -50} 75)`"
      />
      <line :x1="`${showMainIpoeIcons ? 82 : 102}`" :transform="`translate(${showMainIpoeIcons ? -16 : -35.6} 0)`" />
      <line :x1="showBackupIpoeIcons ? 82 : 132" :transform="`translate(${showBackupIpoeIcons ? -25.5 : -80.5} 75)`" />
    </g>
    <!-- FIC接続 -->
    <g v-if="showFicIcon && showVpnIcon" data-name="fic-router" :fill="ficRouterColor" transform="translate(0,15)">
      <line
        x1="90"
        transform="translate(497 40)"
        fill="none"
        :stroke="infoColor"
        stroke-miterlimit="10"
        stroke-width="2"
      />
      <g>
        <path
          d="M580.523,53.527a4.434,4.434,0,0,0-3.888,4.92l.013.1a4.532,4.532,0,1,0,3.97-5.032l-.094.013"
          transform="translate(26.716 2.478)"
        />
        <path d="M586.762,22.707a6.7,6.7,0,1,0,.03,0h0" transform="translate(26.898 1.052)" />
        <path
          d="M547.744,41.721a6.469,6.469,0,1,0,7.294,5.52,6.468,6.468,0,0,0-7.294-5.52"
          transform="translate(25.12 1.93)"
        />
        <path d="M563.743,8.352a6.476,6.476,0,1,0,.087-.013l-.087.013" transform="translate(25.866 0.384)" />
        <path d="M567.475,31.919l-1.5.2L564.212,19.3l1.49-.2Z" transform="translate(26.142 0.885)" />
        <path d="M579.375,35.881l-.967-1.144,4.1-3.326.957,1.145Z" transform="translate(26.8 1.456)" />
        <path d="M574.162,48.916l1.25-.825,4.151,6.181-1.26.816Z" transform="translate(26.603 2.228)" />
        <path d="M560.661,42.591l.533,1.393-7.3,2.7-.533-1.393Z" transform="translate(25.639 1.974)" />
        <path d="M569.129,29.984a10.633,10.633,0,1,0,.181-.026l-.181.026" transform="translate(25.951 1.384)" />
      </g>
      <text transform="translate(573 75)">
        <tspan x="0" y="0">
          {{ t('selfCheck.ficConnection') }}
        </tspan>
      </text>
    </g>
    <!-- VPN -->
    <g v-if="showVpnIcon" data-name="vpn-device" :fill="vpnDeviceColor" transform="translate(0,30)">
      <path
        d="M500.869,16.162a8.321,8.321,0,0,0-4.123.013,49.506,49.506,0,0,1-17.065,1.8,1.485,1.485,0,0,0-1.556,1.394c-.385,6.465-.631,31.9,18.563,39.02a6.108,6.108,0,0,0,4.247,0c19.2-7.118,18.949-32.555,18.565-39.02a1.486,1.486,0,0,0-1.556-1.394,49.833,49.833,0,0,1-17.076-1.809M507.148,31.4,497.979,41.81a2.01,2.01,0,0,1-.249.226c-.007.007-.009.016-.017.021a1.861,1.861,0,0,1-1.29.615l-.1,0a1.851,1.851,0,0,1-1.247-.481l-4.45-4.015a1.868,1.868,0,1,1,2.5-2.773l3.071,2.773,8.146-9.245a1.867,1.867,0,0,1,2.8,2.468"
        transform="translate(-20 -15)"
      />
      <text transform="translate(462 57)">
        <tspan x="5" y="0">
          {{ t('selfCheck.vpnConnection') }}
        </tspan>
      </text>
    </g>
    <!-- インターネット -->
    <g data-name="internet-device" :fill="internetDeviceColor" transform="translate(0 12)">
      <line
        v-if="!showVpnIcon && (showGuaranteeIcons || showMainIpoeIcons)"
        x1="38"
        :x2="showGuaranteeIcons || showBackup ? 0 : -35"
        transform="translate(412 46.172)"
        fill="none"
        :stroke="infoColor"
        stroke-width="2"
      />
      <path
        d="M397.207,54.731h45.61a10.857,10.857,0,0,0,10.955-10.086,10.649,10.649,0,0,0-9.741-11.15c.041-.47.063-.939.063-1.4a16.144,16.144,0,0,0-29.19-9.514.9.9,0,0,1-1.035.322,13.032,13.032,0,0,0-17.214,10.792.906.906,0,0,1-.784.823,10.146,10.146,0,0,0-9.123,10.4,10.351,10.351,0,0,0,10.459,9.814M424.543,22.1a10.551,10.551,0,0,1,13.843,8.4,1.4,1.4,0,0,1-1.386,1.6h0a1.38,1.38,0,0,1-1.372-1.161,7.759,7.759,0,0,0-10.2-6.182,1.381,1.381,0,0,1-1.661-.68,1.4,1.4,0,0,1,.782-1.971"
        :transform="`translate(${showVpnIcon ? 63 : 60} ${showVpnIcon ? 70 : 8})`"
      />
      <text :transform="`translate(${showVpnIcon ? 449 : 448} ${showVpnIcon ? 136 : 83})`">
        <tspan x="0" y="0">{{ t('selfCheck.network') }}</tspan>
      </text>
    </g>
  </svg>
</template>
