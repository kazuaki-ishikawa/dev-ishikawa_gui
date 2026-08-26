<script setup lang="ts">
import { useI18n } from 'vue-i18n'

type PropType = {
  items: Array<Record<string, string>>
}
defineProps<PropType>()

const { t } = useI18n()
const route = useRoute()

const dataTableRouteHeaders = [
  { title: t('nova.vpn.route'), value: 'route', sortable: false, width: 200 },
  { title: t('nova.details.resourceType'), value: 'resourceType', sortable: false, width: 200 },
  {
    title: `${t('nova.details.resourceId')}\n${t('nova.details.resourceName')}`,
    value: 'resourceId',
    sortable: false,
    width: 200,
  },
]
</script>

<template>
  <NovaPaginationHeader :total="items.length" />
  <NovaDataTable :headers="dataTableRouteHeaders" :items="items">
    <template #noData>
      <div class="font-weight-bold text-lg my-5">{{ t('nova.vpn.message.routeTableNoData') }}</div>
      <div class="my-5">{{ t('nova.vpn.message.routeTableNoDataDescription') }}</div>
    </template>
    <template #[`item.resourceId`]="{ item }">
      <NuxtLink :to="{ name: item.routeName, params: { tenantId: route.params.tenantId, id: item.resourceId } }">
        {{ item.resourceId }}
      </NuxtLink>
      <div class="text-break">{{ item.resourceName }}</div>
    </template>
  </NovaDataTable>
</template>
