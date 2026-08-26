<script setup lang="ts">
import { useI18n } from 'vue-i18n'

type PropType = {
  availableLinePrefix: string[]
  required?: boolean
  disabled?: boolean
}
defineProps<PropType>()
const model = defineModel<string>({ required: true })
const inputValid = defineModel<boolean>('valid', { required: true })

const { t } = useI18n()
const rules = useRules()
</script>

<template>
  <div class="d-flex">
    <InputPrefixedIpForm
      v-model="model"
      :prefix="32"
      :rules="[rules.ipAddress]"
      placeholder="192.0.2.4"
      maxlength="15"
      size="xSmall"
      :required="required"
      :disabled="disabled"
      @valid="(valid: boolean) => (inputValid = valid)"
    />
    <CustomTooltip>
      <template #activator>
        <div class="tooltip bg-info text-white">
          {{ t('rinkLines.availableIpAddressTooltip') }}
        </div>
      </template>
      <template #default>
        <div v-if="availableLinePrefix.length === 0">
          {{ t('orders.none') }}
        </div>
        <div v-else class="prefix-list d-flex flex-wrap">
          <span v-for="prefix in availableLinePrefix" :key="prefix">
            {{ prefix }}
          </span>
        </div>
      </template>
    </CustomTooltip>
  </div>
</template>

<style scoped lang="scss">
.tooltip {
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  white-space: pre-line;
  width: 52px;
  height: 22px;
  padding: 4px 8px;
  border-radius: 15px;
  font-size: 10px;
  line-height: 1.2;
}
.prefix-list {
  column-gap: 0.75rem;
  row-gap: 0.25rem;
}
</style>
