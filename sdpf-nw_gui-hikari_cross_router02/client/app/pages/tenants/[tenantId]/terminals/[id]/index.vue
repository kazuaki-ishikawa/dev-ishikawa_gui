<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { CircuitTypes } from '@/api/constants'
import { FirmwareVersionTypes, OperationTypes, OperationStatusTypes } from '@/api/terminals/constants'
import type { OperationType } from '@/api/terminals/types'
import { TenantPages, MonitoringPages } from '@/components/sidebar/constants'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenantId as string)
const terminalId = computed(() => route.params.id as string)

const operationType = ref<OperationType>()

const { loading } = useLoading()
const { formatLansToInputType, formatLanStaticRoutesToInputType } = useTerminalInput()
const { operations, isTerminalOperationBadRequest, getTerminalOperations } = useGetTerminalOperations()
const { postTerminalOperation } = usePostTerminalOperation()
const {
  getTerminal,
  terminal,
  isTerminated,
  editable,
  requiredFirmwareUpdate,
  inProgressSwitchover,
  switchoverDisabled,
} = useGetTerminal()
const { getBreakOutListOptions } = useBreakOut()
const { getBreakOutList, breakOutList } = useGetBreakOutList()
const breakOutListOptions = computed(() => getBreakOutListOptions(terminal.value?.breakOut ?? [], breakOutList.value))

const isBreakOutListUpdating = computed(() => {
  const breakOutList = terminal.value?.breakOut ?? []
  const status = operations.value.find(({ operation }) => operation === OperationTypes.BreakOutListUpdate)?.status
  return breakOutList.length === 0 || status === OperationStatusTypes.Processing
})
const lastDateBreakOutListUpdate = computed(() => {
  const requestTime = operations.value.find(
    ({ operation }) => operation === OperationTypes.BreakOutListUpdate,
  )?.requestTime
  return formatDateTime(requestTime, false)
})
const allFirmwareLatest = computed(() =>
  terminal.value?.terminalDevices?.every(device => device.firmwareVersion?.attribute === FirmwareVersionTypes.Latest),
)
const firmwareUpdateDisabled = computed(() => {
  const operationStatus = operations.value.find(({ operation }) => operation === OperationTypes.FirmwareUpdate)?.status
  const isFirmwareUpdating = operationStatus === OperationStatusTypes.Processing

  return (
    !editable.value ||
    allFirmwareLatest.value ||
    isFirmwareUpdating ||
    isTerminalOperationBadRequest.value ||
    !terminal.value?.terminalDevices
  )
})

const formattedData = computed(() => {
  const lans = formatLansToInputType(terminal.value?.lans)
  const lanStaticRoutes = formatLanStaticRoutesToInputType(terminal.value?.lanStaticRoutes)
  return { lans, lanStaticRoutes }
})

const operationDialog = computed(() => {
  switch (operationType.value) {
    case OperationTypes.Reboot:
      return { submitLabel: t('terminals.restart') }
    case OperationTypes.FirmwareUpdate:
      return { submitLabel: t('common.update') }
    case OperationTypes.BreakOutListUpdate:
      return { submitLabel: t('common.apply') }
    case OperationTypes.Switchover:
      return { submitLabel: t('terminals.switchoverButton') }
    case OperationTypes.Switchback:
      return { submitLabel: t('terminals.switchbackButton') }
    default:
      return { submitLabel: '' }
  }
})
const handleOperationSubmit = async () => {
  if (!operationType.value) {
    return
  }
  try {
    await postTerminalOperation(terminalId.value, operationType.value)
    getTerminal(terminalId.value)
    getTerminalOperations(terminalId.value)
  } finally {
    operationType.value = undefined
  }
}

const routeSwitchDisabled = computed(() => {
  const isProcessing = operations.value.some(
    ({ operation, status }) =>
      [OperationTypes.Switchback, OperationTypes.Switchover].includes(operation) &&
      [OperationStatusTypes.Processing].includes(status),
  )
  return (
    !editable.value ||
    isProcessing ||
    isTerminalOperationBadRequest.value ||
    (!inProgressSwitchover.value && switchoverDisabled.value)
  )
})
const routeSwitch = computed(() => {
  if (inProgressSwitchover.value) {
    return {
      text: t('terminals.operations.switchback'),
      operation: OperationTypes.Switchback,
      status: t('terminals.isSwitchover'),
    }
  }
  return {
    text: t('terminals.operations.switchover'),
    operation: OperationTypes.Switchover,
    status: t('terminals.isSwitchback'),
  }
})

const handleEditButtonClick = async () => {
  await navigateTo(`/tenants/${tenantId.value}/terminals/${terminalId.value}/edit`)
}
const moveToRemove = async () => {
  await navigateTo(`/tenants/${tenantId.value}/terminals/${terminalId.value}/remove`)
}
const moveToGuaranteeMaintenance = async () => {
  await navigateTo(`/tenants/${tenantId.value}/${TenantPages.Monitoring}/${MonitoringPages.GuaranteeMaintenance}`)
}

