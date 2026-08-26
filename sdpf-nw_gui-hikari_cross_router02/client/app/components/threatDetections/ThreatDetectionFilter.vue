<script setup lang="ts">
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import {
  ThreatLevelTypes,
  ThreatTypes,
  BlockingStatusTypes,
  BlockingStatusOptionTypes,
} from '@/api/threatDetections/constants'
import type {
  ThreatDetectionsQuery,
  TrafficDirectionType,
  BlockingStatusOptionType,
  DetectionType,
} from '@/api/threatDetections/types'
import { PeriodTypes, PeriodMinutesGapMap } from '@/components/search/constants'
import type { PeriodType } from '@/components/search/types'
import type { OptionType } from '@/components/input/types'

type PropType = {
  terminalIdOptions: OptionType<string>[]
  circuitIdOptions?: OptionType<string>[]
  filterDisabled?: boolean // 検索条件の各入力項目を操作できるかを制御する
  searchDisabled: boolean // クリア・検索ボタンを操作できるかを制御する
}

withDefaults(defineProps<PropType>(), {})
type Emits = {
  (e: 'search'): void
}
const emits = defineEmits<Emits>()

const threatDetectionsFilter = defineModel<Omit<ThreatDetectionsQuery, 'limit' | 'offset'>>('filter', {
  required: true,
})
const periodType = defineModel<PeriodType>('periodType', { required: true })

const { t } = useI18n()
const { blockingStatusOptions, threatTypeOptions, threatLevelOptions, trafficDirectionOptions, detectionTypeOptions } =
  useThreatDetections()

const validSearchPeriodDateTime = ref(true)

const selectablePeriodTypes = Object.values(PeriodTypes).filter(value => value !== PeriodTypes.Last2Weeks)
const selectableBeforeDays = computed(() => {
  // 最大12か月前まで選択可能なはず
  const before12Date = dayjs().subtract(12, 'months').format('YYYY-MM-DD')
  return Math.abs(dayjs().diff(before12Date, 'days'))
})
const displayedBlockingStatus = computed(() => {
  const statusSet = new Set<BlockingStatusOptionType>()
  threatDetectionsFilter.value.blockingStatus?.forEach(s => {
    if ([BlockingStatusTypes.UnBlockable, BlockingStatusTypes.AutoBlocked].includes(s)) {
      statusSet.add(BlockingStatusOptionTypes.NotApplicable)
    } else if (s === BlockingStatusTypes.Blocked || s === BlockingStatusTypes.NoBlocked) {
      statusSet.add(s)
    }
  })
  return [...statusSet]
})

const startDateTime = computed({
  get: () => threatDetectionsFilter.value.startTime ?? '',
  set: startDateTime => {
    threatDetectionsFilter.value.startTime = startDateTime || undefined
  },
})
const endDateTime = computed({
  get: () => threatDetectionsFilter.value.endTime ?? '',
  set: endDateTime => {
    threatDetectionsFilter.value.endTime = endDateTime || undefined
  },
})

const handleClear = () => {
  threatDetectionsFilter.value = {
    startTime: dayjs().subtract(PeriodMinutesGapMap[PeriodTypes.Last1Day], 'minutes').startOf('minutes').format(),
    endTime: dayjs().format(),
    sortKey: threatDetectionsFilter.value.sortKey,
    direction: threatDetectionsFilter.value.direction,
  }
  periodType.value = PeriodTypes.Last1Day
}

const handleThreatLevelChange = (value: string[]) => {
  const threatLevel = Object.values(ThreatLevelTypes).filter(level => value.includes(level))
  threatDetectionsFilter.value = { ...threatDetectionsFilter.value, threatLevel }
}
const handleBlockingStatusChange = (value: BlockingStatusOptionType[]) => {
  const blockingStatus = value.flatMap(status =>
    status === BlockingStatusOptionTypes.NotApplicable
      ? [BlockingStatusTypes.UnBlockable, BlockingStatusTypes.AutoBlocked]
      : [status],
  )
  threatDetectionsFilter.value = { ...threatDetectionsFilter.value, blockingStatus }
}
const handleDetectionTypeChange = (value: DetectionType[]) => {
  threatDetectionsFilter.value = { ...threatDetectionsFilter.value, detectionType: value }
}
const handleThreatTypeChange = (value: string[]) => {
  const threatType = ThreatTypes.filter(type => value.includes(type))
  threatDetectionsFilter.value = { ...threatDetectionsFilter.value, threatType }
}
const handleTrafficDirectionChange = (trafficDirection: TrafficDirectionType | '') => {
  threatDetectionsFilter.value = { ...threatDetectionsFilter.value, trafficDirection: trafficDirection || undefined }
}
</script>

