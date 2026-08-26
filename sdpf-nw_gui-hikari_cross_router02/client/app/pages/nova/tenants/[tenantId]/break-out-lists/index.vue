<script setup lang="ts">
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import { ResourceStatusTypes } from '@/api/constants'
import { BREAK_OUT_LINK } from '@/api/breakOut/constants'
import type { BreakOutListQuery } from '@/api/breakOut/types'
import { RouteName } from '@/route/constants'

definePageMeta({
  name: RouteName.BreakOut.List,
})

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const resourceStatusOptions = useNovaResourceStatusOptions()
const tenantId = computed(() => route.params.tenantId as string)

const query = ref<BreakOutListQuery>({ customerNote: undefined, resourceStatus: undefined })
const { getBreakOutList, breakOutList } = useGetBreakOutList()

const headers = [
  { title: `${t('nova.breakOut.id')}\n${t('nova.breakOut.customerNote')}`, key: 'breakOutListId', sortable: false },
  { title: t('nova.details.resourceStatus'), key: 'resourceStatus', sortable: false, width: 130 },
  { title: t('nova.details.updateTime'), key: 'updateTime', sortable: false },
  { title: '', key: 'action', sortable: false, width: 100 },
]
const items = computed(() =>
  breakOutList.value.map(breakOut => ({
    breakOutListId: breakOut.breakOutListId,
    customerNote: breakOut.customerNote,
    resourceStatus: breakOut.resourceStatus,
    updateTime: formatDateTime(breakOut.updateTime),
  })),
)

const moveToCreate = () => {
  return navigateTo({ name: RouteName.BreakOut.Create, params: { tenantId: tenantId.value } })
}

const moveToDetail = (id: string) => {
  return navigateTo({ name: RouteName.BreakOut.Detail, params: { tenantId: tenantId.value, id } })
}

const updateQueryCustomerNote = (value: string | string[]) => {
  const customerNote = typeof value === 'string' ? value : value[0]
  query.value = { ...query.value, customerNote: customerNote || undefined }
}
const updateQueryResourceStatus = (status: string | string[]) => {
  query.value = {
    ...query.value,
    resourceStatus: Object.values(ResourceStatusTypes).filter(v => status.includes(v)),
  }
}

const handleSearch = () => {
  if (isEqual(routeQuery.value, query.value)) {
    // パスクエリの変更がない場合は直接 getBreakOutList を実行する
    getBreakOutList(query.value)
  } else {
    router.push({ query: query.value })
  }
}
const handleQueryClear = () => {
  query.value = { customerNote: undefined, resourceStatus: undefined }
}

const routeQuery = computed(() =>
  ['customerNote', 'resourceStatus'].reduce(
    (q, key) => {
      const value = route.query[key]
      if (key === 'resourceStatus') {
        return Object.assign(q, { [key]: typeof value === 'string' ? [value] : value })
      }
      // customerNote は string 型のため、配列や null で来た場合は正規化する
      const customerNote = Array.isArray(value) ? value[0] : value
      return Object.assign(q, { [key]: customerNote ?? undefined })
    },
    { ...query.value },
  ),
)
const changeRouteQuery = () => {
  query.value = routeQuery.value
  getBreakOutList(routeQuery.value)
}

watch(() => route.query, changeRouteQuery, { immediate: true })
</script>

<template>
  <div>
    <NovaPageHeader>
      <NovaCustomButton data-cy="break-out-lists-index-create-button" @click="moveToCreate">
        {{ t('nova.common.applicationForNew') }}
      </NovaCustomButton>
    </NovaPageHeader>

    <ul class="text-sm mb-2">
      <li>{{ t('nova.breakOut.note.list-1') }}</li>
      <li>{{ t('nova.breakOut.note.list-2') }}</li>
      <i18n-t keypath="nova.breakOut.note.list-3" tag="li" scope="global">
        <template #here>
          <NuxtLink :to="BREAK_OUT_LINK.CHANGE_LBO" target="_blank" rel="noopener noreferrer">
            {{ t('nova.common.here') }}
          </NuxtLink>
        </template>
      </i18n-t>
      <i18n-t keypath="nova.breakOut.note.list-4" tag="li" scope="global">
        <template #here>
          <NuxtLink :to="BREAK_OUT_LINK.SERVICES" target="_blank" rel="noopener noreferrer">
            {{ t('nova.common.here') }}
          </NuxtLink>
        </template>
      </i18n-t>
    </ul>

    <NovaSearchFilter @clear="handleQueryClear" @search="handleSearch">
      <NovaSearchInput
        :model-value="query.customerNote ?? ''"
        type="input"
        :label="t('nova.breakOut.customerNote')"
        @update:model-value="updateQueryCustomerNote"
      />
      <NovaSearchInput
        class="flex-grow-1"
        :model-value="query.resourceStatus ?? []"
        type="checkbox"
        :options="resourceStatusOptions"
        :label="t('nova.details.resourceStatus')"
        @update:model-value="updateQueryResourceStatus"
      />
    </NovaSearchFilter>

    <NovaPaginationHeader :total="breakOutList.length" />

    <NovaDataTable :headers="headers" :items="items" height="57vh">
      <template #[`item.breakOutListId`]="{ item }">
        <NuxtLink :to="{ name: RouteName.BreakOut.Detail, params: { tenantId, id: item.breakOutListId } }">
          {{ item.breakOutListId }}
        </NuxtLink>
        <div class="text-break">{{ item.customerNote }}</div>
      </template>
      <template #[`item.resourceStatus`]="{ item }">
        <NovaResourceStatusTag :status="item.resourceStatus" />
      </template>
      <template #[`item.action`]="{ item }">
        <NovaCustomButton
          append-icon="mdi-chevron-right"
          outlined
          size="small"
          @click="moveToDetail(item.breakOutListId)"
        >
          {{ t('nova.common.detail') }}
        </NovaCustomButton>
      </template>
    </NovaDataTable>
  </div>
</template>
