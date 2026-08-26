<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CircuitTypes } from '@/api/constants'
import { AccessTypes } from '@/api/trafficTrends/constants'
import type { AccessType } from '@/api/trafficTrends/types'
import { BpsTypes, GraphContentsTypes } from '@/components/trafficDetail/constants'
import type { BpsType, GraphContentsType } from '@/components/trafficDetail/types'

const contentType = defineModel<GraphContentsType>('contentType', { required: true })
const guarantee = defineModel<boolean>('guarantee', { required: true })
const ipoe = defineModel<boolean>('ipoe', { required: true })
const bps = defineModel<BpsType[]>('bps', { required: true })
const accessTypeList = defineModel<AccessType[]>('accessTypeList', { required: true })

const { t } = useI18n()
// 表示グラフ
const graphContentsTypeOptions = Object.values(GraphContentsTypes).map(value => ({
  text: t(`trafficDetails.${value}`),
  value,
}))
const handlegraphContentsTypeChange = (value: GraphContentsType) => {
  ipoe.value = value === GraphContentsTypes.Traffic
  guarantee.value = true
  contentType.value = value
}

// 表示回線
const circuitType = computed(() => {
  return [...(guarantee.value ? [CircuitTypes.Guarantee] : []), ...(ipoe.value ? [CircuitTypes.Ipoe] : [])]
})
const circuitTypeOptions = [
  {
    text: t('trafficDetails.guarantee'),
    value: CircuitTypes.Guarantee,
  },
  {
    text: t('trafficDetails.ipoe'),
    value: CircuitTypes.Ipoe,
  },
]

const bpsOptions = Object.values(BpsTypes).map(value => ({
  text: t(`trafficDetails.${value}`),
  value,
}))

const accessTypeOptions = Object.values(AccessTypes).map(value => ({ text: t(`trafficDetails.${value}`), value }))

const handleCircuitTypeCheck = (value: string[]) => {
  guarantee.value = value.includes(CircuitTypes.Guarantee)
  ipoe.value = value.includes(CircuitTypes.Ipoe)
  accessTypeList.value = value.includes(CircuitTypes.Guarantee)
    ? Object.values(AccessTypes)
    : value.includes(CircuitTypes.Ipoe)
      ? [AccessTypes.InternetVpn]
      : []
}

const handleAccessTypeCheck = (value: AccessType[]) => {
  accessTypeList.value = value
  guarantee.value = value.length > 0
}
</script>

<template>
  <div>
    <InnerCard :title="t('trafficDetails.charts')">
      <RadioForm
        :model-value="contentType"
        :options="graphContentsTypeOptions"
        class="mt-3"
        @update:model-value="handlegraphContentsTypeChange"
      />
      <div class="text-sm mt-1">
        {{ t('trafficDetails.help.utilization') }}
      </div>
    </InnerCard>
    <InnerCard :title="t('trafficDetails.circuits')">
      <SeparatedGrid class="mt-n2" :label="t('terminals.circuitType')">
        <CheckboxForm
          :value="circuitType"
          :options="circuitTypeOptions"
          col-min-width="260px"
          :disabled="contentType === GraphContentsTypes.UtilizationRate"
          @update:value="handleCircuitTypeCheck"
        />
        <div class="text-sm">
          {{ t('trafficDetails.help.mobile') }}
        </div>
      </SeparatedGrid>
      <SeparatedGrid class="mt-2" :label="t('trafficDetails.bps')">
        <CheckboxForm v-model:value="bps" :options="bpsOptions" col-min-width="260px" />
      </SeparatedGrid>
      <SeparatedGrid class="mt-2" :label="t('trafficDetails.accessType')" :help="t('trafficDetails.help.accessType')">
        <CheckboxForm
          :value="accessTypeList"
          :options="accessTypeOptions"
          col-min-width="260px"
          @update:value="handleAccessTypeCheck"
        />
        <div class="text-sm">
          {{ t('trafficDetails.help.ipoe') }}
        </div>
      </SeparatedGrid>
    </InnerCard>
  </div>
</template>
