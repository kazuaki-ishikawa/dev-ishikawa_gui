<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import {
  PortTypes,
  SituationTypes,
  EthernetTypes,
  LinkModeTypes,
  AreaTypes,
  SignalStrengthTypes,
} from '@/api/healthDiagnosis/constants'
import type {
  LanPortType,
  WanPortType,
  SituationType,
  EthernetType,
  LinkModeType,
  AreaType,
  SignalStrengthType,
} from '@/api/healthDiagnosis/types'

type PropType = {
  lanPorts?: LanPortType[]
  wanPorts?: WanPortType[]
  usingPortNames: string[]
}
const props = withDefaults(defineProps<PropType>(), {
  lanPorts: () => [] as LanPortType[],
  wanPorts: () => [] as WanPortType[],
})
const { t } = useI18n()

const SituationTypeMap = computed(() => {
  const entries = Object.entries(SituationTypes).map<[SituationType, string]>(([key, value]) => [value, key])
  return new Map(entries)
})
const EthernetTypeMap = computed(() => {
  const entries = Object.entries(EthernetTypes).map<[EthernetType, string]>(([key, value]) => [value, key])
  return new Map([...entries, [undefined, '-']])
})
const LinkModeTypeMap = computed(() => {
  const entries = Object.values(LinkModeTypes).map<[LinkModeType, string]>(value => [value, t(`selfCheck.${value}`)])
  return new Map([...entries, [undefined, '-']])
})
const AreaTypeMap = computed(() => {
  const entries = Object.values(AreaTypes).map<[AreaType, string]>(value => [value, value.toUpperCase()])
  return new Map([...entries, ['unknown', t('selfCheck.unknown')], [undefined, '-']])
})
const SignalStrengthMap = computed(() => {
  const entries = Object.values(SignalStrengthTypes).map<[SignalStrengthType, string]>(value => [
    value,
    t(`selfCheck.signalStatus.${value}`),
  ])
  return new Map([...entries, [undefined, '-']])
})

const isSwitchPort = computed(() => props.usingPortNames.length === 0)

const headers = [
  { label: 'connectionDirection', width: '100px' },
  { label: 'portType', width: '100px' },
  { label: 'portName', width: '100px' },
  { label: 'communicationStatus', width: '100px' },
  { label: 'usageStatus', width: '100px' },
  { label: 'autoNegotiation', width: '120px' },
  { label: 'ethernetType', width: '100px' },
  { label: 'linkMode', width: '100px' },
  { label: 'area', width: '100px' },
  { label: 'signalStrength', width: '100px' },
]

const lanEthernetItems = computed(() => {
  const sortedLanPorts = props.lanPorts.toSorted((a, b) => a.name.localeCompare(b.name))
  // switchPortの場合はlanPortsをソートして表示
  if (isSwitchPort.value) {
    return sortedLanPorts.map(lanPort => ({
      ...lanPort,
      isUsingPort: true,
    }))
  }
  // routedPortの場合はprops.lanPortsにあるポートのうち、usingPortNamesに含まれるポートに利用可、含まれないポートに未使用を表示
  return sortedLanPorts.map(lanPort => ({
    ...lanPort,
    isUsingPort: props.usingPortNames.includes(lanPort.name),
  }))
})

const wanEthernetItems = computed(() =>
  props.wanPorts.filter(wan => wan.type === PortTypes.Ethernet).sort((a, b) => a.name.localeCompare(b.name)),
)
const wanWirelessItems = computed(() =>
  props.wanPorts.filter(wan => wan.type === PortTypes.Wireless).sort((a, b) => a.name.localeCompare(b.name)),
)

const gridColumns = computed(() => headers.map(header => header.width).join(' '))
const rowGridColumns = computed(() =>
  headers
    .slice(2)
    .map(header => header.width)
    .join(' '),
)
const lanPortsLength = computed(() => props.lanPorts.length)
const wanPortsLength = computed(() => props.wanPorts.length)
const wanEthernetLength = computed(() => wanEthernetItems.value.length)
</script>

