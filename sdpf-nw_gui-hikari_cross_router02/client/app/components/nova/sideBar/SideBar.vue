<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RouteName } from '@/route/constants'
import { ListItemMinHeight, NavigationGroupIconMap, InitialOpen } from './constants'
import type { SideBarSecuredWanGroupType, SideBarSectionType, SideBarItemType } from './types'

const { t } = useI18n()
const rail = ref(false)
const open = ref([...InitialOpen])

const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)

const items = computed<Record<string, SideBarItemType[]>>(() => ({
  monitoringInformation: [
    {
      title: t('nova.sideBar.core.operationStatus'),
      value: RouteName.Monitoring.OperationStatus,
    },
    {
      title: t('nova.sideBar.core.alertList'),
      value: RouteName.Monitoring.AlertList,
    },
    {
      title: t('nova.sideBar.core.trafficList'),
      value: RouteName.Monitoring.TrafficList,
    },
  ],
  circuitsApplication: [
    {
      title: t('nova.sideBar.core.siteList'),
      value: RouteName.Site.List,
    },
    {
      title: t('nova.sideBar.core.compositionPatternList'),
      value: RouteName.CompositionPattern.List,
    },
  ],
  accessToSiteResourceList: [
    {
      title: t('nova.sideBar.core.guaranteeList'),
      value: RouteName.Guarantee.List,
    },
    {
      title: t('nova.sideBar.core.ipoeList'),
      value: RouteName.Ipoe.List,
    },
    {
      title: t('nova.sideBar.core.terminalList'),
      value: RouteName.Terminal.List,
    },
  ],
  optionList: [
    {
      title: t('nova.sideBar.core.vpnList'),
      value: RouteName.Vpn.List,
    },
    {
      title: t('nova.sideBar.core.unoConnection'),
      value: RouteName.UnoConnection.List,
    },
    {
      title: t('nova.sideBar.core.breakOutList'),
      value: RouteName.BreakOut.List,
    },
    {
      title: t('nova.sideBar.core.ficConnectionList'),
      value: RouteName.FicConnection.List,
    },
  ],
  rinkMobileContractApplication: [
    {
      title: t('nova.sideBar.core.rinkMobileContractList'),
      value: RouteName.RinkMobileContract.List,
    },
  ],
  rinkMobileResourceList: [
    {
      title: t('nova.sideBar.core.rinkMobileLineList'),
      value: RouteName.RinkMobileLine.List,
    },
    {
      title: t('nova.sideBar.core.rinkMobileGroupList'),
      value: RouteName.RinkMobileGroup.List,
    },
    {
      title: t('nova.sideBar.core.rinkMobileDeviceList'),
      value: RouteName.RinkMobileDevice.List,
    },
  ],
  wanSecurityMonitoring: [
    {
      title: t('nova.sideBar.core.threatDetections'),
      value: RouteName.Threat.Detections,
    },
    {
      title: t('nova.sideBar.core.threatDetectionFilters'),
      value: RouteName.Threat.Filters,
    },
    {
      title: t('nova.sideBar.core.threatDetectionShared'),
      value: RouteName.Threat.Shared,
    },
    {
      title: t('nova.sideBar.core.flowCollector'),
      value: RouteName.Threat.FlowCollector,
    },
    {
      title: t('nova.sideBar.core.behaviorDetection'),
      value: RouteName.External.BehaviorDetection,
      external: true,
    },
  ],
  wanSecurityApplication: [
    {
      title: t('nova.sideBar.core.wanSecurityList'),
      value: RouteName.WanSecurity.List,
    },
  ],
  internetGateway: [
    {
      title: t('nova.sideBar.extensions.flexibleSecureWebGateway'),
      value: RouteName.External.FlexibleSecureWebGateway,
      external: true,
    },
    {
      title: t('nova.sideBar.extensions.vUtm2'),
      value: RouteName.External.VUtm2,
      external: true,
    },
    {
      title: t('nova.sideBar.extensions.menloProxy'),
      value: RouteName.External.MenloProxy,
      external: true,
    },
  ],
  interconnect: [
    {
      title: t('nova.sideBar.extensions.flexibleInterconnectPremium'),
      value: RouteName.External.FlexibleInterconnectPremium,
      external: true,
    },
    {
      title: t('nova.sideBar.extensions.flexibleInterconnect'),
      value: RouteName.External.FlexibleInterconnect,
      external: true,
    },
  ],
  globalConnect: [
    {
      title: t('nova.sideBar.extensions.prismaAccess'),
      value: RouteName.External.PrismaAccess,
      external: true,
    },
    {
      title: t('nova.sideBar.extensions.catoNetworkAccess'),
      value: RouteName.External.CatoNetworkAccess,
      external: true,
    },
  ],
  satelliteConnect: [
    {
      title: t('nova.sideBar.extensions.amazonLeo'),
      value: RouteName.External.AmazonLeo,
      external: true,
    },
  ],
  remoteAccess: [
    {
      title: t('nova.sideBar.extensions.remoteAccess'),
      value: RouteName.External.RemoteAccess,
      external: true,
    },
  ],
  idaas: [
    {
      title: t('nova.sideBar.extensions.apiKeySetting'),
      value: RouteName.IDaaS.ApiKeySetting,
    },
    {
      title: t('nova.sideBar.extensions.authenticationRiskReports'),
      value: RouteName.IDaaS.AuthenticationRiskReports,
    },
  ],
  edr: [
    {
      title: t('nova.sideBar.extensions.edrLight'),
      value: RouteName.EDR.Light,
    },
  ],
  lanSecurity: [
    {
      title: t('nova.sideBar.menu.lanSecurity'),
      value: RouteName.External.LanSecurity,
      external: true,
    },
  ],
  support: [
    {
      title: t('nova.sideBar.other.supportList'),
      value: RouteName.Support.List,
    },
    {
      title: t('nova.sideBar.other.knowledgeCenter'),
      value: RouteName.External.KnowledgeCenter,
      external: true,
    },
  ],
  news: [
    {
      title: t('nova.sideBar.other.newsList'),
      value: RouteName.News.List,
    },
  ],
  maintenanceInformation: [
    {
      title: t('nova.sideBar.menu.maintenanceInformation'),
      value: RouteName.External.MaintenanceInformation,
      external: true,
    },
    {
      title: t('nova.sideBar.other.guaranteeMaintenanceInformation'),
      value: RouteName.MaintenanceInformation.Guarantee,
    },
  ],
  contract: [
    {
      title: t('nova.sideBar.other.contractorInformation'),
      value: RouteName.Contractor.Detail,
    },
    {
      title: t('nova.sideBar.other.billingManagement'),
      value: RouteName.BillingManagement.List,
    },
    {
      title: t('nova.sideBar.other.orders'),
      value: RouteName.Order.List,
    },
  ],
}))
const securedWanGroups = computed<SideBarSecuredWanGroupType[]>(() => {
  // NavigationGroupIconMap.Core のキー定義順に従って親子関係を構築する
  // icon あり → 親グループ、icon なし → 直前の親グループの子グループ
  // ※ キーの順序は constants.ts の定義順に依存する
  return Object.entries(NavigationGroupIconMap.Core).reduce((acc, [value, icon]) => {
    // セキュアドWANは別指定するので無視する
    if (value === 'securedWan') {
      return acc
    }

    // icon 指定が存在するときは親になる
    if (icon) {
      acc.push({
        title: t(`nova.sideBar.menu.${value}`),
        value,
        icon,
        groups: [],
      })
      return acc
    }
    // 親が存在する場合は子として追加する
    const parents = acc[acc.length - 1]
    if (parents?.groups) {
      parents.groups.push({
        title: t(`nova.sideBar.subTitle.${value}`),
        value,
        items: items.value[value],
      })
    }
    return acc
  }, [] as SideBarSecuredWanGroupType[])
})

