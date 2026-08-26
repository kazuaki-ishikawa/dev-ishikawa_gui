<script setup lang="ts">
import { nanoid } from 'nanoid'
import { useI18n } from 'vue-i18n'
import { TrafficFlowRankRankByTypes } from '@/api/trafficFlowRank/constants'
import type {
  TrafficFlowRankQuery,
  TrafficFlowRankRankByType,
  TrafficFlowRankFilterPostRequestType,
  TrafficFlowRankFilterType,
  TrafficFlowRankFlowFilterType,
  TrafficFlowRankApplicationType,
} from '@/api/trafficFlowRank/types'

type PropType = {
  applications: TrafficFlowRankApplicationType[]
  isPaidPlan: boolean
  isNoSubscription: boolean
  disabled: boolean
}
const props = defineProps<PropType>()
const trafficFlowRankQuery = defineModel<TrafficFlowRankQuery>('trafficFlowRankQuery', { required: true })
type Emits = {
  (e: 'search'): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const rules = useRules()

const { translateFilterType } = useTrafficFlowRank()
const {
  trafficFlowFilters,
  getTrafficFlowRankFilter,
  createTrafficFlowRankFilter,
  deleteTrafficFlowRankFilter,
  trafficFlowFilterLoading,
} = useTrafficFlowRankFilter()

const trafficFlowRankByOptions = computed(() =>
  Object.values(TrafficFlowRankRankByTypes)
    .filter(value => props.isPaidPlan || value === TrafficFlowRankRankByTypes.ApplicationId)
    .map(value => ({ value, text: t(`trafficFlow.${value}`) })),
)

const inputFilters = ref<Array<TrafficFlowRankFilterType & { id: string }>>([])
const valids = ref<Array<{ id: string; value: boolean }>>([])

const applicationIdOptions = computed(() =>
  props.applications
    // freePlan の場合は breakOut が true の applicationId のみ選択可能
    .filter(application => props.isPaidPlan || application.breakOut)
    .map(application => ({
      value: application.applicationId,
      text: application.applicationName,
    })),
)
const filters = computed(() =>
  inputFilters.value.reduce<Array<TrafficFlowRankFilterType & { id: string; text: string }>>((acc, cur) => {
    if (!cur.value || !valids.value.find(valid => valid.id === cur.id)?.value) {
      return acc
    }
    const translated = translateFilterType(cur.type, cur.value, props.applications)
    acc.push({ ...cur, text: `${translated.type} = ${translated.value}` })
    return acc
  }, []),
)

const filterValueRules = (type: TrafficFlowRankRankByType) => {
  switch (type) {
    case TrafficFlowRankRankByTypes.SourceIpAddress:
    case TrafficFlowRankRankByTypes.DestinationIpAddress:
      return [rules.ipAddressOrNetworkAddress]
    case TrafficFlowRankRankByTypes.Protocol:
      return [rules.number, rules.minNumber(0), rules.maxNumber(255)]
    case TrafficFlowRankRankByTypes.SourcePort:
    case TrafficFlowRankRankByTypes.DestinationPort:
      return [rules.number, rules.minNumber(0), rules.maxNumber(65535)]
    default:
      return [rules.number]
  }
}

const filterPlaceholder = (type: TrafficFlowRankRankByType) => {
  switch (type) {
    case TrafficFlowRankRankByTypes.SourceIpAddress:
    case TrafficFlowRankRankByTypes.DestinationIpAddress:
      return '192.168.1.0/24'
    case TrafficFlowRankRankByTypes.Protocol:
      return '123'
    default:
      return '12345'
  }
}

const handlePlusClick = () => {
  const id = nanoid()
  inputFilters.value = [
    ...inputFilters.value,
    {
      id,
      type: props.isPaidPlan ? TrafficFlowRankRankByTypes.SourceIpAddress : TrafficFlowRankRankByTypes.ApplicationId,
      value: '',
    },
  ]
  valids.value = [...valids.value, { id, value: false }]
}
const updateInputFiltersType = (index: number, type: string) => {
  if (inputFilters.value[index]) {
    inputFilters.value[index] = {
      id: inputFilters.value[index].id,
      type: type as TrafficFlowRankRankByType,
      value: '',
    }
  }
}
const removeFromIndex = (index: number) => {
  inputFilters.value = inputFilters.value.filter((_, idx) => index !== idx)
  valids.value = valids.value.filter((_, idx) => index !== idx)
}
const removeFromId = (id: string) => {
  inputFilters.value = inputFilters.value.filter(filter => filter.id !== id)
  valids.value = valids.value.filter(valid => valid.id !== id)
}
const handleGetTrafficFlow = () => {
  if (props.isNoSubscription) {
    // noSubscription の場合はGETを実行させない
    return
  }
  const obj = Object.values(TrafficFlowRankRankByTypes).reduce((acc, type) => {
    const list = filters.value.filter(filter => filter.type === type).map(filter => filter.value)
    return { ...acc, [type]: list.length > 0 ? list : undefined }
  }, {})
  trafficFlowRankQuery.value = { ...trafficFlowRankQuery.value, ...obj }
  emits('search')
}

const handleAutoFilterClick = () => {
  // breakOut=true のアプリケーションをすべてフィルタ欄に自動適用する。
  const newInputFilters = props.applications
    .filter(application => application.breakOut)
    .map(application => ({
      id: nanoid(),
      type: TrafficFlowRankRankByTypes.ApplicationId,
      value: application.applicationId,
    }))
  inputFilters.value = newInputFilters
  valids.value = newInputFilters.map(filter => ({ id: filter.id, value: true }))
}
const dialogType = ref<'add' | 'detail'>()
const handleDialogOpen = (type: 'add' | 'detail') => {
  if (!props.isPaidPlan) {
    // freePlan, noSubscription の場合はダイアログを開かない
    return
  }
  dialogType.value = type
}
const handleDialogClose = () => {
  dialogType.value = undefined
}
const handleFilterAddSubmit = async (request: TrafficFlowRankFilterPostRequestType) => {
  try {
    await createTrafficFlowRankFilter(request)
  } finally {
    handleDialogClose()
  }
}
const handleFilterUseClick = (data: TrafficFlowRankFlowFilterType) => {
  const newInputFilters = data.filter.map(filter => ({ id: nanoid(), type: filter.type, value: filter.value }))
  inputFilters.value = newInputFilters
  valids.value = newInputFilters.map(filter => ({ id: filter.id, value: true }))
  handleDialogClose()
}
const handleFilterRemoveClick = async (filterId: string) => {
  try {
    await deleteTrafficFlowRankFilter(filterId)
  } finally {
    handleDialogClose()
  }
}

onBeforeMount(async () => {
  await getTrafficFlowRankFilter()

  trafficFlowRankQuery.value = {
    ...trafficFlowRankQuery.value,
    rankBy: props.isPaidPlan ? trafficFlowRankQuery.value.rankBy : TrafficFlowRankRankByTypes.ApplicationId,
  }

  const newInputFilters = Object.values(TrafficFlowRankRankByTypes).reduce<
    Array<TrafficFlowRankFilterType & { id: string }>
  >((acc, type) => {
    const list = trafficFlowRankQuery.value?.[type] ?? []
    if (list.length > 0) {
      acc.push(...list.map(value => ({ id: nanoid(), type, value })))
    }
    return acc
  }, [])
  inputFilters.value = newInputFilters
  valids.value = newInputFilters.map(filter => ({ id: filter.id, value: true }))
})
</script>

<template>
  <InnerCard :title="t('trafficFlow.filterSettings')">
    <div class="py-2 flex-flex-start-center">
      <div class="min-w-200px">
        <span>{{ t('trafficFlow.rankBy') }}</span>
        <SvgIcon v-if="!isPaidPlan" class="px-2" type="lock" size="small" />
      </div>
      <SelectForm
        v-model="trafficFlowRankQuery.rankBy"
        :disabled="!isPaidPlan"
        :options="trafficFlowRankByOptions"
        :placeholder="trafficFlowRankByOptions[0]?.text"
        required
      />
    </div>
    <div class="py-2 flex-flex-start-center">
      <div class="min-w-200px">{{ t('trafficFlow.filterPattern') }}</div>
      <CustomTooltip :content-width="460">
        <template #activator>
          <CustomButton
            :text="t('trafficFlow.webConference')"
            :disabled="trafficFlowFilterLoading || isNoSubscription"
            :icon="!isNoSubscription ? 'right-arrow' : 'lock'"
            @click="handleAutoFilterClick"
          />
        </template>
        <div class="text-pre-wrap text-sm">{{ t('trafficFlow.help.webConference') }}</div>
      </CustomTooltip>
      <CustomButton
        class="ml-4"
        :text="t('trafficFlow.callFilterPattern')"
        :width="220"
        :disabled="trafficFlowFilterLoading || !isPaidPlan || trafficFlowFilters.length === 0"
        :icon="isPaidPlan ? 'right-arrow' : 'lock'"
        @click="handleDialogOpen('detail')"
      />
    </div>
    <div class="py-2 flex-flex-start-center">
      <div class="min-w-200px">
        <span>{{ t('trafficFlow.addFilter') }}</span>
        <SvgIcon v-if="!isPaidPlan" class="px-2" type="lock" size="small" />
      </div>
      <MultipleForm
        :values="inputFilters"
        :disabled="isNoSubscription"
        @click:add="handlePlusClick"
        @click:remove="removeFromIndex"
      >
        <template #child="{ data, index }">
          <div class="d-flex flex-wrap">
            <div class="flex-flex-start-center">
              <div class="min-w-120px px-3">{{ t('trafficFlow.filterType') }}</div>
              <SelectForm
                :model-value="data.type"
                :options="trafficFlowRankByOptions"
                :placeholder="trafficFlowRankByOptions[0]?.text"
                :disabled="!isPaidPlan"
                size="xSmall"
                required
                @update:model-value="(type: string) => updateInputFiltersType(index, type)"
              />
            </div>
            <div class="flex-flex-start-center">
              <div class="min-w-120px px-3">{{ t('trafficFlow.filterValue') }}</div>
              <SelectForm
                v-if="data.type === TrafficFlowRankRankByTypes.ApplicationId"
                :model-value="data.value"
                :options="applicationIdOptions"
                :placeholder="applicationIdOptions?.[0]?.text"
                size="middle"
                @valid="(valid: boolean) => (valids[index]!.value = valid)"
                @update:model-value="(value: string) => (inputFilters[index]!.value = value)"
              />
              <InputForm
                v-else
                :model-value="data.value"
                size="small"
                :rules="filterValueRules(data.type)"
                :placeholder="filterPlaceholder(data.type)"
                @valid="(valid: boolean) => (valids[index]!.value = valid)"
                @update:model-value="(value: string) => (inputFilters[index]!.value = value)"
              />
            </div>
          </div>
        </template>
      </MultipleForm>
    </div>
    <div class="py-2 flex-flex-start-center">
      <div class="min-w-200px">{{ t('trafficFlow.filter') }}</div>
      <div class="d-flex flex-wrap">
        <LabelAndCloseButton
          v-for="filter in filters"
          :key="filter.id"
          :text="filter.text"
          :value="filter.id"
          show-button
          @click="removeFromId"
        />
      </div>
    </div>

    <div class="flex-flex-end-center pt-3">
      <CustomButton
        :text="t('trafficFlow.saveButton')"
        :width="220"
        :disabled="trafficFlowFilterLoading || !isPaidPlan || filters.length === 0"
        :icon="isPaidPlan ? 'right-arrow' : 'lock'"
        @click="handleDialogOpen('add')"
      />
      <CustomButton
        class="ml-4"
        :text="t('trafficFlow.submitButton')"
        :width="150"
        :disabled="isNoSubscription || disabled"
        @click="handleGetTrafficFlow"
      />
    </div>

    <TrafficFlowFilterAddDialog
      :open="dialogType === 'add'"
      :filters="filters"
      :traffic-flow-filters="trafficFlowFilters"
      :loading="trafficFlowFilterLoading"
      @move-to-filter-list="handleDialogOpen('detail')"
      @submit="handleFilterAddSubmit"
      @close="handleDialogClose"
    />
    <TrafficFlowFilterDetailDialog
      :open="dialogType === 'detail'"
      :traffic-flow-filters="trafficFlowFilters"
      :applications="applications"
      :loading="trafficFlowFilterLoading"
      @click:use="handleFilterUseClick"
      @click:remove="handleFilterRemoveClick"
      @close="handleDialogClose"
    />
  </InnerCard>
</template>

<style scoped lang="scss">
.min-w-200px {
  min-width: 200px;
}
.min-w-120px {
  min-width: 120px;
}
</style>
