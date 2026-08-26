<script setup lang="ts">
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { ScheduleNetworkOrderTypes } from '@/api/rinkConnections/constants'
import { RinkLineStatusTypes } from '@/api/rinkLines/constants'

const { t } = useI18n()
const router = useRouter()

const rinkMobileId = ref('')
const timeFrame = ref({ value: '', valid: false })

const { loading } = useLoading()
const { allRinkLineList, getAllRinkLineList } = useGetAllRinkLineList()
const { rinkConnection, getRinkConnection } = useGetRinkConnection()
const { customLocalBreakOutList, getCustomLocalBreakoutList } = useGetCustomLocalBreakoutList()
const { scheduleNetworkList, getScheduleNetworkList } = useGetScheduleNetworkList()
const { deleteRinkConnection } = useDeleteRinkConnection()
const { duringReceptionHours } = useRinkConnections()
const { rinkMobileIdOptions, getRinkConnectionList } = useGetRinkConnectionList()

const selectableScheduleNetworkList = computed(() => {
  const today = dayjs().tz()
  return scheduleNetworkList.value.filter(scheduleNetwork => dayjs(scheduleNetwork).tz().isAfter(today, 'day'))
})

const { navigationGuard } = useNavigationGuard()
watch(
  () => timeFrame.value.valid,
  next => navigationGuard(next),
)

const headers = [
  { text: 'No.', key: 'index', width: 70 },
  { text: t('rinkLines.lineNumber'), key: 'lineNumber', class: 'text-sm' },
  { text: t('rinkLines.plan'), key: 'planName', width: 200, class: 'text-sm' },
  { text: t('rinkLines.accessType'), key: 'accessType', width: 150, class: 'text-sm' },
  { text: t('rinkLines.deviceName'), key: 'deviceName', width: 180, class: 'text-sm' },
  { text: t('rinkLines.authenticationId'), key: 'authenticationId', width: 240, class: 'text-sm' },
]
const items = computed(() => {
  return allRinkLineList.value.lineList
    .filter(item => item.lineStatus !== RinkLineStatusTypes.Deleted) // 削除済みの回線はカウントしない
    .map((item, index) => ({
      ...item,
      index: index + 1,
      deviceName: item.deviceName || t('rinkLines.unselectedDevice'),
    }))
})
const deletable = computed(() => !items.value.length)

const submitDisabled = computed(
  () =>
    !duringReceptionHours.value ||
    !deletable.value ||
    !timeFrame.value.valid ||
    !!rinkConnection.value?.deletedAt ||
    loading.value,
)
const handleSubmit = async () => {
  await deleteRinkConnection(rinkMobileId.value, {
    timeFrame: timeFrame.value.value,
  })
  navigationGuard(false)
  router.back()
}

const isConfirmation = ref(false)
const switchConfirm = () => {
  isConfirmation.value = !isConfirmation.value
}
watch(isConfirmation, () => window.scrollTo({ top: 0, behavior: 'smooth' }))

watch(rinkMobileId, async () => {
  // 入力値の初期化
  timeFrame.value = { value: '', valid: false }
  // 設備・回線情報の取得
  if (rinkMobileId.value) {
    getAllRinkLineList(rinkMobileId.value)
    await getRinkConnection(rinkMobileId.value)
    if (rinkConnection.value?.customLocalBreakOutList?.length) {
      getCustomLocalBreakoutList(rinkMobileId.value)
    }
  }
})

onBeforeMount(() => {
  getRinkConnectionList()
  getScheduleNetworkList(ScheduleNetworkOrderTypes.DeleteNetworkRinkConnection)
})
</script>

<template>
  <CardContainer>
    <div v-if="isConfirmation" class="mb-4">{{ t('confirm.abolition') }}</div>
    <div
      v-if="!duringReceptionHours"
      class="mb-2 text-warning text-pre-wrap"
      data-cy="rink-mobile-connections-remove-outside-reception-hour"
    >
      {{ t('rinkConnections.message.outsideReceptionHour') }}
    </div>

    <InnerCard>
      <InputGrid required :label="t('rinkConnections.rinkMobileId')" :label-width="180">
        <SelectForm
          v-model="rinkMobileId"
          required
          :options="rinkMobileIdOptions"
          size="middle"
          placeholder="Z000000001"
          :disabled="loading || isConfirmation"
          data-cy="rink-mobile-connections-remove-rink-mobile-id"
        />
      </InputGrid>
    </InnerCard>

    <div v-if="rinkMobileId && rinkConnection" data-cy="rink-mobile-connections-remove-detail">
      <RinkConnectionDetail :rink-connection="rinkConnection" :custom-local-break-out-list="customLocalBreakOutList" />
      <InnerCard v-if="!deletable">
        <div class="mb-4 text-pre-wrap text-warning" data-cy="rink-mobile-connections-remove-line-remove-confirm">
          {{ t('rinkConnections.message.lineRemoveConfirm', { count: items.length }) }}
        </div>
        <StripedTable :headers="headers" :items="items" :key-items="['lineNumber']">
          <template #accessType="{ data }">
            {{ t(`rinkLines.accessTypes.${data}`) }}
          </template>
        </StripedTable>
      </InnerCard>

      <InnerCard v-if="deletable" :title="t('rinkLines.removeRequestedDate')" class="mt-5">
        <InputGrid required :label="t('rinkLines.removeRequestedDate')">
          <EditScheduleNetworkDatePicker
            v-model="timeFrame.value"
            :schedule-network-list="selectableScheduleNetworkList"
            :disabled="isConfirmation"
            required
            data-cy="rink-mobile-connections-remove-time-frame"
            @valid="valid => (timeFrame.valid = valid)"
          />
        </InputGrid>
      </InnerCard>
    </div>

    <div class="flex-flex-end-center pt-2">
      <CancelButton
        v-model:is-confirmation="isConfirmation"
        @cancel="isConfirmation ? switchConfirm() : router.back()"
      />
      <CustomButton
        class="ml-6"
        icon="right-arrow"
        :color="isConfirmation ? 'warning' : 'primary'"
        :text="isConfirmation ? t('common.abolition') : t('common.confirm')"
        :width="180"
        :disabled="submitDisabled"
        data-cy="rink-mobile-connections-remove-submit-button"
        @click="isConfirmation ? handleSubmit() : switchConfirm()"
      />
    </div>
  </CardContainer>
</template>
