<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

type PropType = {
  disabled?: boolean
}
withDefaults(defineProps<PropType>(), {
  disabled: false,
})

type Emits = {
  (e: 'search'): void
  (e: 'clear'): void
}
const emits = defineEmits<Emits>()
const { t } = useI18n()
const { loading } = useLoading()
</script>

<template>
  <InnerCard>
    <slot />
    <div class="flex-flex-end-center mt-3">
      <ClearButton
        class="mr-2"
        :text="t('search.clear')"
        :disabled="disabled"
        :width="180"
        data-cy="search-filter-clear-button"
        @click="emits('clear')"
      />
      <CustomButton
        icon="search"
        :text="t('search.button')"
        :disabled="disabled || loading"
        :width="180"
        data-cy="search-filter-search-button"
        @click="emits('search')"
      />
    </div>
  </InnerCard>
</template>
