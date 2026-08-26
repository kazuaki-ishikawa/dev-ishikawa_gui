<script setup lang="ts">
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import { IconTypes } from '@/components/icons/constants'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const { getAllResourceSummaryGuaranteeList, resourceSummaryGuaranteeListOptions } =
  useGetAllResourceSummaryGuaranteeList()
const { maintenances, getGuaranteeMaintenance } = useGuaranteeMaintenance()

const query = ref<{ guaranteeId?: string }>({ guaranteeId: undefined })

const tableHeaders = [
  { text: t('guaranteeMaintenance.maintenanceId'), key: 'maintenanceId' },
  { text: t('guaranteeMaintenance.startTime'), key: 'startTime', width: 200 },
  { text: t('guaranteeMaintenance.endTime'), key: 'endTime', width: 200 },
  { text: t('guaranteeMaintenance.circuits'), key: 'circuits', width: 200 },
]
const tableItems = computed(() =>
  maintenances.value.map(data => ({
    maintenanceId: data.maintenanceId,
    startTime: formatDateTime(data.startTime, false),
    endTime: formatDateTime(data.endTime, false),
  })),
)

const handleMoveDetail = async (maintenanceId: string) => {
  if (maintenanceId) {
    await navigateTo(`${route.path}/${maintenanceId}`)
  }
}
const updateQueryGuaranteeId = (value: string) => {
  query.value = { guaranteeId: value || undefined }
}

const handleSearch = () => {
  if (isEqual(routeQuery.value, query.value)) {
    // パスクエリの変更がない場合は直接 getGuaranteeMaintenance を実行する
    getGuaranteeMaintenance(query.value)
  } else {
    router.push({ query: query.value })
  }
}
const routeQuery = computed(() =>
  ['guaranteeId'].reduce((q, key) => {
    const value = route.query[key]
    return Object.assign(q, { [key]: value })
  }, {}),
)

watch(
  () => route.query,
  () => {
    query.value = routeQuery.value
    getGuaranteeMaintenance(routeQuery.value)
  },
  { immediate: true },
)
onBeforeMount(() => {
  getAllResourceSummaryGuaranteeList()
})
</script>

<template>
  <CardContainer>
    <div class="mb-3 flex-flex-start-center">
      <SvgIcon class="pt-1" :type="IconTypes.Monitoring" color="secondary" />
      <div class="flex-grow-1 ml-2 text-lg">{{ t('guaranteeMaintenance.information') }}</div>
    </div>

    <div class="flex-space-between-flex-end flex-wrap">
      <SearchFilter @search="handleSearch" @clear="updateQueryGuaranteeId('')">
        <InputGrid :label="t('guarantees.guaranteeId')" :label-width="210">
          <SelectForm
            :model-value="query?.guaranteeId ?? ''"
            :options="resourceSummaryGuaranteeListOptions"
            :placeholder="resourceSummaryGuaranteeListOptions?.[0]?.text"
            size="middle"
            @update:model-value="updateQueryGuaranteeId"
          />
        </InputGrid>
      </SearchFilter>
    </div>

    <StripedTable :headers="tableHeaders" :items="tableItems" :key-items="['maintenanceId']">
      <template #circuits="{ row }">
        <CustomButton
          icon="right-arrow"
          :text="t('guaranteeMaintenance.moveToDetail')"
          :width="180"
          :disabled="!row.maintenanceId"
          @click="handleMoveDetail(row.maintenanceId)"
        />
      </template>
    </StripedTable>
  </CardContainer>
</template>