const sections = computed<SideBarSectionType[]>(() => [
  {
    title: t('nova.sideBar.section.extensions'),
    groups: Object.entries(NavigationGroupIconMap.Extensions).map(([value, icon]) => ({
      title: t(`nova.sideBar.menu.${value}`),
      value,
      icon,
      items: items.value[value],
    })),
  },
  {
    title: t('nova.sideBar.section.other'),
    groups: Object.entries(NavigationGroupIconMap.Other).map(([value, icon]) => ({
      title: t(`nova.sideBar.menu.${value}`),
      value,
      icon,
      items: items.value[value],
    })),
  },
])

const moveTo = (routeName: string) => {
  return navigateTo({ name: routeName, params: { tenantId: tenantId.value } })
}

// rail モード時のセキュアドWANメニューの開閉状態を管理するための配列
// フライアウトに存在するのは securedWan 配下のグループのみなので、securedWan 自身を除いた Core のキーに絞る
const securedWanMenuOpen = ref<string[]>(Object.keys(NavigationGroupIconMap.Core).filter(key => key !== 'securedWan'))

// rail モード時のアイコン表示用グループ
const railGroups = computed(() => {
  const securedWan = {
    title: t('nova.sideBar.menu.securedWan'),
    value: 'securedWan',
    icon: NavigationGroupIconMap.Core.securedWan,
  }
  const extensions = Object.entries(NavigationGroupIconMap.Extensions).map(([value, icon]) => ({
    title: t(`nova.sideBar.menu.${value}`),
    value,
    icon,
  }))
  const other = Object.entries(NavigationGroupIconMap.Other).map(([value, icon]) => ({
    title: t(`nova.sideBar.menu.${value}`),
    value,
    icon,
  }))
  return [securedWan, ...extensions, ...other]
})
</script>

