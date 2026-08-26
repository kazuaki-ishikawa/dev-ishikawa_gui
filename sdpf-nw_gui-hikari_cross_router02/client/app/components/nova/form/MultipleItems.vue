<script lang="ts" setup generic="T extends Required<{ id: string }>">
import { useI18n } from 'vue-i18n'

type PropType = {
  values: Array<T>
  disabled?: boolean
  minItems?: number
  maxItems?: number
}
const props = withDefaults(defineProps<PropType>(), {
  disabled: false,
  minItems: 0,
})

type Emits = {
  (e: 'click:add'): void
  (e: 'click:remove', id: string): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const addDisabled = computed(() => props?.maxItems !== undefined && props.maxItems <= props.values.length)
</script>

<template>
  <div>
    <div v-for="(data, index) in values" :key="data.id" class="d-flex ga-4 mb-3">
      <div>
        <slot name="child" :data="data" :index="index">{{ data }}</slot>
      </div>
      <v-btn
        v-if="minItems <= index"
        size="small"
        variant="outlined"
        prepend-icon="mdi-minus"
        :disabled="disabled"
        border="md"
        class="bg-white font-weight-bold mt-1"
        @click.stop="emits('click:remove', data.id)"
      >
        <template #prepend>
          <v-icon class="mt-1" />
        </template>
        <span>{{ t('nova.common.remove') }}</span>
      </v-btn>
    </div>
    <div>
      <v-btn
        size="small"
        variant="outlined"
        prepend-icon="mdi-plus"
        :disabled="disabled || addDisabled"
        border="md"
        class="bg-white font-weight-bold"
        @click.stop="emits('click:add')"
      >
        <template #prepend>
          <v-icon class="mt-1" />
        </template>
        <span>{{ t('nova.common.addData') }}</span>
      </v-btn>
    </div>
  </div>
</template>
