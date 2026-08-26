<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { NovaIconTypes } from '@/components/icons/constants'

type PropType = {
  label: string
  required?: boolean
  helpIcon?: typeof NovaIconTypes.HelpCircle | typeof NovaIconTypes.Information
  isPaidOption?: boolean
}
withDefaults(defineProps<PropType>(), {
  required: false,
  helpIcon: NovaIconTypes.HelpCircle,
  isPaidOption: false,
})

const { t } = useI18n()
</script>

<template>
  <div class="input-grid py-2">
    <div class="pr-4">
      <div v-if="isPaidOption" class="mb-1">
        <NovaDarkColorTag :label="t('nova.common.paidOption')" color="primary" />
      </div>
      <div class="flex-flex-start-center">
        <div class="font-weight-bold text-body-medium text-break">{{ label }}</div>
        <div class="ml-auto">
          <v-chip v-if="required" label size="small" class="px-2 py-0 min-w-25px" color="error">
            {{ t('nova.common.required') }}
          </v-chip>
        </div>
        <NovaHelpTooltip v-if="$slots.help" :icon="helpIcon" class="pl-2">
          <slot name="help" />
        </NovaHelpTooltip>
      </div>
    </div>
    <div class="my-auto"><slot /></div>
  </div>
</template>

<style lang="scss" scoped>
$border-color: rgb(var(--v-theme-info-lighten-3));

.min-w-25px {
  min-width: 25px;
}
.input-grid {
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: 50px;
  border-block-end: 1px solid $border-color;

  &:last-of-type {
    border-block-end: none;
  }
}
</style>
