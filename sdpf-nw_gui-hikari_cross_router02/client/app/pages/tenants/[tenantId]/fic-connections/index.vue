<script lang="ts" setup>
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import { ResourceStatusTypes } from '@/api/constants'
import { IconTypes } from '@/components/icons/constants'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenantId as string)
const { ficConnectionsQuery, getFicConnectionList, ficConnections } = useGetFicConnectionList()

const headers = [
  { text: t('fic.ficId'), key: 'ficConnectionId', width: 120 },
  { text: t('fic.customerNote'), key: 'customerNote' },
  { text: 'VPN ID', key: 'vpnId', width: 120 },
  {
    text: t('fic.referenceFicConnectionId'),
    key: 'referenceFicConnectionId',
    width: 170,
    help: t('fic.help.referenceFicConnectionId'),
  },
  { text: t('details.resourceStatus'), key: 'resourceStatus', width: 260 },
  { text: t('details.orderId'), key: 'orderId' },
  { text: t('details.updateTime'), key: 'updateTime', width: 182 },
]

const moveToCreate = async () => {
  await navigateTo({ path: `/tenants/${tenantId.value}/fic-connections/create` })
}
const handleSearch = () => {
  if (isEqual(routeQuery.value, ficConnectionsQuery.value)) {
    // パスクエリの変更がない場合は直接 getFicConnectionList を実行する
    getFicConnectionList(ficConnectionsQuery.value)
  } else {
    router.push({ query: ficConnectionsQuery.value })
  }
}
const handleQueryClear = () => {
  ficConnectionsQuery.value = { resourceStatus: undefined }
}

const resourceStatusText = {
  [ResourceStatusTypes.Active]: t('fic.resourceStatuses.active'),
  [ResourceStatusTypes.Inactive]: t('fic.resourceStatuses.inactive'),
  [ResourceStatusTypes.Terminated]: t('fic.resourceStatuses.terminated'),
} as const

const resourceStatusOptions = computed(() =>
  Object.entries(resourceStatusText).map(([value, text]) => ({ text, value })),
)
const updateQueryResourceStatus = (status: string[]) => {
  ficConnectionsQuery.value = {
    resourceStatus: Object.values(ResourceStatusTypes).filter(v => status.includes(v)),
  }
}
const routeQuery = computed(() =>
  ['resourceStatus'].reduce(
    (q, key) => {
      const value = route.query[key]
      if (['resourceStatus'].includes(key) && typeof value === 'string') {
        return Object.assign(q, { [key]: [value] })
      } else {
        return Object.assign(q, { [key]: value })
      }
    },
    { ...ficConnectionsQuery.value },
  ),
)
const changeRouteQuery = () => {
  getFicConnectionList(routeQuery.value)
}
watch(() => route.query, changeRouteQuery)
onBeforeMount(changeRouteQuery)
</script>

<template>
  <CardContainer>
    <div class="flex-flex-start-center pb-5">
      <SvgIcon class="pt-1" :type="IconTypes.Fic" color="secondary" />
      <div class="flex-grow-1 ml-2 text-lg">{{ `${t('sideBar.fic')} ${t('common.list')} ` }}</div>
    </div>
    <div class="flex-space-between-flex-end flex-wrap">
      <SearchFilter @search="handleSearch" @clear="handleQueryClear">
        <InputGrid :label="t('details.resourceStatus')" :label-width="180">
          <MultipleSelectForm
            :model-value="ficConnectionsQuery?.resourceStatus ?? []"
            :options="resourceStatusOptions"
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
          data-cy="fic-connections-index-create-button"
          @click="moveToCreate()"
        />
      </div>
    </div>
    <StripedTable :headers="headers" :items="ficConnections" :key-items="['ficConnectionId']">
      <template #customerNote="{ row }">
        <div class="text-truncate flex-grow-1" :title="row.customerNote">{{ row.customerNote }}</div>
      </template>
      <template #ficConnectionId="{ data }">
        <NuxtLink :to="`/tenants/${tenantId}/fic-connections/${data}`">{{ data }}</NuxtLink>
      </template>
      <template #resourceStatus="{ row }">
        <div>{{ row.resourceStatus ? resourceStatusText[row.resourceStatus] : '' }}</div>
      </template>
      <template #vpnId="{ data }">
        <NuxtLink :to="`/tenants/${tenantId}/vpns/${data}`">{{ data }}</NuxtLink>
      </template>
      <template #orderId="{ data }">
        <NuxtLink v-if="!!data" class="text-truncate" :to="`/tenants/${tenantId}/orders/${data}`">{{ data }}</NuxtLink>
      </template>
      <template #updateTime="{ row }">
        <div>{{ formatDateTime(row.updateTime) }}</div>
      </template>
    </StripedTable>
  </CardContainer>
</template>