<template>
  <SearchFilter
    mt-3
    :disabled="searchDisabled || !validSearchPeriodDateTime"
    @search="emits('search')"
    @clear="handleClear"
  >
    <SearchPeriodDateTime
      v-model:period-type="periodType"
      v-model:start-date-time="startDateTime"
      v-model:end-date-time="endDateTime"
      :disabled="filterDisabled"
      :selectable-before-days="selectableBeforeDays"
      :period-types="selectablePeriodTypes"
      data-cy="threat-detection-filter-search-period-date-time"
      @valid="(valid: boolean) => (validSearchPeriodDateTime = valid)"
    />
    <InputGrid :label="t('threatDetections.terminalId')">
      <MultipleSelectForm
        :model-value="threatDetectionsFilter?.terminalId ?? []"
        :options="terminalIdOptions"
        :disabled="filterDisabled"
        placeholder="Z000000001 / ルーター名1, Z000000002 / ルーター名2,..."
        data-cy="threat-detection-filter-terminal-id"
        @update:model-value="(value: string[]) => (threatDetectionsFilter.terminalId = value)"
      />
    </InputGrid>
    <InputGrid v-if="circuitIdOptions" :label="t('threatDetections.circuitId')">
      <MultipleSelectForm
        :model-value="threatDetectionsFilter?.circuitId ?? []"
        :options="circuitIdOptions"
        :disabled="filterDisabled"
        placeholder="Z000000001 / 回線名1, Z000000002 / 回線名2,..."
        data-cy="threat-detection-filter-circuit-id"
        @update:model-value="(value: string[]) => (threatDetectionsFilter.circuitId = value)"
      />
    </InputGrid>
    <InputGrid
      :label="t('threatDetections.threatLevel')"
      :help="
        t('threatDetections.help.defaultSearchCondition', {
          defaultConditions: `${threatLevelOptions[0]?.text}, ${threatLevelOptions[1]?.text}`,
        })
      "
    >
      <MultipleSelectForm
        :model-value="threatDetectionsFilter?.threatLevel ?? []"
        :options="threatLevelOptions"
        :disabled="filterDisabled"
        :placeholder="`${threatLevelOptions[0]?.text}, ${threatLevelOptions[1]?.text},...`"
        data-cy="threat-detection-filter-threat-level"
        @update:model-value="handleThreatLevelChange"
      />
    </InputGrid>
    <InputGrid :label="t('threatDetections.threatType')">
      <MultipleSelectForm
        :model-value="threatDetectionsFilter?.threatType ?? []"
        :options="threatTypeOptions"
        :disabled="filterDisabled"
        :placeholder="`${threatTypeOptions[0]?.text}, ${threatTypeOptions[1]?.text},...`"
        size="middle"
        data-cy="threat-detection-filter-threat-type"
        @update:model-value="handleThreatTypeChange"
      />
    </InputGrid>
    <InputGrid :label="t('threatDetections.detectionType')">
      <CheckboxForm
        :value="threatDetectionsFilter?.detectionType ?? []"
        :options="detectionTypeOptions"
        :disabled="filterDisabled"
        col-min-width="140px"
        data-cy="threat-detection-filter-detection-type"
        @update:value="handleDetectionTypeChange"
      />
    </InputGrid>
    <InputGrid :label="t('threatDetections.blockingStatus')">
      <CheckboxForm
        :value="displayedBlockingStatus"
        :options="blockingStatusOptions"
        :disabled="filterDisabled"
        col-min-width="140px"
        data-cy="threat-detection-filter-blocking-status"
        @update:value="handleBlockingStatusChange"
      />
    </InputGrid>
    <InputGrid
      :label="t('threatDetections.direction')"
      :help="
        t('threatDetections.help.defaultSearchCondition', {
          defaultConditions: `${trafficDirectionOptions[1]?.text}`,
        })
      "
    >
      <SelectForm
        :model-value="threatDetectionsFilter.trafficDirection ?? ''"
        :options="trafficDirectionOptions"
        :disabled="filterDisabled"
        :placeholder="t('common.unselected')"
        size="middle"
        data-cy="threat-detection-filter-traffic-direction"
        @update:model-value="handleTrafficDirectionChange"
      />
    </InputGrid>
  </SearchFilter>
</template>
