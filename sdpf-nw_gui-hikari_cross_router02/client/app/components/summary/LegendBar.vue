<script lang="ts" setup>
type PropsType = {
  type?: string
  color: string
}
const props = defineProps<PropsType>()
</script>

<template>
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="16" viewBox="0 0 32 16">
    <path :fill="props.color" d="M 1 7 L 31 7 31 9 1 9" />
    <circle v-if="type === 'circle'" :fill="props.color" cx="16" cy="8" r="4" />
    <path v-else-if="type === 'square'" :fill="props.color" d="M 12 4 L 20 4 L 20 12 L 12 12 Z" />
    <path v-else-if="type === 'triangle'" :fill="props.color" d="M 16 3 L 21 12 L 11 12 Z" />
    <path v-else-if="type === 'diamond'" :fill="props.color" d="M 16 2.7 L 21.3 8 L 16 13.3 L 10.7 8 Z" />
  </svg>
</template>

<style scoped lang="scss">
.bg {
  background-color: v-bind('props.color');
}
.triangle {
  width: 0.67rem;
  height: calc(tan(60deg) * 0.67rem / 2);
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
}
</style>
