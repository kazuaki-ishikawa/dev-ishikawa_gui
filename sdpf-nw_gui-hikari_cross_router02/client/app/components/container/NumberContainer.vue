<script lang="ts" setup>
type PropType = {
  number: number
}
const props = defineProps<PropType>()
</script>

<template>
  <div class="bottom-border d-flex mt-3">
    <div class="circle-and-bar mb-3">
      <div class="circle flex-center-center text-white">
        {{ props.number }}
      </div>
      <div class="bar" />
    </div>
    <div class="mb-3 flex-grow-1">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
$circle-size: 25px;
$color: rgb(var(--v-theme-light-info));

.bottom-border {
  border-bottom: v.$split-bold-border;
}
.circle-and-bar {
  position: relative;
  width: calc($circle-size * 2);
  display: flex;
  align-items: center;
  justify-content: center;
  .circle {
    width: calc($circle-size + 0.15rem);
    height: $circle-size;
    padding-bottom: 0.15rem;
    font-size: 0.85rem;
    background-color: $color;
    border-radius: 50%;
    z-index: 5;
  }
  .bar {
    position: absolute;
    width: 2px;
    height: 100%;
    background-color: $color;
  }
}
</style>
