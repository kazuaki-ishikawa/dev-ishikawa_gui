<script lang="ts" setup>
import type { HelpTooltipPropType } from './types'
import { IconTypes } from '@/components/icons/constants'

const props = withDefaults(defineProps<HelpTooltipPropType>(), {
  size: 'small',
  icon: IconTypes.Help,
  color: 'info',
  contentWidth: 300,
})
</script>

<template>
  <CustomTooltip :content-width="props.contentWidth">
    <template #activator>
      <SvgIcon :type="icon" :color="color === 'white' ? undefined : color" :size="size" />
    </template>
    <template #default>
      <slot />
    </template>
  </CustomTooltip>
</template>
