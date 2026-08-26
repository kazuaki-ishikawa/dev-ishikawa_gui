<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { initialWanStaticRoutesInputData, initialWanStaticRoutesValid, NetworkTypes } from '@/api/terminals/constants'
import { IconTypes } from '@/components/icons/constants'

type WanStaticRoutesInputType = typeof initialWanStaticRoutesInputData

type PropType = {
  required?: boolean
  disabled?: boolean
  hasGuaranteeInternetRateLimit?: boolean
  hasVpn?: boolean
}
const props = withDefaults(defineProps<PropType>(), {
  required: false,
  disabled: false,
  hasGuaranteeInternetRateLimit: true,
  hasVpn: false,
})
const items = defineModel<WanStaticRoutesInputType[]>('values', { required: true })

type Emits = {
  (e: 'valid', valid: boolean): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const rules = useRules()
const { networkTypeOptions } = useTerminalInput()

const dialogOpenType = ref<'add' | number | null>(null)
const input = ref({ ...initialWanStaticRoutesInputData })
const inputValid = ref({ ...initialWanStaticRoutesValid })

const sortedItems = computed({
  get: () => items.value.toSorted((a, b) => cidrSort(a.destinationIpv4Prefix, b.destinationIpv4Prefix)),
  set: newValue => {
    items.value = newValue
  },
})
const nexthopNetworkOptions = computed(() => {
  return networkTypeOptions
    .filter(option => option.value !== NetworkTypes.Lan)
    .filter(option => props.hasGuaranteeInternetRateLimit || option.value !== NetworkTypes.Internet)
    .filter(option => props.hasVpn || option.value !== NetworkTypes.Vpn)
})
const nexthopNetworkLabel = Object.fromEntries(networkTypeOptions.map(option => [option.value, option.text]))
// hasGuaranteeInternetRateLimit = false かつ hasVpn = false の場合
// nexthopNetwork で選択できるものがなくなるため、EditTable を disabled にする
const editTableDisabled = computed(() => props.disabled || (!props.hasGuaranteeInternetRateLimit && !props.hasVpn))
const submitDisabled = computed(() => props.disabled || Object.values(inputValid.value).some(valid => !valid))
const valid = computed(() => !props.required || items.value.length > 0)
watch(valid, () => emits('valid', valid.value))

const handleDialogSubmit = () => {
  if (dialogOpenType.value === 'add') {
    sortedItems.value = sortedItems.value.concat([{ ...input.value }])
  } else if (typeof dialogOpenType.value === 'number') {
    sortedItems.value = sortedItems.value.map((item, index) => {
      if (index === dialogOpenType.value) {
        return { ...input.value }
      }
      return item
    })
  }
  handleDialogClose()
}
const handleDialogClose = () => {
  dialogOpenType.value = null
  input.value = { ...initialWanStaticRoutesInputData }
  inputValid.value = { ...initialWanStaticRoutesValid }
}
const handleAddClick = () => {
  dialogOpenType.value = 'add'
}
const handleEditClick = (index: number) => {
  dialogOpenType.value = index
  const found = sortedItems.value[index]
  if (found) {
    input.value = { ...found }
  }
}
</script>

<template>
  <div>
    <EditTable
      v-model:items="sortedItems"
      :headers="[
        { text: t('terminals.destinationIpv4NetworkAddress'), key: 'destinationIpv4Prefix', width: 250 },
        { text: t('terminals.wanNexthopNetwork'), key: 'nexthopNetwork' },
      ]"
      editable
      :disabled="editTableDisabled"
      :max-items="300"
      @click:add="handleAddClick"
      @click:edit="handleEditClick"
    >
      <template #nexthopNetwork="{ data }">
        {{ nexthopNetworkLabel?.[data] || data }}
      </template>
    </EditTable>
    <DialogBase
      :open="dialogOpenType !== null"
      :submit-label="dialogOpenType === 'add' ? t('common.add') : t('common.save')"
      :cancel-label="t('common.cancel')"
      :disabled="submitDisabled"
      overflow-y="visible"
      :title="t('terminals.wanStaticRoutes')"
      @submit="handleDialogSubmit"
      @close="handleDialogClose"
    >
      <div>
        <InputGrid required :label="t('terminals.destinationIpv4NetworkAddress')">
          <InputForm
            v-model="input.destinationIpv4Prefix"
            :rules="[rules.cidr, rules.denyCidrWanStaticRoute]"
            maxlength="18"
            required
            placeholder="8.8.8.8/32"
            :disabled="disabled"
            data-cy="edit-wan-static-routes-destination-ipv4-prefix"
            @valid="(valid: boolean) => (inputValid.destinationIpv4Prefix = valid)"
          />
        </InputGrid>
        <InputGrid
          required
          :label="t('terminals.wanNexthopNetwork')"
          :help-option="{
            icon: IconTypes.AlertTriangle,
            color: 'error',
            contentWidth: 665,
          }"
        >
          <template v-if="!hasGuaranteeInternetRateLimit" #help>
            <TerminalNetworkNote :connection-type="NetworkTypes.Internet" />
          </template>
          <SelectForm
            v-model="input.nexthopNetwork"
            :options="nexthopNetworkOptions"
            size="middle"
            required
            :placeholder="nexthopNetworkOptions?.[0]?.text"
            :disabled="disabled"
            data-cy="edit-wan-static-routes-nexthop-network"
            @valid="(valid: boolean) => (inputValid.nexthopNetwork = valid)"
          />
        </InputGrid>
      </div>
    </DialogBase>
  </div>
</template>
