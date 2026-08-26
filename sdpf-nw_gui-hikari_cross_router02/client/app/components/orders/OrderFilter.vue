<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import type { OrderStatusType } from '@/api/types'
import { OrderResourceTypes } from '@/api/orders/constants'
import type { OrderRequestType, OrderQueryType } from '@/api/orders/types'

type PropType = {
  query: OrderQueryType
}
defineProps<PropType>()

type Emits = {
  (e: 'update:query', query: OrderQueryType): void
  (e: 'search'): void
}
const emits = defineEmits<Emits>()

const { t } = useI18n()
const { orderRequestTypeTranslation, orderResourceTypeTranslation, orderStatusTypeTranslation } = useOrders()

const updateResourceId = (resourceId: string) => {
  emits('update:query', { resourceId: resourceId || undefined })
}
const updateBulkOrderId = (bulkOrderId: string) => {
  emits('update:query', { bulkOrderId: bulkOrderId || undefined })
}

const requestTypeOptions = Object.entries(orderRequestTypeTranslation).map(([value, text]) => ({
  value,
  text,
}))
const updateRequestType = (value: string[]) => {
  const requestType = value as OrderRequestType[]
  emits('update:query', { requestType: requestType.length !== 0 ? requestType : undefined })
}

const hiddenResourceTypes = [OrderResourceTypes.SelfTerminal]
const resourceTypeOptions = Object.entries(orderResourceTypeTranslation)
  .filter(([value]) => !hiddenResourceTypes.includes(value))
  .map(([value, text]) => ({ value, text }))
const updateResourceType = (value: string[]) => {
  const resourceType = Object.values(OrderResourceTypes).filter(
    type => !hiddenResourceTypes.includes(type) && value.includes(type),
  )
  emits('update:query', { resourceType: resourceType.length === 0 ? undefined : resourceType })
}

const orderStatusOptions = Object.entries(orderStatusTypeTranslation).map(([value, text]) => ({
  value,
  text,
}))
const updateOrderStatus = (value: string[]) => {
  const orderStatus = value as OrderStatusType[]
  emits('update:query', { orderStatus: orderStatus.length !== 0 ? orderStatus : undefined })
}

const handleQueryClear = () => {
  emits('update:query', {
    resourceId: undefined,
    requestType: undefined,
    resourceType: undefined,
    orderStatus: undefined,
    bulkOrderId: undefined,
  })
}
</script>

<template>
  <SearchFilter class="text-size-sm" @search="emits('search')" @clear="handleQueryClear">
    <div class="flex-flex-start-center my-2">
      <div class="w-150px px-2">{{ t('orders.resourceId') }}</div>
      <InputForm
        :model-value="query?.resourceId ?? ''"
        placeholder="Z123456789"
        size="small"
        @update:model-value="updateResourceId"
      />
    </div>
    <div class="flex-flex-start-center my-2">
      <div class="w-150px px-2">{{ t('orders.bulkOrderId') }}</div>
      <InputForm
        :model-value="query?.bulkOrderId ?? ''"
        placeholder="62ec2b62646740b5809f695dea7b2bbf"
        size="middle"
        @update:model-value="updateBulkOrderId"
      />
    </div>
    <div class="order-filter-container overflow-hidden">
      <div class="grid">
        <div class="label">{{ t('orders.requestType') }}</div>
        <div class="bg-white pa-2">
          <CheckboxForm
            :value="query?.requestType ?? []"
            :options="requestTypeOptions"
            @update:value="updateRequestType"
          />
        </div>
      </div>
      <div class="grid">
        <div class="label">{{ t('orders.resourceType') }}</div>
        <div class="bg-white pa-2">
          <CheckboxForm
            :value="query?.resourceType ?? []"
            :options="resourceTypeOptions"
            col-min-width="245px"
            @update:value="updateResourceType"
          />
        </div>
      </div>
      <div class="grid">
        <div class="label">{{ t('details.orderStatus') }}</div>
        <div class="bg-white pa-2">
          <CheckboxForm
            :value="query?.orderStatus ?? []"
            :options="orderStatusOptions"
            @update:value="updateOrderStatus"
          />
        </div>
      </div>
    </div>
  </SearchFilter>
</template>

<style lang="scss" scoped>
.text-size-sm {
  font-size: 0.825rem;
}
.w-150px {
  width: 150px;
}
.order-filter-container {
  border-radius: 0.75rem;
  .grid {
    display: grid;
    grid-template-columns: 160px 1fr;
    gap: 1rem 0.25rem;
    margin-bottom: 0.25rem;
    .label {
      display: flex;
      align-items: center;
      padding: 0.5rem;
      color: rgb(var(--v-theme-secondary));
      background-color: rgb(var(--v-theme-light-primary));
    }
  }
}
</style>
