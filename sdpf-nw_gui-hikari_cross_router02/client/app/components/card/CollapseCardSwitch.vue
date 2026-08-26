<script setup lang="ts">
type PropType = {
  title: string
  disabled?: boolean
}
defineProps<PropType>()
const model = defineModel<boolean>({ required: true })
</script>

<template>
  <div class="collapse-card-switch">
    <CollapseCard :title="title" default-open>
      <template v-if="!!$slots.help" #help>
        <slot name="help" />
      </template>
      <slot />
    </CollapseCard>
    <div class="mx-auto">
      <SwitchForm v-model="model" :disabled="disabled" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.collapse-card-switch {
  display: grid;
  grid-template-columns: 1fr 120px;
}
</style>
