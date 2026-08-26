<script lang="ts" setup generic="T extends string">
import type { ColorKeyList } from '@/components/constants'

type TabType = { text: string; name: T; bg: (typeof ColorKeyList)[number] }
type PropType = {
  tabs: TabType[]
  currentTabName: T
  divider?: boolean
}
const props = defineProps<PropType>()
type Emits = {
  (e: 'click', name: T): void
}
const emits = defineEmits<Emits>()

const { $vuetify } = useNuxtApp()
const colors = computed(() => $vuetify.theme.current.value.colors)

const handleClick = (value: T) => {
  if (props.currentTabName !== value) {
    emits('click', value)
  }
}
</script>

<template>
  <div class="tab-container">
    <div class="d-flex">
      <div
        v-for="tab in tabs"
        :key="tab.name"
        class="tab cursor-pointer"
        :class="{ off: tab.name !== currentTabName }"
        :style="{
          border: `solid 2px ${colors[tab.bg]}`,
          borderBottom: 'none',
          backgroundColor: colors[`light-${tab.bg}`] as string,
          color: colors[tab.bg] as string,
        }"
        @click="() => handleClick(tab.name)"
      >
        {{ tab.text }}
      </div>
    </div>
    <div v-if="!!divider" class="divider" />
    <slot />
    <slot :name="currentTabName" />
  </div>
</template>

<style lang="scss" scoped>
$light-secondary-color: rgb(var(--v-theme-light-secondary));

.tab-container {
  .divider {
    border-bottom: 2px solid $light-secondary-color;
  }
  .tab {
    padding: 0.25rem 1.85rem;
    border-radius: 0.5rem 0.5rem 0 0;
    align-self: end;
    opacity: 1;
    &.off {
      opacity: 0.5;
      &:hover {
        opacity: 0.25;
      }
    }
  }
}
</style>
