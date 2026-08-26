<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import type { ServiceType, QueryType } from '@/components/monitoring/types'

type PropType = {
  serviceTypeList: ServiceType[]
  query: QueryType
}
const props = withDefaults(defineProps<PropType>(), {})
type Emits = {
  (e: 'update:query', query: QueryType): void
  (e: 'clear'): void
  (e: 'search'): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const { loading } = useLoading()

const serviceOptions = computed(() =>
  props.serviceTypeList.map(value => ({
    value,
    text: value === 'fic-connection' ? t('service.fic') : t(`service.${value}`),
  })),
)
const serviceText = computed(() => {
  const multiple = typeof props.query.service === 'object'
  if (multiple) {
    const filtered = serviceOptions.value.filter(option => props.query.service?.includes(option.value))
    return filtered.map(opt => opt.text).join(', ')
  } else {
    const found = serviceOptions.value.find(option => option.value === props.query.service)
    return found?.text ?? ''
  }
})

const handleServiceChange = (service?: ServiceType | ServiceType[]) => {
  emits('update:query', { ...props.query, service })
}
const handleKeywordChange = (keyword: string) => {
  emits('update:query', { ...props.query, keyword })
}
</script>

<template>
  <div class="text-sm">
    <div class="pb-3 d-flex flex-wrap">
      <div class="input-container-cell flex-flex-start-center">
        <NoBorderSelectForm
          :value="query.service"
          :options="serviceOptions"
          :placeholder="t('monitorings.resource')"
          size="small"
          @update:value="handleServiceChange"
        />
      </div>
      <div class="input-container-cell flex-flex-start-center">
        <slot name="input" />
      </div>
      <div class="input-container-cell flex-flex-start-center">
        <div class="pr-2">{{ t('monitorings.terminalName') }}</div>
        <SearchForm
          :value="query.keyword"
          :placeholder="t('monitorings.keyword')"
          :disabled="loading"
          @update:value="handleKeywordChange"
          @search="emits('search')"
        />
      </div>
    </div>
    <InnerCard>
      <div class="d-flex flex-wrap">
        <div class="grid-container flex-grow-1">
          <div class="service py-1">
            <span>{{ t('monitorings.resource') }}</span>
            <span class="px-1">:</span>
            <span>{{ serviceText }}</span>
          </div>
          <div class="status py-1">
            <slot name="text" />
          </div>
          <div class="keyword py-1">
            <span>{{ t('monitorings.terminalName') }}</span>
            <span class="px-1">:</span>
            <span>{{ query.keyword }}</span>
          </div>
        </div>
        <div class="align-self-end">
          <button class="clear-button" @click="emits('clear')">{{ t('monitorings.clear') }}</button>
        </div>
      </div>
    </InnerCard>
  </div>
</template>

<style lang="scss" scoped>
$secondary-color: rgb(var(--v-theme-secondary));

.input-container-cell {
  padding-top: 0.5rem;
  padding-right: 0.5rem;
  &:before {
    content: '';
    border-left: v.$split-bold-border;
    padding-right: 0.5rem;
    height: 25px;
  }
}
.grid-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  .service {
    grid-row: 1 / 2;
    grid-column: 1 / 2;
  }
  .status {
    grid-row: 1 / 2;
    grid-column: 2 / 3;
  }
  .keyword {
    grid-row: 2 / 3;
    grid-column: 1 / 3;
  }
}
.clear-button {
  font-size: 0.75rem;
  user-select: none;
  background-color: inherit;
  border-radius: 2.25rem;
  border: 1px solid $secondary-color;
  color: $secondary-color;
  padding: 0.25rem 1.5rem;
  transition: all 0.25s;
  &:hover {
    cursor: pointer;
    background-color: $secondary-color;
    color: #fff;
  }
}
</style>
