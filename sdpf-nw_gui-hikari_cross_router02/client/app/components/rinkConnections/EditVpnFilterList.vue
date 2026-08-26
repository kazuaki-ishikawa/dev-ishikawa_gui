<script setup lang="ts">
// Step2 以降で使用するファイル
import { useI18n } from 'vue-i18n'
import { initialRinkConnectionVpnFilterInputData } from '@/api/rinkConnections/constants'

type PropType = {
  required?: boolean
  disabled?: boolean
}
const props = defineProps<PropType>()
const model = defineModel<Array<typeof initialRinkConnectionVpnFilterInputData>>({ required: true })
type Emits = {
  (e: 'valid', valid: boolean): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const rules = useRules()
const { vpnFilterPatternOptions } = useRinkConnections()

const valids = ref<Array<{ id: string; pattern: boolean; prefixList: boolean }>>([])

const updateVpnFilterList = (index?: number) => {
  if (index === undefined) {
    model.value = [
      ...model.value,
      {
        ...initialRinkConnectionVpnFilterInputData,
        id: createRandomString({ prefix: 'vpn-filter-list-' }),
      },
    ]
  } else {
    model.value = model.value.filter((_, idx) => idx !== index)
  }
}

const handleUpdateVpnFilterValid = (id: string, key: 'pattern' | 'prefixList', valid: boolean) => {
  valids.value = valids.value.map(v => (v.id === id ? { ...v, [key]: valid } : v))
}

const valid = computed(() => valids.value.every(v => v.pattern && v.prefixList))
watch(valid, next => emits('valid', next))
watch(
  () => model.value.length,
  length => {
    if (length !== valids.value.length) {
      valids.value = model.value.map(({ id, prefixList }) => {
        const found = valids.value.find(v => v.id === id)
        return found ?? { id, pattern: true, prefixList: !!prefixList.length }
      })
    }
  },
  { immediate: true },
)
onBeforeMount(() => {
  if (props.required && model.value.length === 0) {
    updateVpnFilterList()
  }
})
onBeforeUnmount(() => {
  model.value = []
  emits('valid', true)
})
</script>

<template>
  <InputGrid :label="t('rinkConnections.vpnFilterList')" :required="required">
    <MultipleForm
      :values="model"
      :disabled="disabled"
      :min-items="required ? 1 : 0"
      :max-items="4"
      @click:add="updateVpnFilterList"
      @click:remove="updateVpnFilterList"
    >
      <template #child="{ data }">
        <InputGrid :label="t('rinkConnections.pattern')" required>
          <RadioForm
            v-model="data.pattern"
            :options="vpnFilterPatternOptions"
            :disabled="disabled"
            data-cy="edit-vpn-filter-list-pattern"
            @valid="(valid: boolean) => handleUpdateVpnFilterValid(data.id, 'pattern', valid)"
          />
        </InputGrid>
        <InputGrid :label="t('rinkConnections.prefixList')" required>
          <TextareaForm
            :model-value="data.prefixList.join('\n')"
            :placeholder="t('breakOut.placeholder.prefixList')"
            :rules="[rules.prefixList]"
            :disabled="disabled"
            required
            data-cy="edit-vpn-filter-list-prefix-list"
            @update:model-value="(value: string) => (data.prefixList = value.split('\n'))"
            @valid="(valid: boolean) => handleUpdateVpnFilterValid(data.id, 'prefixList', valid)"
          />
        </InputGrid>
      </template>
    </MultipleForm>
  </InputGrid>
</template>
