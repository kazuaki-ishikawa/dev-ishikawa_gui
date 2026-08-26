<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type {
  TrafficFlowRankFilterType,
  TrafficFlowRankFlowFilterType,
  TrafficFlowRankApplicationType,
} from '@/api/trafficFlowRank/types'

type PropType = {
  open: boolean
  trafficFlowFilters: TrafficFlowRankFlowFilterType[]
  applications: TrafficFlowRankApplicationType[]
  loading: boolean
}
const props = defineProps<PropType>()
type Emits = {
  (e: 'click:use', data: TrafficFlowRankFlowFilterType): void
  (e: 'click:remove', filterId: string): void
  (e: 'close'): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const { translateFilterType } = useTrafficFlowRank()

const currentResource = ref<TrafficFlowRankFlowFilterType>()
const removeConfirmation = ref(false)

const headers = [
  { text: 'ID', key: 'filterId' },
  { text: t('trafficFlow.filterName'), key: 'customerNote' },
  { text: '', key: 'useFilterButton', width: 160 },
  { text: '', key: 'deleteFilterButton', width: 160 },
]

const getFilterValueText = (filters: TrafficFlowRankFilterType[]) => {
  const list = filters.map(filter => {
    const { type, value } = translateFilterType(filter.type, filter.value, props.applications)
    return `${type}=${value}`
  })
  return list.join('\n')
}

const handleRemoveButtonClick = (data: TrafficFlowRankFlowFilterType) => {
  currentResource.value = data
  removeConfirmation.value = true
}
const handleRemoveCancelClick = () => {
  currentResource.value = undefined
  removeConfirmation.value = false
}

const handleRemoveTrafficFlowFilter = async () => {
  if (currentResource.value) {
    emits('click:remove', currentResource.value.filterId)
  }
}

const handleClose = () => {
  if (removeConfirmation.value) {
    handleRemoveCancelClick()
  } else {
    emits('close')
  }
}

watch(
  () => props.open,
  next => {
    if (!next) {
      currentResource.value = undefined
      removeConfirmation.value = false
    }
  },
)
</script>

<template>
  <DialogBase :open="open" :width="removeConfirmation ? 900 : 1100" @close="handleClose">
    <!-- テーブル表示 -->
    <StripedTable v-if="!removeConfirmation" :headers="headers" :items="trafficFlowFilters" :key-items="['filterId']">
      <template #customerNote="{ row }">
        <CustomTooltip :content-width="500" class="text-truncate">
          <template #activator>
            <NuxtLink>{{ row.customerNote }}</NuxtLink>
          </template>
          <template #default>
            <DetailGrid :label-width="120">
              <div>{{ t('trafficFlow.filterName') }}</div>
              <div>{{ row.customerNote }}</div>
            </DetailGrid>
            <DetailGrid :label-width="120">
              <div>{{ t('trafficFlow.filterValue') }}</div>
              <div>{{ getFilterValueText(row.filter) }}</div>
            </DetailGrid>
          </template>
        </CustomTooltip>
      </template>
      <template #useFilterButton="{ row }">
        <CustomButton :text="t('common.use')" color="primary" :width="130" @click="emits('click:use', row)" />
      </template>
      <template #deleteFilterButton="{ row }">
        <CustomButton :text="t('common.delete')" color="warning" :width="130" @click="handleRemoveButtonClick(row)" />
      </template>
    </StripedTable>

    <!-- 削除確認画面 -->
    <div v-if="removeConfirmation" class="px-5">
      <div>{{ t('confirm.delete', { resource: t('trafficFlow.filter') }) }}</div>
      <DetailGrid>
        <div>ID</div>
        <div>{{ currentResource?.filterId }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('trafficFlow.filterName') }}</div>
        <div>{{ currentResource?.customerNote }}</div>
      </DetailGrid>
    </div>
    <template v-if="removeConfirmation" #footer>
      <div class="flex-center-center">
        <CustomButton
          class="mr-5"
          :text="t('common.cancel')"
          color="info"
          icon="left-arrow"
          :width="150"
          @click="handleRemoveCancelClick"
        />
        <CustomButton
          :text="t('common.delete')"
          color="warning"
          icon="right-arrow"
          :width="150"
          :disabled="loading"
          @click="handleRemoveTrafficFlowFilter"
        />
      </div>
    </template>
  </DialogBase>
</template>