onBeforeMount(async () => {
  getTerminalOperations(terminalId.value)
  getBreakOutList()
  await getTerminal(terminalId.value)
})
</script>

<template>
  <CardContainer>
    <TerminalDetail
      :terminal="terminal"
      :tenant-id="tenantId"
      :lans="formattedData.lans"
      :lan-static-routes="formattedData.lanStaticRoutes"
      :is-terminated="isTerminated"
      :break-out-list-options="breakOutListOptions"
    />

    <!-- 迂回設定 -->
    <InnerCard
      v-if="terminal?.primaryCircuit.circuitType === CircuitTypes.Guarantee"
      :title="t('terminals.operations.switchover')"
    >
      <template #button>
        <div class="grid-flow-col ga-2">
          <CustomButton
            icon="right-arrow"
            :text="t('sideBar.guaranteeMaintenance')"
            @click="moveToGuaranteeMaintenance"
          />
          <CustomButton
            icon="right-arrow"
            :text="routeSwitch.text"
            :width="180"
            :disabled="routeSwitchDisabled"
            data-cy="terminals-id-index-route-switch-button"
            @click="operationType = routeSwitch.operation"
          />
        </div>
      </template>
      <DetailGrid>
        <div>{{ t('terminals.routeSwitchStatus') }}</div>
        <div>{{ routeSwitch.status }}</div>
      </DetailGrid>
    </InnerCard>

    <div class="flex-flex-start-center flex-wrap">
      <CustomButton
        class="mt-2 mr-6"
        icon="right-arrow"
        :disabled="!editable || isTerminalOperationBadRequest"
        :text="t('terminals.operations.reboot')"
        :width="200"
        data-cy="terminals-id-index-reboot-button"
        @click="operationType = OperationTypes.Reboot"
      />
      <div class="flex-flex-start-center mt-2 mr-6">
        <CustomButton
          icon="right-arrow"
          :disabled="firmwareUpdateDisabled"
          :text="t('terminals.operations.firmwareUpdate')"
          :width="230"
          data-cy="terminals-id-index-firmware-update-button"
          @click="operationType = OperationTypes.FirmwareUpdate"
        />
        <div v-if="allFirmwareLatest" class="text-warning ml-4">
          {{ t('terminals.firmwareVersionLatest') }}
        </div>
      </div>
      <div class="flex-flex-start-center mt-2">
        <CustomButton
          icon="right-arrow"
          :disabled="!editable || isBreakOutListUpdating || isTerminalOperationBadRequest"
          :text="t('terminals.operations.breakOutListUpdate')"
          :width="260"
          data-cy="terminals-id-index-break-out-list-update-button"
          @click="operationType = OperationTypes.BreakOutListUpdate"
        />
        <div class="text-warning ml-4">
          {{ t('terminals.lastDateBreakOutListUpdate', { date: lastDateBreakOutListUpdate }) }}
        </div>
      </div>
    </div>
    <div class="flex-flex-end-center mt-3">
      <CustomButton color="info" icon="left-arrow" :text="t('common.return')" :width="180" @click="router.back()" />
      <CustomButton
        class="ml-6"
        color="warning"
        icon="right-arrow"
        :disabled="!editable || isTerminalOperationBadRequest"
        :text="t('common.delete')"
        :width="180"
        data-cy="terminals-id-index-delete-button"
        @click="moveToRemove()"
      />
      <CustomButton
        class="ml-6"
        icon="right-arrow"
        :disabled="!editable || requiredFirmwareUpdate || isTerminalOperationBadRequest"
        :text="t('common.edit')"
        :width="180"
        data-cy="terminals-id-index-edit-button"
        @click="handleEditButtonClick"
      />
    </div>
    <div v-if="requiredFirmwareUpdate" class="flex-flex-end-center text-warning text-pre-wrap">
      {{ t('terminals.message.requiredFirmwareUpdate') }}
    </div>

    <!-- ルーター操作ダイアログ -->
    <DialogBase
      :open="!!operationType"
      :cancel-label="t('common.cancel')"
      :submit-label="operationDialog.submitLabel"
      :disabled="loading"
      @close="operationType = undefined"
      @submit="handleOperationSubmit"
    >
      <div class="grid h-100 text-center">
        <div class="align-self-center">{{ t(`terminals.confirm.operations.${operationType}`) }}</div>
        <div
          v-if="
            operationType === OperationTypes.Switchover ||
            operationType === OperationTypes.Switchback ||
            operationType === OperationTypes.FirmwareUpdate
          "
          class="text-error"
        >
          {{ t(`terminals.note.${operationType}`) }}
        </div>
      </div>
    </DialogBase>
  </CardContainer>
</template>

<style lang="scss" scoped>
.grid {
  display: grid;
}
.grid-flow-col {
  display: grid;
  grid-auto-flow: column;
}
</style>
