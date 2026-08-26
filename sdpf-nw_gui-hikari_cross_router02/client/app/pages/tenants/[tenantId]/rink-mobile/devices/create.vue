<script setup lang="ts">
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import {
  initialShippingInfoInputData,
  initialShippingInfoValid,
  RinkLineAvailableDateOrderTypes,
} from '@/api/rinkLines/constants'
import type { RinkDeviceLineType } from '@/api/rinkDevices/types'
import { UNSELECTED_VALUE } from '@/components/input/constants'

const RINK_DEVICE_MAX_LIMIT = 254

const { t } = useI18n()
const rules = useRules()
const { loading } = useLoading()
const { navigationGuard } = useNavigationGuard()
const { showRinkMobileMaintenanceNotification, disabledRinkMobileMaintenanceApplication } = useRinkMobileMaintenance()

const rinkMobileId = ref('')

const { rinkMobileIdOptions, getRinkConnectionList } = useGetRinkConnectionList()
const { duringReceptionHours } = useRinkConnections()
const { deviceOptions, getAvailablePlanDeviceList } = useGetAvailablePlanDeviceList()
const { disabledDates, postRinkLineAvailableDate } = usePostRinkLineAvailableDate()
const { postRinkDevices } = usePostRinkDevices()

const isConfirmation = ref(false)
const dialogOpenType = ref<'add' | number | null>(null)
const inputData = ref({ deviceNameAlias: '', count: '' })
const inputValid = ref({ deviceNameAlias: false, count: false })
const shippingInfoInputData = ref(structuredClone(initialShippingInfoInputData))
const shippingInfoValid = ref(structuredClone(initialShippingInfoValid))
const items = ref<{ deviceNameAlias: string; count: string }[]>([])
watchEffect(() => {
  navigationGuard(!isEqual(shippingInfoInputData.value, initialShippingInfoInputData) || items.value.length !== 0)
})

const headers = [
  { text: t('rinkDevices.deviceName'), key: 'deviceNameAlias', width: 400 },
  { text: t('rinkDevices.count'), key: 'count' },
]

const selectableDeviceOptions = computed(() => {
  const selected = items.value
    .map(item => item.deviceNameAlias)
    .filter(device => inputData.value.deviceNameAlias !== device)
  return deviceOptions.value.filter(
    device =>
      ![UNSELECTED_VALUE, ...selected].includes(device.value) &&
      // あんしん保証無し・キッティング無しの端末のみ購入可能
      device.value.includes('noKitting') &&
      device.value.includes('noInsurance'),
  )
})
const totalDeviceCount = computed(() => items.value.reduce((sum, item) => sum + Number(item.count), 0))
// 最大入力数に達したらmax-itemsを設定して追加不可にする
const tableMaxItems = computed(() => (totalDeviceCount.value >= RINK_DEVICE_MAX_LIMIT ? items.value.length : undefined))
const dialogSubmitDisabled = computed(
  () =>
    totalDeviceCount.value + Number(inputData.value.count) > RINK_DEVICE_MAX_LIMIT ||
    Object.values(inputValid.value).some(v => !v),
)
const submitDisabled = computed(
  () =>
    loading.value ||
    disabledRinkMobileMaintenanceApplication ||
    !duringReceptionHours.value ||
    totalDeviceCount.value === 0 ||
    Object.values(shippingInfoValid.value).some(v => !v),
)

const maxDeviceCountRule = (value: string) => {
  return (
    !value ||
    RINK_DEVICE_MAX_LIMIT >= Number(value) + totalDeviceCount.value ||
    t('invalid.maxDeviceCount', { max: RINK_DEVICE_MAX_LIMIT - totalDeviceCount.value })
  )
}
const handleDialogSubmit = () => {
  if (dialogOpenType.value === 'add') {
    items.value = items.value.concat([{ ...inputData.value }])
  } else if (typeof dialogOpenType.value === 'number') {
    items.value = items.value.map((item, index) => {
      if (index === dialogOpenType.value) {
        return { ...inputData.value }
      }
      return item
    })
  }
  handleDialogClose()
}
const handleDialogClose = () => {
  inputData.value = { deviceNameAlias: '', count: '' }
  inputValid.value = { deviceNameAlias: false, count: false }
  dialogOpenType.value = null
}
const handleAddClick = () => {
  dialogOpenType.value = 'add'
}
const handleEditClick = (index: number) => {
  dialogOpenType.value = index
  const found = items.value[index]
  if (found) {
    inputData.value = { ...found }
  }
}

