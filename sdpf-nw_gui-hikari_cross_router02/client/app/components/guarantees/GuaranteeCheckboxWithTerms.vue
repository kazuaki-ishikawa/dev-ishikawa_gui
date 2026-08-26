<script setup lang="ts">
import { useI18n } from 'vue-i18n'

type PropType = {
  disabled: boolean
  note?: string
}
defineProps<PropType>()

const model = defineModel<boolean>({ required: true })
const terms = defineModel<Array<{ text: string; checked: boolean }>>('terms')

const { t } = useI18n()
</script>

<template>
  <div class="max-w-935px">
    <CheckboxBase v-model:value="model" :disabled="disabled" data-cy="guarantee-checkbox-with-terms-checkbox-base" />
    <template v-if="model">
      <div class="mb-2 text-warning text-sm text-pre-wrap" data-cy="guarantee-checkbox-with-terms-note">
        {{ note }}
      </div>
      <div>{{ t('guarantees.terms.confirmation') }}</div>
      <template v-for="(term, index) in terms" :key="index">
        <TermsOfService class="text-pre-wrap" data-cy="guarantee-checkbox-with-terms-terms">
          {{ term.text }}
        </TermsOfService>
        <div class="flex-flex-end-center mb-4" data-cy="guarantee-checkbox-with-terms-checkbox">
          <TermOfServiceCheckbox v-model="term.checked" :disabled="disabled" :label="t('confirm.confirmed')" />
        </div>
      </template>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.max-w-935px {
  max-width: 935px;
}
</style>
