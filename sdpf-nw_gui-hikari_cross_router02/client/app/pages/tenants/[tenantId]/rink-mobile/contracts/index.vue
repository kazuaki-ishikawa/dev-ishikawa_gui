<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { IconTypes } from '@/components/icons/constants'
import { TenantPages, RinkMobilePages } from '@/components/sidebar/constants'

const { t } = useI18n()
const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)

const { getRinkConnectionList, rinkConnectionList } = useGetRinkConnectionList()
const { rinkConnectionTypeTranslation } = useRinkConnections()

const tableHeaders = [
  { text: t('rinkConnections.rinkMobileId'), key: 'zId', width: 170 },
  { text: t('rinkConnections.connectionType'), key: 'connectionType' },
  { text: 'VPN ID', key: 'vpnId', width: 150 },
]

onBeforeMount(() => {
  getRinkConnectionList()
})
</script>

<template>
  <CardContainer>
    <div class="flex-flex-start-center">
      <SvgIcon class="pt-1" :type="IconTypes.Sim" color="secondary" />
      <div class="ml-2 text-lg">{{ t('sideBar.rinkContracts') }}</div>
    </div>
    <StripedTable class="mt-4" :headers="tableHeaders" :items="rinkConnectionList" :key-items="['zId']">
      <template #zId="{ row }">
        <NuxtLink :to="`/tenants/${tenantId}/${TenantPages.RinkMobile}/${RinkMobilePages.Contracts}/${row.zId}`">
          {{ row.zId }}
        </NuxtLink>
      </template>
      <template #connectionType="{ row }">
        {{ rinkConnectionTypeTranslation[row.connectionType] }}
      </template>
      <template #vpnId="{ row }">
        <NuxtLink v-if="row.vpnId" :to="`/tenants/${tenantId}/${TenantPages.Vpns}/${row.vpnId}`">
          {{ row.vpnId }}
        </NuxtLink>
      </template>
    </StripedTable>
  </CardContainer>
</template>
