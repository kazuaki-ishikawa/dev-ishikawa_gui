<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { MAX_LINE_GROUP_COUNTS } from '@/api/rinkLineGroups/constants'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const { duringReceptionHours } = useRinkConnections()
const { rinkMobileIdOptions, getRinkConnectionList } = useGetRinkConnectionList()
const { rinkLineGroupList, getRinkLineGroupList } = useGetRinkLineGroupList()
const { rinkLineGroupListCurrentUsageMap, getRinkLineGroupListCurrentUsageMap } = useGetRinkLineGroupUsageMonthMap()
const { deleteRinkLineGroup } = useDeleteRinkLineGroup()

const open = ref(false)
const checkedRinkLineGroup = ref<{ lineGroupId: string; lineGroupName: string; lineCount: number }>({
  lineGroupId: '',
  lineGroupName: '',
  lineCount: 0,
})

const rinkMobileId = computed(() => (route.query.rinkMobileId as string) || '')
const createDisabled = computed(
  () => !rinkMobileId.value || rinkLineGroupList.value.length >= MAX_LINE_GROUP_COUNTS || !duringReceptionHours.value,
)

const headers = [
  { text: '', key: 'selector', width: 50 },
  { text: t('rinkLineGroups.lineGroupName'), key: 'lineGroupName' },
  { text: t('rinkLineGroups.lineCount'), key: 'lineCount', width: 200 },
  { text: t('rinkLineGroups.lineGroupLimit'), key: 'lineGroupLimit', width: 150 },
  { text: t('rinkLines.currentUsage'), key: 'currentUsage', width: 150 },
]
const items = computed(() => {
  return rinkLineGroupList.value.map(lineGroup => {
    const usageInfo = rinkLineGroupListCurrentUsageMap.value.get(lineGroup.lineGroupId)
    return {
      selector: lineGroup.lineGroupId,
      lineGroupId: lineGroup.lineGroupId,
      lineGroupName: lineGroup.lineGroupName,
      lineCount: lineGroup.lineCount,
      lineGroupLimit:
        usageInfo?.totalLineGroupLimit === undefined
          ? '-'
          : convertByteToUsageUnit(usageInfo.totalLineGroupLimit, 'GB', 'floor'),
      currentUsage: usageInfo?.usage === undefined ? '-' : convertByteToUsageUnit(usageInfo.usage, 'GB', 'ceil'),
    }
  })
})

const handleUpdateRinkMobileId = (rinkMobileId: string) => {
  checkedRinkLineGroup.value = { lineGroupId: '', lineGroupName: '', lineCount: 0 }
  router.push({ query: { rinkMobileId } })
}
const handleChecked = (lineGroupId: string, lineGroupName: string, lineCount: number) => {
  checkedRinkLineGroup.value = { lineGroupId, lineGroupName, lineCount }
}

const handleCreateLineGroup = async () => {
  await navigateTo({ path: `${route.path}/create`, query: { rinkMobileId: rinkMobileId.value } })
}
const handleAddLine = async () => {
  await navigateTo({
    path: `${route.path}/${checkedRinkLineGroup.value.lineGroupId}/add-lines`,
    query: { rinkMobileId: rinkMobileId.value },
  })
}
const handleRemoveLine = async () => {
  await navigateTo({
    path: `${route.path}/${checkedRinkLineGroup.value.lineGroupId}/remove-lines`,
    query: { rinkMobileId: rinkMobileId.value },
  })
}
const handleDeleteLineGroup = async () => {
  if (checkedRinkLineGroup.value) {
    await deleteRinkLineGroup({ lineGroupId: checkedRinkLineGroup.value.lineGroupId })
    rinkLineGroupList.value = rinkLineGroupList.value.filter(
      ({ lineGroupId }) => lineGroupId !== checkedRinkLineGroup.value?.lineGroupId,
    )
    rinkLineGroupListCurrentUsageMap.value.delete(checkedRinkLineGroup.value?.lineGroupId)
    checkedRinkLineGroup.value = { lineGroupId: '', lineGroupName: '', lineCount: 0 }
    open.value = false
  }
}

const reloadTable = async () => {
  if (rinkMobileId.value) {
    await getRinkLineGroupList(rinkMobileId.value)
    // 容量シェアグループごとのusageを取得
    getRinkLineGroupListCurrentUsageMap(rinkLineGroupList.value.map(group => group.lineGroupId))
  }
}

