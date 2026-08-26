<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { AvailableLinePrefixResponse } from '@/api/rinkLines/types'
import {
  SELECTABLE_LINE_MAX_COUNTS,
  initialRinkLineListInputData,
  initialRinkLineListValid,
} from '@/api/rinkLines/constants'
import type { OptionType } from '@/components/input/types'
import type { PlanOptionsType } from '@/components/rinkLines/types'

type PropType = {
  planOptions: PlanOptionsType
  deviceOptions: Array<OptionType<string>>
  availableLinePrefix: AvailableLinePrefixResponse
  disabled?: boolean
}
withDefaults(defineProps<PropType>(), {
  disabled: false,
})
const items = defineModel<Array<typeof initialRinkLineListInputData>>({ required: true })
const { t } = useI18n()

const headers = [
  { text: 'No', key: 'lineIndex', width: 40 },
  { text: t('rinkLines.accessType'), key: 'accessType', width: 80 },
  { text: t('rinkLines.plan'), key: 'planLimitAlias', width: 200 },
  { text: t('rinkLines.deviceName'), key: 'deviceNameAlias', width: 150 },
  { text: t('rinkLines.authenticationId'), key: 'authenticationId', width: 220 },
  { text: t('rinkLines.authenticationPassword'), key: 'authenticationPassword', width: 200 },
  { text: t('rinkLines.actIpAddress'), key: 'actIpAddress', width: 150 },
  { text: t('rinkLines.sbyIpAddress'), key: 'sbyIpAddress', width: 150 },
]

const dialogOpenType = ref<'add' | number | null>(null)
const input = ref(structuredClone(initialRinkLineListInputData))
const inputValid = ref(structuredClone(initialRinkLineListValid))
const submitDisabled = computed(() => Object.values(inputValid.value).some(valid => !valid))

const handleDialogSubmit = () => {
  if (dialogOpenType.value === 'add') {
    items.value = items.value.concat([{ ...input.value }])
  } else if (typeof dialogOpenType.value === 'number') {
    items.value = items.value.map((item, index) => {
      if (index === dialogOpenType.value) {
        return { ...input.value }
      }
      return item
    })
  }
  handleDialogClose()
}
const handleDialogClose = () => {
  input.value = structuredClone(initialRinkLineListInputData)
  inputValid.value = structuredClone(initialRinkLineListValid)
  dialogOpenType.value = null
}

const handleAddClick = () => {
  dialogOpenType.value = 'add'
}
const handleEditClick = (index: number) => {
  dialogOpenType.value = index
  const found = items.value[index]
  if (found) {
    input.value = { ...found }
  }
}
</script>

<template>
  <InnerCard :title="t('rinkConnections.tabs.lines')">
    <EditTable
      v-model:items="items"
      :headers="headers"
      :disabled="disabled"
      :max-items="SELECTABLE_LINE_MAX_COUNTS"
      editable
      orderable
      data-cy="edit-line-list-edit-table"
      @click:add="handleAddClick"
      @click:edit="handleEditClick"
    >
      <template #lineIndex="{ index }">
        {{ index + 1 }}
      </template>
      <template #accessType="{ data }">
        {{ t(`rinkLines.accessTypes.${data}`) }}
      </template>
      <template #planLimitAlias="{ row }">
        {{ planOptions?.[row.accessType]?.find(plan => plan.value === row.planLimitAlias)?.text || row.planLimitAlias }}
      </template>
      <template #deviceNameAlias="{ data }">
        {{ deviceOptions.find(device => device.value === data)?.text || data }}
      </template>
    </EditTable>
    <DialogBase
      :open="dialogOpenType !== null"
      :submit-label="dialogOpenType === 'add' ? t('common.add') : t('common.save')"
      :cancel-label="t('common.cancel')"
      :disabled="submitDisabled || disabled"
      :title="t('rinkConnections.tabs.lines')"
      @submit="handleDialogSubmit"
      @close="handleDialogClose"
    >
      <div>
        <InputGrid label="No">
          <div>{{ dialogOpenType === 'add' ? items.length + 1 : Number(dialogOpenType) + 1 }}</div>
        </InputGrid>
        <EditLineInput
          v-model="input"
          v-model:valid="inputValid"
          :plan-options="planOptions"
          :device-options="deviceOptions"
          :disabled="disabled"
          :available-line-prefix="availableLinePrefix"
        />
      </div>
    </DialogBase>
  </InnerCard>
</template>
