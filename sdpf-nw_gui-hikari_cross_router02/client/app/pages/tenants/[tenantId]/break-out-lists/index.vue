<script setup lang="ts">
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import { ResourceStatusOptions, ResourceStatusTypes } from '@/api/constants'
import { BREAK_OUT_LINK } from '@/api/breakOut/constants'
import type { BreakOutListQuery } from '@/api/breakOut/types'
import { TenantPages } from '@/components/sidebar/constants'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)

const headers = [
  { text: t('breakOut.id'), key: 'breakOutListId', width: 320 },
  { text: t('breakOut.customerNote'), key: 'customerNote' },
  { text: t('details.resourceStatus'), key: 'resourceStatus', width: 180 },
  { text: t('details.updateTime'), key: 'updateTime', width: 182 },
]

const query = ref<BreakOutListQuery>({ customerNote: undefined, resourceStatus: undefined })
const { getBreakOutList, breakOutList } = useGetBreakOutList()

const moveToCreate = async () => {
  await navigateTo({ path: `/tenants/${tenantId.value}/${TenantPages.BreakOutLists}/create` })
}

const updateQueryResourceStatus = (status: string[]) => {
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
      if (['resourceStatus'].includes(key) && typeof value === 'string') {
        return Object.assign(q, { [key]: [value] })
      } else {
        return Object.assign(q, { [key]: value })
      }
    },
    { ...query.value },
  ),
)

const changeRouteQuery = () => {
  query.value = routeQuery.value
  getBreakOutList(routeQuery.value)
}

watch(() => route.query, changeRouteQuery)
onBeforeMount(changeRouteQuery)
</script>

<template>
  <CardContainer>
    <div class="flex-flex-start-center">
      <div class="flex-grow-1 ml-2 text-lg">{{ t('breakOut.title') }} {{ t('common.list') }}</div>
    </div>
    <ul>
      <li>{{ t('breakOut.note.list-1') }}</li>
      <li>{{ t('breakOut.note.list-2') }}</li>
      <i18n-t keypath="breakOut.note.list-3" tag="li" scope="global">
        <template #here>
          <NuxtLink :to="BREAK_OUT_LINK.CHANGE_LBO" target="_blank">
            {{ t('common.here') }}
          </NuxtLink>
        </template>
      </i18n-t>
      <i18n-t keypath="breakOut.note.list-4" tag="li" scope="global">
        <template #here>
          <NuxtLink :to="BREAK_OUT_LINK.SERVICES" target="_blank">
            {{ t('common.here') }}
          </NuxtLink>
        </template>
      </i18n-t>
    </ul>

    <div class="flex-space-between-flex-end flex-wrap">
      <SearchFilter @search="handleSearch" @clear="handleQueryClear">
        <InputGrid :label="t('breakOut.customerNote')" :label-width="180">
          <InputForm
            :model-value="query?.customerNote ?? ''"
            :placeholder="t('breakOut.customerNote')"
            @update:model-value="(value: string) => (query.customerNote = value || undefined)"
          />
        </InputGrid>
        <InputGrid :label="t('details.resourceStatus')" :label-width="180">
          <MultipleSelectForm
            :model-value="query?.resourceStatus ?? []"
            :options="ResourceStatusOptions"
            placeholder="inactive..."
            @update:model-value="updateQueryResourceStatus"
          />
        </InputGrid>
      </SearchFilter>

      <div class="d-flex mb-5">
        <CustomButton
          icon="right-arrow"
          :text="t('common.createNew')"
          :width="180"
          data-cy="break-out-lists-index-create-button"
          @click="moveToCreate()"
        />
      </div>
    </div>

    <StripedTable :headers="headers" :items="breakOutList" :key-items="['breakOutListId']">
      <template #breakOutListId="{ row }">
        <NuxtLink :to="`/tenants/${tenantId}/${TenantPages.BreakOutLists}/${row.breakOutListId}`">
          {{ row.breakOutListId }}
        </NuxtLink>
      </template>
      <template #customerNote="{ row }">
        <div class="text-truncate flex-grow-1" :title="row.customerNote">{{ row.customerNote }}</div>
      </template>
      <template #updateTime="{ row }">
        <div>{{ formatDateTime(row.updateTime) }}</div>
      </template>
    </StripedTable>
  </CardContainer>
</template>
