<script setup lang="ts">
type PropType = {
  scheduleNetworkList: string[]
  disabled?: boolean
  required?: boolean
}

const props = withDefaults(defineProps<PropType>(), {
  disabled: false,
  required: false,
})

const model = defineModel<string>({ required: true })

type Emits = {
  (e: 'valid', valid: boolean): void
}
const emits = defineEmits<Emits>()

const sortedList = computed(() => props.scheduleNetworkList.toSorted())

const minDate = computed(() => sortedList.value.at(0))
const maxDate = computed(() => sortedList.value.at(-1))

const dateToEarliestTimeMap = computed(
  () =>
    new Map(
      sortedList.value
        .toReversed() // 降順にして最も早い日時が最終値になるようにする
        .map(iso => [iso.split('T')[0], iso] as const),
    ),
)

const disabledDates = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return !dateToEarliestTimeMap.value.has(`${year}-${month}-${day}`)
}

const selectedDate = computed({
  get: () => model.value.split('T')[0] ?? '',
  set: (newDate: string) => {
    model.value = dateToEarliestTimeMap.value.get(newDate) ?? ''
  },
})
</script>

<template>
  <DatePicker
    v-model="selectedDate"
    :required="required"
    :disabled="disabled"
    :disabled-dates="disabledDates"
    :min-date="minDate"
    :max-date="maxDate"
    size="small"
    @valid="(valid: boolean) => emits('valid', valid)"
  />
</template>