watch(() => rinkMobileId.value, reloadTable, { immediate: true })
onBeforeMount(async () => {
  await getRinkConnectionList()
})
</script>

<template>
  <CardContainer>
    <div
      v-if="!duringReceptionHours"
      class="mb-2 text-warning text-pre-wrap"
      data-cy="rink-mobile-line-groups-index-outside-reception-hour"
    >
      {{ t('rinkConnections.message.outsideReceptionHour') }}
    </div>
    <div class="flex-space-between-flex-end">
      <InnerCard>
        <InputGrid required :label="t('rinkConnections.rinkMobileId')" :label-width="180">
          <SelectForm
            :model-value="rinkMobileId"
            :options="rinkMobileIdOptions"
            size="small"
            required
            placeholder="Z000000001"
            data-cy="rink-mobile-line-groups-index-rink-mobile-id"
            @update:model-value="handleUpdateRinkMobileId"
          />
        </InputGrid>
      </InnerCard>
      <div class="mb-4">
        <CustomButton
          icon="right-arrow"
          :text="t('rinkLineGroups.createLineGroup')"
          :width="220"
          :disabled="createDisabled"
          class="ml-auto"
          data-cy="rink-mobile-line-groups-index-create-button"
          @click="handleCreateLineGroup"
        />
        <div
          v-if="rinkLineGroupList.length >= MAX_LINE_GROUP_COUNTS"
          class="mt-2 text-sm text-warning"
          data-cy="rink-mobile-line-groups-index-reached-limit-message"
        >
          {{ t('rinkLineGroups.message.reachedLimit') }}
        </div>
      </div>
    </div>
    <div v-if="rinkMobileId" class="mt-4" data-cy="rink-mobile-line-groups-index-rink-line-table">
      <StripedTable :headers="headers" :items="items" :key-items="['lineGroupId']">
        <template #selector="{ row }">
          <div class="radio h-100 w-100" :class="{ checked: checkedRinkLineGroup.lineGroupId === row.lineGroupId }">
            <div class="button" @click="handleChecked(row.lineGroupId, row.lineGroupName, row.lineCount)" />
          </div>
        </template>
        <template #lineCount="{ row }">
          {{ t('rinkLineGroups.count', { count: row.lineCount }) }}
        </template>
      </StripedTable>
      <div class="flex-flex-end-center mt-8">
        <CustomButton
          icon="right-arrow"
          :text="t('rinkLineGroups.addLine')"
          :width="260"
          :disabled="!checkedRinkLineGroup.lineGroupId || !duringReceptionHours"
          data-cy="rink-mobile-line-groups-index-add-line-button"
          @click="handleAddLine"
        />
        <CustomButton
          class="ml-4"
          icon="right-arrow"
          color="warning"
          :text="t('rinkLineGroups.deleteLine')"
          :width="260"
          :disabled="!checkedRinkLineGroup.lineCount || !duringReceptionHours"
          data-cy="rink-mobile-line-groups-index-remove-line-button"
          @click="handleRemoveLine"
        />
        <CustomButton
          class="ml-4"
          icon="right-arrow"
          color="warning"
          :text="t('rinkLineGroups.deleteLineGroup')"
          :width="220"
          :disabled="!checkedRinkLineGroup.lineGroupId || !duringReceptionHours"
          data-cy="rink-mobile-line-groups-index-delete-line-group-button"
          @click="() => (open = true)"
        />
      </div>
    </div>
    <DeleteConfirmationDialog
      :open="open"
      type="rinkLineGroup"
      :data="{ customerNote: checkedRinkLineGroup.lineGroupName }"
      @submit="handleDeleteLineGroup"
      @close="() => (open = false)"
    />
  </CardContainer>
</template>

<style lang="scss" scoped>
$secondary-color: rgb(var(--v-theme-secondary));
$info-color: rgb(var(--v-theme-info));
.radio {
  position: relative;

  &.checked .button {
    border: 1px solid $secondary-color;
    &::after {
      width: 12px;
      height: 12px;
    }
  }

  .button {
    cursor: pointer;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 1px solid $info-color;
    position: absolute;
    top: 10px;
    left: 5px;
    background-color: #fff;
    &::after {
      content: '';
      display: block;
      background-color: $secondary-color;
      border-radius: 50%;
      position: absolute;
      top: 0.25rem;
      left: 0.25rem;
    }
  }
}
</style>
