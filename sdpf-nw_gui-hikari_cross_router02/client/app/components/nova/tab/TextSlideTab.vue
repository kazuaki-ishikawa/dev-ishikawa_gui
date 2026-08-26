<script setup lang="ts" generic="T extends string">
type TabType = {
  title: string
  value: T
  disabled?: boolean
  dataCy?: string
}
type PropType = {
  tabs: TabType[]
  dataCy?: string
}

defineProps<PropType>()
const model = defineModel<T>({ required: true })
</script>

<template>
  <div :data-cy="dataCy">
    <v-tabs v-model="model">
      <v-tab
        v-for="tab in tabs"
        :key="tab.value"
        :value="tab.value"
        :disabled="tab.disabled"
        :data-cy="tab.dataCy"
        slider-color="info"
        class="text-title-medium font-weight-bold"
      >
        {{ tab.title }}
      </v-tab>
    </v-tabs>
    <v-tabs-window v-model="model">
      <v-tabs-window-item v-for="tab in tabs" :key="tab.value" :value="tab.value">
        <slot :name="tab.value" />
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>
