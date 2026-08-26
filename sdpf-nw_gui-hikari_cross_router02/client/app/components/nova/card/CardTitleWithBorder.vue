<script setup lang="ts">
type PropType = {
  title: string
}
defineProps<PropType>()

// 呼び出し側から渡した属性は見出し要素へ明示的に引き渡す
defineOptions({ inheritAttrs: false })
</script>

<template>
  <v-card-title
    class="mx-4 mt-6 pa-0 pb-2 border-b-md border-info border-opacity-50 flex-space-between-center"
    v-bind="$attrs"
  >
    <div class="flex-flex-start-center">
      <div data-cy="card-title-with-border-title">{{ title }}</div>
      <NovaHelpTooltip v-if="$slots.help" size="18" class="mx-3">
        <slot name="help" />
      </NovaHelpTooltip>
    </div>
    <slot name="button" />
  </v-card-title>
  <v-card-item v-if="$slots.default" data-cy="card-title-with-border-description" class="text-body-medium my-2">
    <slot />
  </v-card-item>
</template>
