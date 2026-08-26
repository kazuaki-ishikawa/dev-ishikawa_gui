<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { initialRinkConnectionCustomLocalBreakOutInputData } from '@/api/rinkConnections/constants'

const LABEL_WIDTH = 300
type InputData = typeof initialRinkConnectionCustomLocalBreakOutInputData
type OmitIdInputData = Omit<InputData, 'id'>

type PropType = {
  required?: boolean
  maxItems?: number
  disabled?: boolean
}
const props = defineProps<PropType>()
const model = defineModel<Array<typeof initialRinkConnectionCustomLocalBreakOutInputData>>({ required: true })
type Emits = {
  (e: 'valid', valid: boolean): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const rules = useRules()

const { customLocalBreakOutNameOptions } = useRinkConnections()

const valids = ref<Array<Record<keyof OmitIdInputData, boolean> & { id: string }>>([])

const updateCustomLocalBreakOutList = (index?: number) => {
  if (index === undefined) {
    model.value = [
      ...model.value,
      {
        ...initialRinkConnectionCustomLocalBreakOutInputData,
        id: createRandomString({ prefix: 'custom-local-break-out-list-' }),
      },
    ]
  } else {
    model.value = model.value.filter((_, idx) => idx !== index)
  }
}
const handleUpdateCustomLocalBreakOutValid = (id: string, key: keyof OmitIdInputData, valid: boolean) => {
  valids.value = valids.value.map(v => (v.id === id ? { ...v, [key]: valid } : v))
}

const invalid = computed(() => valids.value.some(valid => Object.values(valid).some(v => !v)))
watch(invalid, next => emits('valid', !next))
watch(
  () => model.value.length,
  length => {
    if (length !== valids.value.length) {
      valids.value = model.value.map(({ id, nameAlias }) => {
        const found = valids.value.find(v => v.id === id)
        return found ?? { id, name: true, nameAlias: !!nameAlias, fqdnList: true, dstPrefixList: true }
      })
    }
  },
  { immediate: true },
)
onBeforeMount(() => {
  if (props.required && model.value.length === 0) {
    updateCustomLocalBreakOutList()
  }
})
onBeforeUnmount(() => {
  model.value = []
  emits('valid', true)
})
</script>

<template>
  <InputGrid :label="t('rinkConnections.customLocalBreakOutList')" :required="required">
    <MultipleForm
      :values="model"
      :disabled="disabled"
      :min-items="required ? 1 : 0"
      :max-items="maxItems"
      @click:add="updateCustomLocalBreakOutList"
      @click:remove="updateCustomLocalBreakOutList"
    >
      <template #child="{ data }">
        <InputGrid :label="t('rinkConnections.customLocalBreakOutName')" required :label-width="LABEL_WIDTH">
          <SelectForm
            v-model="data.name"
            :options="customLocalBreakOutNameOptions"
            :disabled="disabled"
            required
            :placeholder="customLocalBreakOutNameOptions[0]?.text"
            data-cy="edit-custom-local-break-out-list-name"
            @valid="(valid: boolean) => handleUpdateCustomLocalBreakOutValid(data.id, 'name', valid)"
          />
        </InputGrid>
        <InputGrid :label="t('rinkConnections.customLocalBreakOutNameAlias')" required :label-width="LABEL_WIDTH">
          <InputForm
            v-model="data.nameAlias"
            :disabled="disabled"
            required
            placeholder="example1"
            data-cy="edit-custom-local-break-out-list-name-alias"
            @valid="(valid: boolean) => handleUpdateCustomLocalBreakOutValid(data.id, 'nameAlias', valid)"
          />
        </InputGrid>
        <InputGrid :label="t('rinkConnections.customLocalBreakOutDstPrefixList')" :label-width="LABEL_WIDTH">
          <TextareaForm
            :model-value="data.dstPrefixList.join('\n')"
            :placeholder="t('breakOut.placeholder.prefixList')"
            :rules="[rules.prefixList]"
            :disabled="disabled"
            data-cy="edit-custom-local-break-out-list-dst-prefix-list"
            @update:model-value="(value: string) => (data.dstPrefixList = value.split('\n'))"
            @valid="(valid: boolean) => handleUpdateCustomLocalBreakOutValid(data.id, 'dstPrefixList', valid)"
          />
        </InputGrid>
        <InputGrid :label="t('rinkConnections.customLocalBreakFqdnList')" :label-width="LABEL_WIDTH">
          <TextareaForm
            :model-value="data.fqdnList.join('\n')"
            :placeholder="t('breakOut.placeholder.fqdnList')"
            :rules="[rules.fqdnList]"
            :disabled="disabled"
            data-cy="edit-custom-local-break-out-list-fqdn-list"
            @update:model-value="(value: string) => (data.fqdnList = value.split('\n'))"
            @valid="(valid: boolean) => handleUpdateCustomLocalBreakOutValid(data.id, 'fqdnList', valid)"
          />
        </InputGrid>
      </template>
    </MultipleForm>
  </InputGrid>
</template>
