<script setup lang="ts">
import { useI18n } from 'vue-i18n'

type PropType = {
  disabled: boolean
  showCheckbox?: boolean
  help?: string
}
const props = withDefaults(defineProps<PropType>(), {
  showCheckbox: true,
})
const checked = defineModel<boolean>('checked', { required: true })
const handleClick = (value: boolean) => {
  if (!props.disabled) {
    checked.value = value
  }
}
const { t } = useI18n()
</script>

<template>
  <div class="title-grid pt-3">
    <div class="flex-flex-start-center text-lg text-secondary">
      {{ t('guarantees.attendanceInformation') }}
      <HelpTooltip v-if="$slots.help || help" class="px-2 pt-1 text-base" size="smallMiddle">
        <slot v-if="$slots.help" name="help" />
        <span v-else>{{ help }}</span>
      </HelpTooltip>
    </div>
    <div v-if="showCheckbox" class="ml-2 flex-flex-start-center">
      <CheckboxBase :value="checked" :disabled="disabled" @update:value="handleClick" />
      <div
        class="ml-3"
        :class="{ 'text-info': disabled, 'cursor-pointer': !disabled }"
        @click="() => handleClick(!checked)"
      >
        {{ t('guarantees.samePreContact') }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.title-grid {
  display: grid;
  grid-template-columns: v.$label-width 1fr;
}
</style>
