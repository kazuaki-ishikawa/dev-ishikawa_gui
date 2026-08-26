<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { IconTypes } from '@/components/icons/constants'

type PropType = {
  step: number
  only?: boolean
  clickable?: boolean
}
withDefaults(defineProps<PropType>(), {
  only: false,
  clickable: false,
})

const { t } = useI18n()
</script>

<template>
  <v-sheet
    :class="{ 'cursor-pointer': clickable }"
    class="grid-cols"
    :elevation="clickable ? 4 : 0"
    border="sm"
    color="primary"
    data-cy="step-box"
  >
    <div class="flex-center-center flex-column">
      <template v-if="only">
        <div class="text-xs">ONLY</div>
        <div class="text-4xl">{{ step }}</div>
        <div class="text-xs">STEP</div>
      </template>
      <template v-else>
        <div class="text-xs">STEP</div>
        <div class="text-4xl">{{ step }}</div>
      </template>
    </div>
    <div class="bg-grey-lighten-4 flex-center-center flex-column position-relative text-black pa-2">
      <slot class="flex-center-center" />
      <template v-if="clickable">
        <div class="click-start-button px-2 py-1 mt-4 text-white text-sm bg-primary">
          {{ t('fic.step.clickStart') }}
        </div>
        <SvgIcon
          class="position-absolute bottom-0 right-0 pa-1"
          :type="IconTypes.UpRightSquare"
          color="info"
          size="small"
        />
      </template>
    </div>
  </v-sheet>
</template>

<style lang="scss" scoped>
.grid-cols {
  display: grid;
  grid-template-columns: 60px 1fr;
}
.click-start-button {
  padding-top: 2px;
  border-radius: 1rem;
}
</style>
