<script setup lang="ts">
import { useI18n } from 'vue-i18n'

type PropType = {
  total: number
  limitList?: number[]
}
const props = withDefaults(defineProps<PropType>(), {
  limitList: () => [10, 25, 50, 100],
})

const limit = defineModel<number>('limit')
const page = defineModel<number>('page')
const { t } = useI18n()

const limitOptions = computed(() =>
  props.limitList.map(limitNumber => ({
    text: `${limitNumber}${t('nova.pagination.unit')}`,
    value: limitNumber.toString(),
  })),
)
const handleChangeLimit = (value?: string | string[]) => {
  if (!Array.isArray(value)) {
    limit.value = value ? Number(value) : 10
  }
}
</script>

<template>
  <div class="my-5">
    <div class="position-relative flex-flex-start-center">
      <div class="align-bottom ga-4">
        <span class="font-weight-bold text-title-large">{{ total }}</span>
        <span class="px-1">{{ t('nova.pagination.unit') }}</span>
      </div>
      <template v-if="typeof limit === 'number'">
        <span class="px-3">{{ t('nova.pagination.limit') }}</span>
        <NovaCustomSelect
          required
          :model-value="`${limit}`"
          :options="limitOptions"
          width="100px"
          @update:model-value="handleChangeLimit"
        />
      </template>
      <div
        v-if="typeof limit === 'number' && typeof page === 'number'"
        class="pagination-header-navigation flex-flex-center-center"
      >
        <NovaPaginationNavigation v-model:page="page" :limit="limit" :total="total" />
      </div>
      <div class="ml-auto">
        <slot />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.pagination-header-navigation {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}
</style>
