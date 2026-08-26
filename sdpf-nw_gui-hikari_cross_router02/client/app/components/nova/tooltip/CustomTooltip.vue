<script setup lang="ts">
type PropType = {
  location?: 'start' | 'end' | 'top' | 'bottom'
}
withDefaults(defineProps<PropType>(), {
  location: 'top',
})
const model = defineModel<boolean>()
</script>

<template>
  <v-tooltip
    v-model="model"
    :location="location"
    :close-delay="300"
    max-width="700px"
    color="white"
    stick-to-target
    interactive
    open-on-hover
    content-class="tooltip-with-arrow"
  >
    <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
      <slot :name="name" v-bind="slotData" />
    </template>
    <slot />
  </v-tooltip>
</template>

<style lang="scss" scoped>
$arrow-color: #fff;

:deep(.tooltip-with-arrow) {
  overflow: visible !important; /* 矢印がはみ出るのを防ぐ */
  box-shadow: 0 0.5rem 1rem v.$light-info-alpha-color;
  &::after {
    content: '';
    position: absolute;
    top: 100%; /* ツールチップの下部に配置 */
    left: 50%;
    margin-left: -8px; /* 矢印の幅の半分だけ左にずらす */
    border-width: 8px;
    border-style: solid;
    /* ツールチップと同じ背景色を指定 */
    border-color: $arrow-color transparent transparent transparent;
  }
}
</style>
