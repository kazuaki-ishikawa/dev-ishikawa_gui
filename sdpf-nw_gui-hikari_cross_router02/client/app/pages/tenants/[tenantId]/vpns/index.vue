<script lang="ts" setup>
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import { ResourceStatusOptions, ResourceStatusTypes } from '@/api/constants'
import { IconTypes } from '@/components/icons/constants'
import { TenantPages } from '@/components/sidebar/constants'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenantId as string)

// vpn一覧取得
const { vpnQuery, vpnList, getVpnList } = useGetVpnList()

const moveToCreate = async () => {
  await navigateTo({ path: `${route.path}/create` })
}

const headers = [
  { text: t('vpn.vpnId'), key: 'vpnId', width: 120 },
  { text: t('vpn.name'), key: 'customerNote' },
  { text: t('vpn.routeCount'), key: 'routeCount', width: 110 },
  { text: t('details.resourceStatus'), key: 'resourceStatus', width: 175 },
  { text: t('details.orderId'), key: 'orderId' },
  { text: t('details.updateTime'), key: 'updateTime', width: 182 },
]
const items = computed(() =>
  vpnList.value.map(vpn => ({
    vpnId: vpn.vpnId,
    customerNote: vpn.customerNote,
    routeCount: `${vpn?.routeCount ?? ''}`,
    resourceStatus: vpn.resourceStatus,
    orderId: vpn?.orderId ?? '',
    updateTime: vpn.updateTime,
  })),
)

const handleSearch = () => {
  if (isEqual(routeQuery.value, vpnQuery.value)) {
    // パスクエリの変更がない場合は直接 getVpnList を実行する
    getVpnList(vpnQuery.value)
  } else {
    router.push({ query: vpnQuery.value })
  }
}
const handleQueryClear = () => {
  vpnQuery.value = { resourceStatus: undefined }
}
const updateQueryResourceStatus = (status: string[]) => {
  vpnQuery.value = { resourceStatus: Object.values(ResourceStatusTypes).filter(v => status.includes(v)) }
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
    { ...vpnQuery.value },
  ),
)
const changeRouteQuery = () => {
  getVpnList(routeQuery.value)
}
watch(() => route.query, changeRouteQuery)
onBeforeMount(changeRouteQuery)
</script>

<template>
  <CardContainer>
    <div class="flex-flex-start-center pb-5">
      <SvgIcon class="pt-1" :type="IconTypes.Vpn" color="secondary" />
      <div class="flex-grow-1 ml-2 text-lg">VPN {{ t('common.list') }}</div>
    </div>

    <div class="flex-space-between-flex-end flex-wrap">
      <SearchFilter @search="handleSearch" @clear="handleQueryClear">
        <InputGrid :label="t('details.resourceStatus')" :label-width="180">
          <MultipleSelectForm
            :model-value="vpnQuery?.resourceStatus ?? []"
            :options="ResourceStatusOptions"
            placeholder="inactive..."
            @update:model-value="updateQueryResourceStatus"
          />
        </InputGrid>
      </SearchFilter>
      <div class="d-flex mb-5">
        <CustomButton
          class="vpn-create-button"
          icon="right-arrow"
          :text="t('common.createNew')"
          :width="180"
          @click="moveToCreate()"
        />
      </div>
    </div>

    <StripedTable :headers="headers" :items="items" :key-items="['vpnId']">
      <template #vpnId="{ data }">
        <NuxtLink :to="`${route.path}/${data}`">{{ data }}</NuxtLink>
      </template>
      <template #customerNote="{ data }">
        <div class="text-truncate flex-grow-1" :title="data">{{ data }}</div>
      </template>
      <template #orderId="{ data }">
        <NuxtLink v-if="!!data" class="text-truncate" :to="`/tenants/${tenantId}/${TenantPages.Orders}/${data}`">
          {{ data }}
        </NuxtLink>
      </template>
      <template #updateTime="{ data }">
        <div>{{ formatDateTime(data) }}</div>
      </template>
    </StripedTable>
  </CardContainer>
</template>
