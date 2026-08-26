<script setup lang="ts">
type PropType = {
  label: string
  disabled?: boolean
  colMinWidth?: string
}
const model = defineModel<boolean>({ required: true })
withDefaults(defineProps<PropType>(), {
  disabled: false,
  colMinWidth: '6.5rem',
})
</script>

<template>
  <CheckboxForm
    :value="[`${modelValue}`]"
    :options="[{ text: label, value: 'true' }]"
    :disabled="disabled"
    :col-min-width="colMinWidth"
    @update:value="(val: string[]) => (model = val.includes('true'))"
  />
</template>