<template>
  <v-navigation-drawer permanent :rail="rail" color="bg-navigation">
    <v-sheet v-if="!rail" color="transparent" class="flex-space-between-center pl-4 py-1">
      <v-btn
        flat
        color="light-info"
        prepend-icon="nova:home"
        class="w-66 flex-flex-start-center"
        @click.stop="moveTo(RouteName.Home)"
      >
        {{ t('nova.sideBar.home') }}
      </v-btn>
      <v-btn variant="text" color="info" icon @click.stop="rail = !rail">
        <v-icon icon="nova:arrow-left-double" size="13" />
      </v-btn>
    </v-sheet>
    <template v-else>
      <div class="d-flex flex-column align-center py-1">
        <v-btn variant="text" color="info" icon @click.stop="rail = !rail">
          <v-icon icon="nova:arrow-left-double" size="13" class="rotate-180" />
        </v-btn>
        <v-btn flat rounded="md" color="#E5EBF3" icon class="mb-3" @click.stop="moveTo(RouteName.Home)">
          <v-icon :icon="`nova:home`" size="20" />
        </v-btn>
      </div>
      <v-divider />
    </template>

    <!-- メニュー -->
    <v-list v-if="!rail" v-model:opened="open" nav prepend-gap="6" indent="15" class="px-0" open-strategy="multiple">
      <!-- コア機能：セキュアドWAN -->
      <v-list-subheader inset class="subheader text-info px-3 bg-highlight">
        {{ t('nova.sideBar.section.core') }}
      </v-list-subheader>
      <v-list-group value="securedWan">
        <template #activator="{ props }">
          <v-list-item v-bind="props" :min-height="ListItemMinHeight" :title="t('nova.sideBar.menu.securedWan')">
            <template #prepend>
              <v-icon :icon="`nova:${NavigationGroupIconMap.Core.securedWan}`" size="20" />
            </template>
          </v-list-item>
        </template>
        <v-list-group v-for="group in securedWanGroups" :key="group.value" :value="group.value">
          <template #activator="{ props }">
            <v-list-item v-bind="props" class="px-2" :title="group.title" :min-height="ListItemMinHeight">
              <template v-if="group.icon" #prepend>
                <v-icon :icon="`nova:${group.icon}`" size="20" />
              </template>
            </v-list-item>
          </template>
          <v-list-group v-for="groupInGroups in group.groups" :key="groupInGroups.value" :value="groupInGroups.value">
            <template #activator="{ props }">
              <v-list-item v-bind="props" :title="groupInGroups.title" :min-height="ListItemMinHeight" />
            </template>
            <NovaSideBarListItem v-for="item in groupInGroups.items" :key="item.value" :item="item" />
          </v-list-group>
        </v-list-group>
      </v-list-group>

      <!-- 拡張機能 と その他 -->
      <template v-for="section in sections" :key="section.title">
        <v-list-subheader inset class="subheader text-info px-3 bg-highlight">{{ section.title }}</v-list-subheader>
        <v-list-group v-for="group in section.groups" :key="group.value" :value="group.value">
          <template #activator="{ props }">
            <v-list-item v-bind="props" :title="group.title" :min-height="ListItemMinHeight">
              <template v-if="group.icon" #prepend>
                <v-icon :icon="`nova:${group.icon}`" size="20" />
              </template>
            </v-list-item>
          </template>
          <NovaSideBarListItem v-for="item in group.items" :key="item.value" :item="item" />
        </v-list-group>
      </template>
    </v-list>

    <v-list v-else nav class="px-0">
      <template v-for="group in railGroups" :key="group.value">
        <!-- コア機能：セキュアドWAN -->
        <v-menu
          v-if="group.value === 'securedWan'"
          open-on-hover
          open-on-focus
          location="end"
          transition="slide-x-transition"
          :close-on-content-click="false"
        >
          <template #activator="{ props }">
            <v-list-item v-bind="props" :min-height="ListItemMinHeight" class="rail-item" :aria-label="group.title">
              <v-icon :icon="`nova:${group.icon}`" size="20" />
            </v-list-item>
          </template>
          <v-list
            v-model:opened="securedWanMenuOpen"
            nav
            prepend-gap="6"
            indent="15"
            open-strategy="multiple"
            class="rail-flyout"
          >
            <v-list-subheader inset class="subheader text-info px-3 bg-highlight">
              {{ group.title }}
            </v-list-subheader>
            <v-list-group
              v-for="securedWanGroup in securedWanGroups"
              :key="securedWanGroup.value"
              :value="securedWanGroup.value"
            >
              <template #activator="{ props }">
                <v-list-item v-bind="props" :title="securedWanGroup.title" :min-height="ListItemMinHeight">
                  <template v-if="securedWanGroup.icon" #prepend>
                    <v-icon :icon="`nova:${securedWanGroup.icon}`" size="20" />
                  </template>
                </v-list-item>
              </template>
              <v-list-group
                v-for="groupInGroups in securedWanGroup.groups"
                :key="groupInGroups.value"
                :value="groupInGroups.value"
              >
                <template #activator="{ props }">
                  <v-list-item v-bind="props" :title="groupInGroups.title" :min-height="ListItemMinHeight" />
                </template>
                <NovaSideBarListItem v-for="item in groupInGroups.items" :key="item.value" :item="item" />
              </v-list-group>
            </v-list-group>
          </v-list>
        </v-menu>

        <!-- 拡張機能・その他 -->
        <v-menu
          v-else
          open-on-hover
          open-on-focus
          location="end"
          transition="slide-x-transition"
          :close-on-content-click="false"
        >
          <template #activator="{ props }">
            <v-list-item v-bind="props" :min-height="ListItemMinHeight" class="rail-item" :aria-label="group.title">
              <v-icon :icon="`nova:${group.icon}`" size="20" />
            </v-list-item>
          </template>
          <v-list nav class="rail-flyout">
            <v-list-subheader inset class="subheader text-info px-3 bg-highlight">
              {{ group.title }}
            </v-list-subheader>
            <NovaSideBarListItem v-for="item in items[group.value]" :key="item.value" :item="item" />
          </v-list>
        </v-menu>
      </template>
    </v-list>
  </v-navigation-drawer>
</template>

<style lang="scss" scoped>
.bg-navigation {
  background-color: #f9fafb !important;
}
.subheader {
  min-height: 30px !important;
  border: 1px solid #fff;
}
:deep(.v-list-item-title) {
  white-space: normal !important;
}
:deep(.v-list-item__prepend > .v-icon) {
  opacity: 1;
}
.rotate-180 {
  transform: rotate(180deg);
}
.rail-flyout {
  min-width: 220px;
}
.rail-item {
  justify-content: center;
  margin-bottom: 1rem;
  :deep(.v-list-item__content) {
    display: flex;
    justify-content: center;
  }
}
</style>
