<script setup lang="ts">
import { ListItemMinHeight } from './constants'
import type { SideBarItemType } from './types'
import { RouteName } from '@/route/constants'

type PropsType = {
  item: SideBarItemType
}
const props = defineProps<PropsType>()
const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)
const query = computed(() => getRouteQuery(props.item.value))

const routeName = computed(() => {
  switch (route.name) {
    case RouteName.Vpn.Create:
    case RouteName.Vpn.Delete:
    case RouteName.Vpn.Detail:
    case RouteName.Vpn.Edit:
      return RouteName.Vpn.List
    case RouteName.UnoConnection.Create:
    case RouteName.UnoConnection.Detail:
    case RouteName.UnoConnection.Delete:
      return RouteName.UnoConnection.List
    case RouteName.BreakOut.Detail:
    case RouteName.BreakOut.Apply:
      return RouteName.BreakOut.List
    case RouteName.FicConnection.Create:
    case RouteName.FicConnection.Delete:
    case RouteName.FicConnection.Detail:
    case RouteName.FicConnection.Edit:
      return RouteName.FicConnection.List
    case RouteName.Ipoe.Create:
    case RouteName.Ipoe.Delete:
    case RouteName.Ipoe.Detail:
      return RouteName.Ipoe.List
    case RouteName.Support.SecurityHelpDesk:
      return RouteName.Support.List
    default:
      return route.name
  }
})
const handleItemClick = (item: SideBarItemType) => {
  if (item.external) {
    // TODO: RouteName.External.* がURLになるようにする
    return navigateTo(item.value, {
      external: true,
      open: { target: '_blank', windowFeatures: { noopener: true, noreferrer: true } },
    })
  } else {
    return navigateTo({ name: item.value, params: { tenantId: tenantId.value }, query: query.value })
  }
}
</script>

<template>
  <v-list-item
    :active="item.value === routeName"
    :title="item.title"
    :value="item.value"
    base-color="info"
    :min-height="ListItemMinHeight"
    :append-icon="item.external ? 'nova:up-right-square' : ''"
    @click.stop="handleItemClick(item)"
  />
</template>
