<script setup lang="ts">
import { useI18n } from 'vue-i18n'

type Props = {
  items: Array<{
    lineNumber: string
    planName: string
    disabled: boolean
  }>
  disabled?: boolean
  maxCount?: number
}
const props = defineProps<Props>()
const selectedLineNumberList = defineModel<string[]>('selectedLineNumberList', { required: true })

const lineNumberSearchInput = ref('')
const lineNumberSearch = ref('')
const searchedItems = computed(() =>
  props.items.filter(item => !lineNumberSearch.value || item.lineNumber.includes(lineNumberSearch.value)),
)
const selectorDisabled = computed(
  () => props.maxCount !== undefined && selectedLineNumberList.value.length >= props.maxCount,
)

const { t } = useI18n()

const headers = [
  { key: 'selector', text: '', width: 45 },
  { key: 'lineNumber', text: t('rinkLines.lineNumber'), width: 150 },
  { key: 'planName', text: t('rinkLines.plan') },
]

const selectableItems = computed(() => searchedItems.value.filter(item => !item.disabled))
const areAllVisibleRowsSelected = computed(
  () =>
    !!selectableItems.value.length &&
    selectableItems.value.every(item => selectedLineNumberList.value.includes(item.lineNumber)),
)
const indeterminate = computed(() => !areAllVisibleRowsSelected.value && selectedLineNumberList.value.length > 0)
const handleSelectAllClick = (checked: boolean) => {
  if (!checked) {
    selectedLineNumberList.value = []
  } else {
    selectedLineNumberList.value = searchedItems.value
      .filter(item => !item.disabled)
      .map(item => item.lineNumber)
      .slice(0, props.maxCount)
  }
}
const handleSelectedLineNumber = (lineNumber: string) => {
  if (selectedLineNumberList.value.includes(lineNumber)) {
    selectedLineNumberList.value = selectedLineNumberList.value.filter(num => num !== lineNumber)
  } else {
    selectedLineNumberList.value = [...selectedLineNumberList.value, lineNumber]
  }
}

const handleSearch = () => {
  lineNumberSearch.value = lineNumberSearchInput.value
  selectedLineNumberList.value = []
}
</script>

<template>
  <div>
    <InputGrid v-if="!disabled" :label="t('rinkLines.lineNumber')" :label-width="180">
      <div class="d-flex">
        <InputForm
          v-model="lineNumberSearchInput"
          size="small"
          placeholder="0000000001"
          data-cy="rink-line-table-search"
        />
        <CustomButton
          :text="t('search.button')"
          :width="100"
          class="ml-10"
          data-cy="rink-line-table-search-confirm-button"
          @click="handleSearch"
        />
      </div>
    </InputGrid>
    <StripedTable :headers="headers" :items="searchedItems">
      <template #header-selector>
        <CheckboxBase
          :value="areAllVisibleRowsSelected"
          :indeterminate="indeterminate"
          :disabled="disabled || !selectableItems.length"
          data-cy="rink-line-table-checkbox-all"
          @update:value="handleSelectAllClick"
        />
      </template>
      <template #selector="{ row }">
        <CheckboxBase
          :value="selectedLineNumberList.includes(row.lineNumber)"
          :disabled="disabled || row.disabled || (selectorDisabled && !selectedLineNumberList.includes(row.lineNumber))"
          :data-cy="`rink-line-table-checkbox-${row.lineNumber}`"
          @update:value="handleSelectedLineNumber(row.lineNumber)"
        />
      </template>
    </StripedTable>
  </div>
</template>
