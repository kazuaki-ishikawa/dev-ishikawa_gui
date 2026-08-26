<script lang="ts" setup>
import type { BreadCrumbsItemType } from './types'

type PropType = {
  items: BreadCrumbsItemType[]
  currentName: string
}
const props = withDefaults(defineProps<PropType>(), {})

const showCurrent = computed(() => props.items.length > 0)
</script>

<template>
  <div v-if="showCurrent" class="root-breadcrumbs">
    <div
      v-for="item in props.items"
      :key="item.path"
      class="item"
      @click="() => navigateTo({ path: item.path, query: item.query })"
    >
      {{ item.name }}
    </div>
    <div v-if="showCurrent" class="item is-active">
      {{ currentName }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
$secondary-color: rgb(var(--v-theme-secondary));
$info-color: rgb(var(--v-theme-info));
$light-secondary-color: rgb(var(--v-theme-light-secondary));
$cutting-width: 5px;
$width: calc(100% - $cutting-width);

.root-breadcrumbs {
  height: 25px;
  display: inline-flex;
  overflow: hidden;
  font-size: 0.825rem;
  border-radius: 3rem;

  .item {
    background: #fff;
    color: $info-color;
    padding: 3px 20px 0;
    position: relative;
    text-decoration: none;
    clip-path: polygon(0 0, $width 0%, 100% 50%, $width 100%, 0 100%, $cutting-width 50%);
    &.is-active {
      background: $secondary-color;
      color: #fff;
    }

    &:last-of-type {
      clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, $cutting-width 50%);
    }
    &:first-of-type {
      clip-path: polygon(0 0, $width 0%, 100% 50%, $width 100%, 0 100%);
    }

    &:hover:not(.is-active) {
      background: $light-secondary-color;
      cursor: pointer;
    }
  }
}
</style>
