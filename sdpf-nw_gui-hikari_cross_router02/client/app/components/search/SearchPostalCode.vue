<script setup lang="ts">
import type { SizeType } from '@/components/input/types'

type PropType = {
  valid: boolean
  address: string
  placeholder: string
  required?: boolean
  disabled?: boolean
  size?: SizeType
}
const model = defineModel<string>({ required: true })

const props = withDefaults(defineProps<PropType>(), {
  required: false,
  disabled: false,
  size: 'middle',
})
type Emits = {
  (e: 'update:address', value: string): void
  (e: 'update:valid', valid: boolean): void
}
const emits = defineEmits<Emits>()
const rules = useRules()

const { postalCodeMap, loadPostalCodeMap } = usePostalCode()

const lastAutoFilledAddress = ref('')
const canAutoFill = computed(() => !props.address || props.address === lastAutoFilledAddress.value)

const handlePostalCodeInput = (value: string) => {
  model.value = value
  // 郵便番号が7桁入力されたら住所を自動入力する。ユーザーが住所を変更している場合は自動入力しない。
  if (!canAutoFill.value) {
    return
  }
  const code = value.replaceAll('-', '')
  if (code.length !== 7) {
    emits('update:address', '')
    lastAutoFilledAddress.value = ''
    return
  }
  const found = postalCodeMap.value.get(code)
  if (found) {
    const address = `${found.prefecture}${found.city}${found.additionalInfo}`
    emits('update:address', address)
    lastAutoFilledAddress.value = address
    return
  }
  emits('update:address', '')
  lastAutoFilledAddress.value = ''
}

onBeforeMount(() => loadPostalCodeMap())
</script>

<template>
  <InputForm
    :model-value="model"
    :required="required"
    :placeholder="placeholder"
    :disabled="disabled"
    :rules="[rules.postalCode]"
    maxlength="8"
    @update:model-value="handlePostalCodeInput"
    @valid="(value: boolean) => emits('update:valid', value)"
  />
</template>
