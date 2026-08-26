<script setup lang="ts">
import type { ColorKeyList } from '@/components/constants'

type MenuItemType = {
  title: string
  color?: (typeof ColorKeyList)[number]
  disabled?: boolean
  click: () => void
}

type PropType = {
  items: MenuItemType[]
  buttonLabel: string
  buttonColor?: (typeof ColorKeyList)[number]
}
withDefaults(defineProps<PropType>(), {
  buttonColor: 'interactive',
})

const showMenu = ref(false)
const menuTarget = ref<Element>()
const icon = computed(() => (showMenu.value ? 'mdi-chevron-up' : 'mdi-chevron-down'))
</script>

<template>
  <NovaCustomButton ref="menuTarget" :append-icon="icon" :color="buttonColor" outlined @click="showMenu = !showMenu">
    {{ buttonLabel }}
  </NovaCustomButton>
  <v-menu v-model="showMenu" :target="menuTarget">
    <v-list class="overflow-hidden pa-0">
      <template v-for="(item, index) in items" :key="index">
        <v-list-item
          :value="index"
          :disabled="item.disabled"
          :class="item.color ? `text-${item.color}` : 'text-interactive'"
          @click="item.click"
        >
          {{ item.title }}
        </v-list-item>
        <v-divider v-if="index !== items.length - 1" />
      </template>
    </v-list>
  </v-menu>
</template>

<style lang="scss" scoped>
:deep(.v-list-item) {
  font-size: 0.85rem;
  min-height: 30px !important;
  padding: 8px 12px !important;
}
</style>
