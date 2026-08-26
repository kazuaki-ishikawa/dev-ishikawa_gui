<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { OptionType } from '@/components/input/types'

type PropType = {
  rinkMobileIdOptions: OptionType<string>[]
  disabled?: boolean
}
const props = withDefaults(defineProps<PropType>(), {
  disabled: false,
})
type Emits = {
  (e: 'search'): void
}
const emits = defineEmits<Emits>()

const model = defineModel<{ rinkMobileId: string; lineNumber: string }>({ required: true })

const { t } = useI18n()
const searchDisabled = computed(() => props.disabled || (!model.value.rinkMobileId && !model.value.lineNumber))
const handleClear = () => {
  model.value = { rinkMobileId: '', lineNumber: '' }
}
</script>

<template>
  <SearchFilter
    :title="t('rinkLines.search.title')"
    :disabled="searchDisabled"
    @search="emits('search')"
    @clear="handleClear"
  >
    <InputGrid :label="t('rinkConnections.rinkMobileId')" :label-width="180">
      <SelectForm
        v-model="model.rinkMobileId"
        :options="rinkMobileIdOptions"
        size="middle"
        placeholder="Z000000001"
        :disabled="disabled"
        data-cy="rink-line-search-filter-rink-mobile-id"
      />
    </InputGrid>
    <InputGrid :label="t('rinkLines.lineNumber')" :label-width="180">
      <InputForm
        v-model="model.lineNumber"
        size="middle"
        placeholder="0000000001"
        :disabled="disabled"
        data-cy="rink-line-search-filter-line-number"
      />
    </InputGrid>
    <div class="text-right text-sm mt-3">{{ t('rinkLines.search.note') }}</div>
  </SearchFilter>
</template>
