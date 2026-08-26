<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RouteName } from '@/route/constants'

type ItemType = {
  title: string
  name: string
  params?: Record<string, string>
  disabled?: boolean
}

type PropType = {
  customerNote?: string
}
const props = withDefaults(defineProps<PropType>(), {
  customerNote: '',
})

const route = useRoute()
const { t } = useI18n()
const tenantId = computed(() => route.params.tenantId as string)
const id = computed(() => (route.params.id as string) || '')
const resourceName = computed(() => `${props.customerNote}（${id.value}）`)

const home = computed<ItemType>(() => {
  return { title: t('nova.sideBar.home'), name: RouteName.Home }
})

const operationStatus = computed<ItemType>(() => {
  return { title: t('nova.sideBar.core.operationStatus'), name: RouteName.Monitoring.OperationStatus }
})

const vpnList = computed<ItemType>(() => {
  return { title: t('nova.sideBar.core.vpnList'), name: RouteName.Vpn.List }
})
const vpnDetail = computed<ItemType>(() => {
  return { title: resourceName.value, name: RouteName.Vpn.Detail, params: { id: id.value } }
})

const unoConnectionList = computed<ItemType>(() => {
  return {
    title: t('nova.sideBar.core.unoConnection'),
    name: RouteName.UnoConnection.List,
  }
})
const unoConnectionDetail = computed<ItemType>(() => {
  return {
    title: resourceName.value,
    name: RouteName.UnoConnection.Detail,
    params: { id: id.value },
  }
})

const breakOutList = computed<ItemType>(() => {
  return {
    title: t('nova.sideBar.core.breakOutList'),
    name: RouteName.BreakOut.List,
  }
})
const breakOutDetail = computed<ItemType>(() => {
  return {
    title: resourceName.value,
    name: RouteName.BreakOut.Detail,
    params: { id: id.value },
  }
})

const ficConnectionList = computed<ItemType>(() => {
  return {
    title: t('nova.fic.title'),
    name: RouteName.FicConnection.List,
  }
})
const ficConnectionDetail = computed<ItemType>(() => {
  return {
    title: resourceName.value,
    name: RouteName.FicConnection.Detail,
    params: { id: id.value },
  }
})

const supportList = computed<ItemType>(() => {
  return {
    title: t('nova.sideBar.other.supportList'),
    name: RouteName.Support.List,
  }
})
const ipoeList = computed<ItemType>(() => {
  return {
    title: t('nova.ipoes.title'),
    name: RouteName.Ipoe.List,
  }
})
const ipoeDetail = computed<ItemType>(() => {
  return { title: resourceName.value, name: RouteName.Ipoe.Detail, params: { id: id.value } }
})
const guaranteeList = computed<ItemType>(() => {
  return {
    title: t('nova.sideBar.core.guaranteeList'),
    name: RouteName.Guarantee.List,
  }
})