<template>
  <div class="interface-table-container">
    <div class="interface-table">
      <div class="header">
        <div v-for="header in headers" :key="header.label" class="cell flex-center-center">
          {{ t(`selfCheck.${header.label}`) }}
        </div>
      </div>
      <div class="body">
        <div class="lan-ports">
          <div class="connection-direction">LAN</div>
          <div class="port-type">Ethernet</div>
          <div v-for="lan in lanEthernetItems" :key="lan.name" class="row">
            <div class="port-name">{{ lan.name }}</div>
            <div class="bg-white flex-center-center">
              <StatusIndicator v-if="lan.status === 'down' && lan.isUsingPort" :status="lan.status" />
              <span v-else-if="lan.status === 'down'">Down</span>
              <span v-else>{{ lan.status.toUpperCase() }}</span>
            </div>
            <div class="bg-white flex-center-center">
              {{ lan.isUsingPort ? t('selfCheck.available') : t('selfCheck.unused') }}
            </div>
            <div class="bg-white flex-center-center">{{ lan?.autoNegotiation?.toUpperCase() ?? '-' }}</div>
            <div class="bg-white flex-center-center">{{ EthernetTypeMap.get(lan?.ethernetType) }}</div>
            <div class="bg-white flex-center-center">{{ LinkModeTypeMap.get(lan?.linkMode) }}</div>
            <div class="bg-white flex-center-center">-</div>
            <div class="bg-white flex-center-center">-</div>
          </div>
        </div>
        <div class="wan-ports">
          <div class="connection-direction">WAN</div>
          <div class="ethernet">Ethernet</div>
          <div class="wireless">Wireless</div>
          <div v-for="wan in wanEthernetItems" :key="wan.name" class="row">
            <div class="port-name">{{ wan.name }}</div>
            <div class="bg-white flex-center-center">
              <span v-if="!wan.situation || wan.status !== 'down'">
                {{ !wan.situation ? 'Down' : (wan.status?.toUpperCase() ?? '-') }}
              </span>
              <StatusIndicator v-else :status="wan.status" />
            </div>
            <div class="bg-white flex-center-center">
              {{ SituationTypeMap.get(wan.situation) ?? t('selfCheck.unused') }}
            </div>
            <div class="bg-white flex-center-center">{{ wan?.autoNegotiation?.toUpperCase() ?? '-' }}</div>
            <div class="bg-white flex-center-center">{{ EthernetTypeMap.get(wan?.ethernetType) }}</div>
            <div class="bg-white flex-center-center">{{ LinkModeTypeMap.get(wan?.linkMode) }}</div>
            <div class="bg-white flex-center-center">{{ AreaTypeMap.get(wan?.area) }}</div>
            <div class="bg-white flex-center-center">{{ SignalStrengthMap.get(wan?.signalStrength) }}</div>
          </div>
          <div v-for="wan in wanWirelessItems" :key="wan.name" class="row">
            <div class="port-name">{{ wan.name }}</div>
            <div class="bg-white flex-center-center">
              <StatusIndicator v-if="wan.status === 'down'" :status="wan.status" />
              <span v-else> {{ wan.status?.toUpperCase() ?? '-' }}</span>
            </div>
            <div class="bg-white flex-center-center">
              {{ SituationTypeMap.get(wan.situation) ?? t('selfCheck.unused') }}
            </div>
            <div class="bg-white flex-center-center">{{ wan?.autoNegotiation?.toUpperCase() ?? '-' }}</div>
            <div class="bg-white flex-center-center">{{ EthernetTypeMap.get(wan?.ethernetType) }}</div>
            <div class="bg-white flex-center-center">{{ LinkModeTypeMap.get(wan?.linkMode) }}</div>
            <div class="bg-white flex-center-center">{{ AreaTypeMap.get(wan?.area) }}</div>
            <div class="bg-white flex-center-center">{{ SignalStrengthMap.get(wan?.signalStrength) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$grid-columns: v-bind(gridColumns);
$row-grid-columns: v-bind(rowGridColumns);
$lan-row-counts: v-bind(lanPortsLength);
$wan-ethernet-row-counts: calc(v-bind(wanEthernetLength) + 1);
$wan-row-counts: v-bind(wanPortsLength);
$secondary-color: rgb(var(--v-theme-secondary));
$light-secondary-color: rgb(var(--v-theme-light-secondary));
$padding: 0.5rem;
$row-height: 45px;

.common-grid {
  display: grid;
  grid-template-columns: $grid-columns;
  gap: $padding * 0.5;
}
.connection-direction {
  background-color: $secondary-color;
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
}
.port-name {
  background-color: $light-secondary-color;
  display: flex;
  justify-content: center;
  align-items: center;
}
.row {
  grid-column: 3 / 10;
  display: grid;
  grid-template-columns: $row-grid-columns;
  gap: $padding * 0.5;
}

.interface-table-container {
  overflow-x: auto;
}
.interface-table {
  width: fit-content;
  padding-bottom: $padding * 0.5;
  font-size: 0.85rem;
}

.header {
  @extend .common-grid;
  padding-bottom: $padding;
  .cell {
    border-left: v.$split-bold-border;
    margin-left: -$padding * 0.35;
    &:first-of-type {
      border-left: none;
    }
  }
}
.body {
  border-radius: v.$child-border-radius;
  overflow: hidden;
  .lan-ports {
    @extend .common-grid;
    grid-template-rows: repeat($lan-row-counts, 1fr);
    height: calc($row-height * $lan-row-counts);
    padding-bottom: $padding * 0.5;
    .connection-direction {
      grid-row: 1 / calc($lan-row-counts + 1);
    }
    .port-type {
      @extend .port-name;
      grid-row: 1 / calc($lan-row-counts + 1);
    }
  }
  .wan-ports {
    @extend .common-grid;
    grid-template-rows: repeat($wan-row-counts, 1fr);
    height: calc($row-height * $wan-row-counts);
    .connection-direction {
      grid-row: 1 / calc($wan-row-counts + 1);
    }
    .ethernet {
      @extend .port-name;
      grid-row: 1 / $wan-ethernet-row-counts;
    }
    .wireless {
      @extend .port-name;
      grid-column: 2 / 2;
      grid-row: $wan-ethernet-row-counts / calc($wan-row-counts + 1);
    }
  }
}
</style>
