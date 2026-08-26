<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

type PropType = {
  page?: number
  total?: number
  limitList?: number[]
  selected?: { counts: number; max: number }
}
const props = withDefaults(defineProps<PropType>(), {
  page: 1,
  total: 0,
  limitList: () => [10, 25, 50, 100],
  selected: undefined,
})
const limit = defineModel<number>('limit', { default: 10 })
const { t } = useI18n()
const { loading } = useLoading()

const counts = computed(() => {
  const from = props.total > 0 ? limit.value * (props.page - 1) + 1 : 0
  const to = Math.min(from + limit.value - 1, props.total)
  return { from: `${from}`, to: `${to}`, total: `${props.total}` }
})

const limitOptions = computed(() =>
  props.limitList.map(limitNumber => ({
    text: t('pagination.unit', { number: limitNumber.toString() }),
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
  <div>
    <div v-show="!loading" class="border-bottom flex-flex-start-center pb-5">
      <div v-if="!selected" class="flex-grow-1">{{ t('pagination.counts', { ...counts }) }}</div>
      <template v-else>
        <div class="flex-grow-1">{{ t('pagination.select', { select: selected.counts, total }) }}</div>
        <div class="flex-grow-1">{{ t('pagination.selectMax', { max: selected.max }) }}</div>
      </template>
      <div>{{ t('pagination.limit') }}</div>
      <NoBorderSelectForm
        required
        :value="`${limit}`"
        :options="limitOptions"
        size="xxSmall"
        @update:value="handleChangeLimit"
      />
    </div>
    <div v-show="loading" class="border-bottom pb-5">
      <div class="text-center font-weight-bold text-xl">{{ t('pagination.dataLoading') }}</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.border-bottom {
  border-bottom: 2px solid rgb(var(--v-theme-light-secondary));
}
</style>
