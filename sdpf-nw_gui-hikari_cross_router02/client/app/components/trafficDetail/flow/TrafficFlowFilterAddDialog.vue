<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { MAX_ADDABLE_FILTER_NUBER, TrafficFlowRankRankByTypes } from '@/api/trafficFlowRank/constants'
import type {
  TrafficFlowRankFilterType,
  TrafficFlowRankFlowFilterType,
  TrafficFlowRankFilterPostRequestType,
} from '@/api/trafficFlowRank/types'

type PropType = {
  open: boolean
  filters: Array<TrafficFlowRankFilterType & { id: string; text: string }>
  trafficFlowFilters: TrafficFlowRankFlowFilterType[]
  loading: boolean
}
const props = defineProps<PropType>()
type Emits = {
  (e: 'moveToFilterList'): void
  (e: 'submit', request: TrafficFlowRankFilterPostRequestType): void
  (e: 'close'): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()

// 新規作成
const rules = useRules()
const customerNote = ref({ input: '', valid: false })

const unableToAdd = computed(() => props.trafficFlowFilters.length >= MAX_ADDABLE_FILTER_NUBER)
const submitButtonLabel = computed(() => (unableToAdd.value ? t('trafficFlow.moveToFilterList') : t('common.save')))
const disabled = computed(
  () =>
    // unableToAdd が true の場合はフィルタ一覧に遷移するため、ボタンを押せるようにする
    (!unableToAdd.value && !customerNote.value.valid) || props.loading,
)
// 表示データのソート
const sortedFilters = computed(() =>
  props.filters.toSorted((a, b) => {
    const aIndex = Object.values(TrafficFlowRankRankByTypes).findIndex(type => type === a.type)
    const bIndex = Object.values(TrafficFlowRankRankByTypes).findIndex(type => type === b.type)
    return aIndex - bIndex
  }),
)
const requestFilters = computed(() => props.filters.map(filter => ({ type: filter.type, value: filter.value })))
const customerNoteList = computed(() =>
  props.trafficFlowFilters.map(filter => ({ id: filter.filterId, customerNote: filter.customerNote })),
)

const handleSubmit = async () => {
  if (unableToAdd.value) {
    emits('moveToFilterList')
    return
  }
  emits('submit', {
    customerNote: customerNote.value.input,
    filter: requestFilters.value,
  })
}
watch(
  () => props.open,
  next => {
    if (!next) {
      customerNote.value = { input: '', valid: false }
    }
  },
)
</script>

<template>
  <DialogBase
    :open="open"
    :submit-width="180"
    :submit-label="submitButtonLabel"
    :cancel-label="t('common.close')"
    :disabled="disabled"
    @submit="handleSubmit"
    @close="emits('close')"
  >
    <template v-if="unableToAdd">
      <div class="pt-6 text-center text-pre-wrap">{{ t('trafficFlow.message.moveToFilterList') }}</div>
    </template>
    <template v-else>
      <div>{{ t('trafficFlow.confirm.addFilter') }}</div>
      <InputGrid required :label="t('trafficFlow.filterName')">
        <InputForm
          v-model="customerNote.input"
          required
          :placeholder="t('trafficFlow.filterName')"
          :rules="[rules.customerNote, rules.duplicateCustomerNote(customerNoteList)]"
          :maxlength="64"
          @valid="(valid: boolean) => (customerNote.valid = valid)"
        />
      </InputGrid>
      <InputGrid :label="t('trafficFlow.filterValue')">
        <LabelAndCloseButton
          v-for="filter in sortedFilters"
          :key="filter.id"
          :value="filter.id"
          :text="filter.text"
          :show-button="false"
        />
      </InputGrid>
    </template>
  </DialogBase>
</template>