const items = computed<ItemType[]>(() => {
  switch (route.name) {
    case RouteName.Home:
      return []
    case RouteName.Monitoring.OperationStatus:
      return [home.value, { ...operationStatus.value, disabled: true }]
    case RouteName.Vpn.List:
      return [home.value, { ...vpnList.value, disabled: true }]
    case RouteName.Vpn.Create:
      return [
        home.value,
        vpnList.value,
        {
          title: t('nova.pageHeader.application', { resourceType: 'VPN' }),
          name: RouteName.Vpn.Create,
          disabled: true,
        },
      ]
    case RouteName.Vpn.Delete:
      return [
        home.value,
        vpnList.value,
        vpnDetail.value,
        { title: t('nova.common.deleteTitle'), name: RouteName.Vpn.Delete, disabled: true },
      ]
    case RouteName.Vpn.Detail:
      return [home.value, vpnList.value, { ...vpnDetail.value, disabled: true }]
    case RouteName.Vpn.Edit:
      return [
        home.value,
        vpnList.value,
        vpnDetail.value,
        { title: t('nova.common.change'), name: RouteName.Vpn.Edit, disabled: true },
      ]
    case RouteName.UnoConnection.List:
      return [home.value, { ...unoConnectionList.value, disabled: true }]
    case RouteName.UnoConnection.Create:
      return [
        home.value,
        unoConnectionList.value,
        { title: t('nova.unoConnections.createTitle'), name: RouteName.UnoConnection.Create, disabled: true },
      ]
    case RouteName.UnoConnection.Delete:
      return [
        home.value,
        unoConnectionList.value,
        unoConnectionDetail.value,
        { title: t('nova.common.deleteTitle'), name: RouteName.UnoConnection.Delete, disabled: true },
      ]
    case RouteName.UnoConnection.Detail:
      return [home.value, unoConnectionList.value, { ...unoConnectionDetail.value, disabled: true }]
    case RouteName.BreakOut.List:
      return [home.value, { ...breakOutList.value, disabled: true }]
    case RouteName.BreakOut.Detail:
      return [home.value, breakOutList.value, { ...breakOutDetail.value, disabled: true }]
    case RouteName.BreakOut.Apply:
      return [
        home.value,
        breakOutList.value,
        breakOutDetail.value,
        { title: t('nova.breakOut.apply'), name: RouteName.BreakOut.Apply, disabled: true },
      ]
    case RouteName.FicConnection.List:
      return [home.value, { ...ficConnectionList.value, disabled: true }]
    case RouteName.FicConnection.Create:
      return [
        home.value,
        ficConnectionList.value,
        { title: t('nova.fic.createFicConnection'), name: RouteName.FicConnection.Create, disabled: true },
      ]
    case RouteName.FicConnection.Delete:
      return [
        home.value,
        ficConnectionList.value,
        ficConnectionDetail.value,
        { title: t('nova.common.deleteTitle'), name: RouteName.FicConnection.Delete, disabled: true },
      ]
    case RouteName.FicConnection.Detail:
      return [home.value, ficConnectionList.value, { ...ficConnectionDetail.value, disabled: true }]
    case RouteName.FicConnection.Edit:
      return [
        home.value,
        ficConnectionList.value,
        ficConnectionDetail.value,
        { title: t('nova.common.change'), name: RouteName.FicConnection.Edit, disabled: true },
      ]
    case RouteName.Guarantee.List:
      return [home.value, { ...guaranteeList.value, disabled: true }]
    case RouteName.Ipoe.List:
      return [home.value, { ...ipoeList.value, disabled: true }]
    case RouteName.Ipoe.Create:
      return [
        home.value,
        ipoeList.value,
        { title: t('nova.ipoes.create'), name: RouteName.Ipoe.Create, disabled: true },
      ]
    case RouteName.Ipoe.Delete:
      return [
        home.value,
        ipoeList.value,
        ipoeDetail.value,
        { title: t('nova.common.deleteTitle'), name: RouteName.Ipoe.Delete, disabled: true },
      ]
    case RouteName.Ipoe.Detail:
      return [home.value, ipoeList.value, { ...ipoeDetail.value, disabled: true }]
    case RouteName.Support.List:
      return [home.value, { ...supportList.value, disabled: true }]
    case RouteName.Support.SecurityHelpDesk:
      return [
        home.value,
        supportList.value,
        { title: t('nova.securityHelpDesk.detail'), name: RouteName.Support.SecurityHelpDesk, disabled: true },
      ]
    case RouteName.IDaaS.ApiKeySetting:
      return [
        home.value,
        { title: t('nova.sideBar.extensions.apiKeySetting'), name: RouteName.IDaaS.ApiKeySetting, disabled: true },
      ]
    default:
      return []
  }
})
const title = computed(() => {
  const last = items.value.slice(-1)[0]?.title || ''
  switch (route.name) {
    case RouteName.Vpn.Detail:
      return `VPN ${t('nova.common.detail')}`
    case RouteName.Vpn.Delete:
    case RouteName.Vpn.Edit:
      return `VPN ${last}`
    case RouteName.UnoConnection.Delete:
      return `${t('nova.unoConnections.title')} ${last}`
    case RouteName.UnoConnection.Detail:
      return `${t('nova.unoConnections.title')} ${t('nova.common.detail')}`
    case RouteName.BreakOut.Detail:
      return t('nova.breakOut.detail')
    case RouteName.FicConnection.Detail:
      return `${t('nova.fic.name')} ${t('nova.common.detail')}`
    case RouteName.FicConnection.Delete:
    case RouteName.FicConnection.Edit:
      return `${t('nova.fic.name')} ${last}`
    case RouteName.Ipoe.Detail:
      return t('nova.ipoes.detail')
    case RouteName.Ipoe.Delete:
      return `${t('nova.ipoes.name')} ${last}`
    default:
      return last
  }
})
</script>

<template>
  <div>
    <v-breadcrumbs :items="items" class="ma-0 pa-0 pb-2 text-sm">
      <template #item="{ item }: { item: Partial<ItemType> }">
        <NuxtLink
          v-if="!item.disabled"
          :to="{ name: item.name, params: { tenantId, ...item.params }, query: getRouteQuery(item.name!) }"
        >
          {{ item.title }}
        </NuxtLink>
        <span v-else>{{ item.title }}</span>
      </template>
    </v-breadcrumbs>
    <div class="flex-space-between-center">
      <div class="font-weight-bold text-headline-medium">{{ title }}</div>
      <slot />
    </div>
  </div>
</template>