const handleSubmit = async () => {
  if (!isConfirmation.value) {
    isConfirmation.value = true
    return
  }

  // request作成
  const linesList = items.value.reduce<RinkDeviceLineType[]>((list, item) => {
    const addList = [...Array(Number(item.count))].map((_, index) => ({
      lineIndex: list.length + index + 1,
      deviceNameAlias: item.deviceNameAlias,
    }))
    return list.concat(addList)
  }, [])

  const request = {
    ...shippingInfoInputData.value,
    linesList,
  }
  await postRinkDevices(rinkMobileId.value, request)

  // 成功後にデータを初期化
  isConfirmation.value = false
  shippingInfoInputData.value = structuredClone(initialShippingInfoInputData)
  shippingInfoValid.value = structuredClone(initialShippingInfoValid)
  items.value = []
}

watch(isConfirmation, () => window.scrollTo({ top: 0, behavior: 'smooth' }))
watch(
  () => items.value.length,
  () => {
    const applicationInfo = items.value.map(item => ({
      deviceNameAlias: item.deviceNameAlias,
      quantity: Number(item.count),
    }))
    postRinkLineAvailableDate({
      orderType: RinkLineAvailableDateOrderTypes.CreateLineDevices,
      applicationInfo,
    })
  },
)

watch(rinkMobileId, () => {
  if (rinkMobileId.value) {
    getAvailablePlanDeviceList(rinkMobileId.value)
  }
})
onBeforeMount(() => {
  getRinkConnectionList()
})
</script>

<template>
  <CardContainer>
    <div v-if="isConfirmation" class="mb-4">{{ t('rinkDevices.message.purchaseConfirm') }}</div>
    <div
      v-if="!duringReceptionHours"
      class="mb-2 text-warning text-pre-wrap"
      data-cy="rink-mobile-devices-create-outside-reception-hour"
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
          :disabled="loading || isConfirmation || disabledRinkMobileMaintenanceApplication"
          data-cy="rink-mobile-devices-create-rink-mobile-id"
        />
      </InputGrid>
    </InnerCard>

    <template v-if="rinkMobileId">
      <InnerCard :title="t('rinkDevices.list')">
        <EditTable
          v-model:items="items"
          :headers="headers"
          :disabled="isConfirmation"
          :max-items="tableMaxItems"
          editable
          data-cy="rink-mobile-devices-create-edit-table"
          @click:add="handleAddClick"
          @click:edit="handleEditClick"
        >
          <template #deviceNameAlias="{ row }">
            {{ deviceOptions.find(device => device.value === row.deviceNameAlias)?.text || row.deviceNameAlias }}
          </template>
        </EditTable>
        <DialogBase
          :open="dialogOpenType !== null"
          :submit-label="dialogOpenType === 'add' ? t('common.add') : t('common.save')"
          :cancel-label="t('common.cancel')"
          :disabled="dialogSubmitDisabled"
          :title="t('rinkDevices.purchaseInfo')"
          @submit="handleDialogSubmit"
          @close="handleDialogClose"
        >
          <div>
            <InputGrid required :label="t('rinkDevices.deviceName')">
              <SelectForm
                v-model="inputData.deviceNameAlias"
                :options="selectableDeviceOptions"
                :placeholder="selectableDeviceOptions[0]?.text"
                size="middle"
                required
                data-cy="rink-mobile-devices-create-device-name"
                @valid="(valid: boolean) => (inputValid.deviceNameAlias = valid)"
              />
            </InputGrid>
            <InputGrid required :label="t('rinkDevices.count')">
              <InputForm
                v-model="inputData.count"
                type="number"
                size="middle"
                required
                placeholder="10"
                :rules="[rules.number, rules.minNumber(1), maxDeviceCountRule]"
                data-cy="rink-mobile-devices-create-count"
                @valid="(valid: boolean) => (inputValid.count = valid)"
              />
            </InputGrid>
          </div>
        </DialogBase>
      </InnerCard>
      <EditShippingInformation
        v-model="shippingInfoInputData"
        v-model:valid="shippingInfoValid"
        :disabled="isConfirmation"
        :disabled-dates="disabledDates"
      />
    </template>

    <div
      v-if="showRinkMobileMaintenanceNotification"
      class="mb-4 text-warning text-pre-wrap"
      data-cy="rink-mobile-devices-create-maintenance-notification"
    >
      {{ t('rinkConnections.message.maintenanceApplicationSuspension') }}
    </div>

    <div class="flex-flex-end-center ga-4">
      <CustomButton
        v-if="isConfirmation"
        icon="left-arrow"
        :width="180"
        :text="t('common.return')"
        color="info"
        data-cy="rink-mobile-devices-create-cancel-button"
        @click="isConfirmation = false"
      />
      <CustomButton
        icon="right-arrow"
        :disabled="submitDisabled"
        :width="180"
        :text="isConfirmation ? t('rinkDevices.purchaseOrder') : t('common.confirm')"
        data-cy="rink-mobile-devices-create-submit-button"
        @click="handleSubmit"
      />
    </div>
  </CardContainer>
</template>
