<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  ScheduleNetworkOrderTypes,
  initialRinkConnectionInputData,
  initialRinkConnectionValid,
} from '@/api/rinkConnections/constants'
import { TenantPages, RinkMobilePages } from '@/components/sidebar/constants'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const { loading } = useLoading()
const { unterminatedVpnListOptions, getSummaryVpnList } = useGetSummaryVpnList()
const { createRinkConnection } = useCreateRinkConnection()
const { rinkMobileOrderDates, getOrder } = useGetOrder()
const { scheduleNetworkList, getScheduleNetworkList } = useGetScheduleNetworkList()
const { lineActPrefixOptions, lineSbyPrefixOptions, getAvailableLinePrefix } = useGetAvailableLinePrefix()
const { getRinkConnectionPostRequest, duringReceptionHours } = useRinkConnections()

const rinkMobileId = ref('')
const openDialog = ref(false)
const isConfirmation = ref(false)
const inputData = ref({ ...initialRinkConnectionInputData })
const inputValid = ref({ ...initialRinkConnectionValid })

const { navigationGuard } = useNavigationGuard()
const changed = computed(() => !!inputData.value.connectionType)
watch(changed, () => navigationGuard(changed.value))

const submitDisabled = computed(() => {
  return Object.values(inputValid.value).some(valid => !valid) || !duringReceptionHours.value || loading.value
})

const switchConfirm = () => {
  isConfirmation.value = !isConfirmation.value
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
const handleSubmit = async () => {
  try {
    const request = getRinkConnectionPostRequest(inputData.value)
    const response = await createRinkConnection(request)
    await getOrder(response.id)
    openDialog.value = true
    rinkMobileId.value = response.zId
    navigationGuard(false)
  } catch {
    // 特に何もしない
  }
}

const moveToCreateLine = () => {
  return navigateTo({
    path: `/tenants/${route.params.tenantId}/${TenantPages.RinkMobile}/${RinkMobilePages.Lines}/create`,
    query: { rinkMobileId: rinkMobileId.value },
    replace: true,
  })
}

onBeforeMount(() => {
  getSummaryVpnList()
  getAvailableLinePrefix()
  getScheduleNetworkList(ScheduleNetworkOrderTypes.CreateNetworkRinkConnection)
})
</script>

<template>
  <CardContainer>
    <div v-if="isConfirmation" class="mb-4">{{ t('confirm.create') }}</div>
    <div
      v-if="!duringReceptionHours"
      class="mb-4 text-warning text-pre-wrap"
      data-cy="rink-mobile-connections-create-outside-reception-hour"
    >
      {{ t('rinkConnections.message.outsideReceptionHour') }}
    </div>

    <EditRinkConnection
      v-model="inputData"
      v-model:valid="inputValid"
      :disabled="isConfirmation"
      :vpn-options="unterminatedVpnListOptions"
      :line-act-prefix-options="lineActPrefixOptions"
      :line-sby-prefix-options="lineSbyPrefixOptions"
      :schedule-network-list="scheduleNetworkList"
    />

    <div class="flex-flex-end-center ga-6">
      <CancelButton
        v-model:is-confirmation="isConfirmation"
        data-cy="rink-mobile-connections-create-cancel-button"
        @cancel="isConfirmation ? switchConfirm() : router.back()"
      />
      <CustomButton
        icon="right-arrow"
        :width="180"
        :text="isConfirmation ? t('common.create') : t('common.confirm')"
        :disabled="submitDisabled"
        data-cy="rink-mobile-connections-create-submit-button"
        @click="isConfirmation ? handleSubmit() : switchConfirm()"
      />
    </div>

    <DialogBase
      :open="openDialog"
      :submit-label="t('rinkConnections.moveToCreateLine')"
      :submit-width="200"
      :disabled="!rinkMobileId"
      :cancel-label="t('common.close')"
      @close="router.back()"
      @submit="moveToCreateLine"
    >
      <div class="text-center">
        <div data-cy="rink-mobile-connections-create-dialog-message">{{ t('message.created') }}</div>
        <div class="font-weight-bold" data-cy="rink-mobile-connections-create-dialog-reserved-construction-date">
          {{ t('rinkConnections.reservedConstructionDate') }}: {{ rinkMobileOrderDates.reservedConstructionDate }}
        </div>
        <div class="font-weight-bold" data-cy="rink-mobile-connections-create-dialog-cancellation-deadline">
          {{ t('rinkConnections.cancellationDeadline') }}:
          {{ rinkMobileOrderDates.cancellationDeadline }}
        </div>
      </div>
    </DialogBase>
  </CardContainer>
</template>
