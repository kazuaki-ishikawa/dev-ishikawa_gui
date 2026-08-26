<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { ThreatLevelTypes, TrafficDirectionTypes } from '@/api/threatDetections/constants'
import { IconTypes } from '@/components/icons/constants'
import {
  TenantPages,
  MonitoringPages,
  SecurityContractsPages,
  ContractsPages,
  GuaranteePages,
  SupportPages,
  RinkMobilePages,
  IdaasPages,
} from '@/components/sidebar/constants'
import type { SubMenuType, MenuType } from '@/components/sidebar/types'

const MENU_HEIGHT = {
  NUMBER: 58, // メニュー1つ分の高さ(px)
  STRING: '58px',
}

const openSubMenu = ref('')

const { t } = useI18n()
const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)
const currentSubPage = computed(() => {
  const subPage = route.path.split('/')[4]
  switch (subPage) {
    case RinkMobilePages.LineGroups:
      return RinkMobilePages.Lines
    case SecurityContractsPages.ThreatDetectionShared:
      return (route.name as string).lastIndexOf(SecurityContractsPages.ThreatDetectionSharedThreatDetections) < 0
        ? SecurityContractsPages.ThreatDetectionShared
        : SecurityContractsPages.ThreatDetectionSharedThreatDetections
    default:
      return subPage
  }
})

const { showMsbMenu } = useAPI()
const { getQuery } = useSidebar()

const contractorSubMenu = computed<SubMenuType[]>(() => [
  { label: t('sideBar.contractor'), page: ContractsPages.Contractor },
  { label: t('sideBar.mobile'), page: ContractsPages.Mobile },
  { label: t('sideBar.trafficMonitoring'), page: ContractsPages.TrafficMonitoring },
  { label: t('sideBar.addressSearchTermsOfService'), page: ContractsPages.GuaranteeTermsOfService },
  {
    label: t('sideBar.securityTrafficReportFlowAnalyzerTermsOfService'),
    page: ContractsPages.SecurityTrafficReportFlowAnalyzer,
  },
])

const msbMenuList = computed<MenuType[]>(() =>
  showMsbMenu.value
    ? [
        {
          name: t('sideBar.mySecureBusinesses'),
          icon: IconTypes.Comments,
          page: TenantPages.Msb,
        },
      ]
    : [],
)
const menuList = computed<MenuType[]>(() => [
  {
    name: t('sideBar.monitoring'),
    icon: IconTypes.Monitoring,
    page: TenantPages.Monitoring,
    subMenu: [
      { label: t('sideBar.summary'), page: MonitoringPages.Summary },
      { label: t('sideBar.operationStatus'), page: MonitoringPages.OperationStatus },
      { label: t('sideBar.alertDetails'), page: MonitoringPages.AlertDetails },
      { label: t('sideBar.trafficDetails'), page: MonitoringPages.TrafficDetails },
      { label: t('sideBar.guaranteeMaintenance'), page: MonitoringPages.GuaranteeMaintenance },
    ],
  },
  {
    name: t('sideBar.securityContracts'),
    icon: IconTypes.Monitoring, // TODO アイコン変更
    page: TenantPages.SecurityContracts,
    subMenu: [
      { label: t('sideBar.securityContractsSummary'), page: SecurityContractsPages.Summary },
      {
        label: t('sideBar.threatDetections'),
        page: SecurityContractsPages.ThreatDetections,
        query: {
          threatLevel: [ThreatLevelTypes.Critical, ThreatLevelTypes.High],
          trafficDirection: TrafficDirectionTypes.Out,
        },
      },
      { label: t('sideBar.threatDetectionFilters'), page: SecurityContractsPages.ThreatDetectionFilters },
      {
        label: t('sideBar.threatDetectionSharedThreatDetections'),
        page: SecurityContractsPages.ThreatDetectionSharedThreatDetections,
        query: {
          threatLevel: [ThreatLevelTypes.Critical, ThreatLevelTypes.High],
          trafficDirection: TrafficDirectionTypes.Out,
        },
      },
      { label: t('sideBar.threatDetectionShared'), page: SecurityContractsPages.ThreatDetectionShared },
      { label: t('sideBar.flowCollectors'), page: SecurityContractsPages.FlowCollectors },
      { label: t('sideBar.securityHelpDesk'), page: SecurityContractsPages.SecurityHelpDesk },
    ],
  },
  {
    name: t('sideBar.news'),
    icon: IconTypes.News,
    page: TenantPages.News,
  },
  {
    name: t('sideBar.terminalWithLineBreak'),
    icon: IconTypes.Terminal,
    page: TenantPages.Terminals,
  },
  {
    name: t('sideBar.guarantee'),
    icon: IconTypes.Guarantee,
    page: TenantPages.Guarantees,
    subMenu: [
      { label: t('sideBar.circuit'), page: GuaranteePages.Circuits, query: getQuery(TenantPages.Guarantees) },
      {
        label: t('sideBar.addressRegistrationRequest'),
        page: GuaranteePages.AddressRegistrationRequest,
      },
    ],
  },
  {
    name: t('sideBar.ipoesWithLineBreak'),
    icon: IconTypes.Ipoe,
    page: TenantPages.Ipoes,
  },
  {
    name: t('sideBar.rinkMobile'),
    icon: IconTypes.Sim,
    page: TenantPages.RinkMobile,
    subMenu: [
      { label: t('sideBar.rinkContracts'), page: RinkMobilePages.Contracts },
      { label: t('sideBar.rinkConnections'), page: RinkMobilePages.Connections },
      { label: t('sideBar.rinkLines'), page: RinkMobilePages.Lines },
      { label: t('sideBar.rinkDevices'), page: RinkMobilePages.Devices, start: 'create' as const },
    ],
  },
  {
    name: 'VPN',
    icon: IconTypes.Vpn,
    page: TenantPages.Vpns,
  },
  {
    name: t('sideBar.fic'),
    icon: IconTypes.Fic,
    page: TenantPages.Fic,
  },
  {
    name: t('sideBar.idaas'),
    icon: IconTypes.Comments,
    page: TenantPages.Idaas,
    subMenu: [
      { label: t('idaas.authenticationRiskReports'), page: IdaasPages.AuthenticationRiskReports },
      { label: t('idaas.apiKey'), page: IdaasPages.APIKey },
    ],
  },
  // EDRライト
  ...msbMenuList.value,
  {
    name: t('sideBar.support'),
    icon: IconTypes.Support,
    page: TenantPages.Supports,
    subMenu: [
      { label: t('sideBar.phoneTicketingSupport'), page: SupportPages.PhoneTicketingSupport },
      { label: t('sideBar.paidManagedService'), page: SupportPages.PaidManagedService },
    ],
  },
  {
    name: t('sideBar.contractor'),
    icon: IconTypes.Contractor,
    page: TenantPages.Contracts,
    subMenu: contractorSubMenu.value,
    subMenuHeight: 300,
  },
  {
    name: t('sideBar.orders'),
    icon: IconTypes.Order,
    page: TenantPages.Orders,
  },
  {
    name: t('sideBar.quickSetup'),
    icon: IconTypes.QuickSetup,
    page: TenantPages.QuickSetup,
  },
  {
    name: t('sideBar.networkCentralizedMaintenanceLight'),
    icon: IconTypes.Support, // TODO: 17125 アイコン変更
    page: 'network-centralized-maintenance-light',
    externalLink: 'https://console-uniop.sdpf.ntt.com/',
  },
])

const currentPage = computed(() => {
  const split = route.path.split('/')[3] ?? ''
  const page = [TenantPages.FirmwareUpdateBulk, TenantPages.BreakOutLists, TenantPages.SelfTerminals].includes(split)
    ? TenantPages.Terminals
    : split
  const foundIndex = menuList.value.findIndex(menu => menu.page === page)

  // corner の top 値を計算
  const title = 16 * 3 + 50 // タイトル部分の高さ
  const top = title + 38 + MENU_HEIGHT.NUMBER * (0 <= foundIndex ? foundIndex - 1 : 0)
  const bottom = title + MENU_HEIGHT.NUMBER + MENU_HEIGHT.NUMBER * (0 <= foundIndex ? foundIndex : 0)

  return { page, topTop: `${top}px`, bottomTop: `${bottom}px` }
})

const getSubMenuTop = (index: number, height?: number) => {
  // subMenu のstyle調整
  const subMenuTop = 27.5 * 6 + MENU_HEIGHT.NUMBER * (index - 1)
  return `${height ? subMenuTop - height / 3 : subMenuTop}px`
}

const handleMenuClick = async (menu: MenuType) => {
  if ('externalLink' in menu) {
    await navigateTo(menu.externalLink, {
      external: true,
      open: { target: '_blank', windowFeatures: { noopener: true, noreferrer: true } },
    })
    openSubMenu.value = ''
    return
  }

  const query = getQuery(menu.page)

  if (!menu.subMenu) {
    await navigateTo({ path: `/tenants/${tenantId.value}/${menu.page}`, query })
    openSubMenu.value = ''
  } else {
    openSubMenu.value = openSubMenu.value === menu.page ? '' : menu.page
  }
}

useMouseEventListener('click', () => {
  if (openSubMenu.value) {
    openSubMenu.value = ''
  }
})
</script>

<template>
  <div class="position-relative">
    <div class="sidebar">
      <div class="my-4 flex-start-center">
        <div class="text-headline-small pb-4 b-b-white">docomo business RINK</div>
      </div>
      <div
        v-for="(menu, index) in menuList"
        :key="menu.page"
        :class="{ menu: true, active: menu.page === currentPage.page }"
        @click.stop="() => handleMenuClick(menu)"
      >
        <div class="label">
          <div class="item flex-flex-start-center cursor-pointer">
            <SvgIcon :color="menu.page === currentPage.page ? 'secondary' : undefined" :type="menu.icon" />
            <div v-if="menu?.subMenu" class="mx-2">{{ menu.name }}</div>
            <div
              v-else
              :class="`${menu.page === currentPage.page ? 'text-secondary' : 'text-white'}`"
              class="mx-2 text-pre-wrap"
            >
              {{ menu.name }}
            </div>
            <SvgIcon
              v-if="!!menu?.subMenu"
              class="pt-1 pl-2"
              size="xSmall"
              :type="IconTypes.CaretRight"
              :color="menu.page === currentPage.page ? 'secondary' : undefined"
            />
          </div>
          <svg
            v-if="openSubMenu === menu.page"
            class="arrow-open ml-auto"
            width="14"
            height="20"
            viewBox="0 0 14 20"
            aria-hidden="true"
          >
            <polygon points="14,0 0,10 14,20" fill="currentColor" />
          </svg>
          <div
            v-if="!!menu?.subMenu && openSubMenu === menu.page"
            :class="`sub-menu-${menu.page}`"
            :style="{ top: getSubMenuTop(index, menu.subMenuHeight) }"
          >
            <NuxtLink
              v-for="subMenu in menu.subMenu"
              :key="subMenu.page"
              :to="{
                name: `tenants-tenantId-${menu.page}-${subMenu.page}${subMenu.start ? '-' + subMenu.start : ''}`,
                params: { tenantId },
                query: subMenu?.query,
              }"
              :class="`box ${currentSubPage === subMenu.page ? 'active' : ''}`"
            >
              {{ subMenu.label }}
            </NuxtLink>
          </div>
        </div>
      </div>
      <span :class="`corner-top-${currentPage.page}`" :style="{ top: currentPage.topTop }" />
      <span :class="`corner-bottom-${currentPage.page}`" :style="{ top: currentPage.bottomTop }" />
    </div>
  </div>
</template>

<style scoped lang="scss">
$shadow-params: 0.15rem 0.15rem 0.15rem rgb(var(--v-theme-light-info)); // 影 (drop-shadow, box-shadow) のパラメーター
$menu-list:
  'monitoring' 0.6,
  'security-contracts' 0.8,
  'news' 0.5,
  'terminals' 0.5,
  'guarantees' 0.5,
  'ipoes' 0.5,
  'rink-mobile' 0.5,
  'vpns' 0.5,
  'fic-connections' 0.5,
  'idaas' 0.6,
  'msb' 0.5,
  'supports' 0.7,
  'contracts' 0.75,
  'orders' 0.5,
  'quick-setup' 0.5;
$active-bg-color: rgb(var(--v-theme-highlight));
$open-bg-color: #e4eaef;
$active-color: rgb(var(--v-theme-secondary));
$sub-active-bg-color: rgb(var(--v-theme-primary));
$menu-height: v-bind('MENU_HEIGHT.STRING');
$min-height: v.$sidebar-min-height;

.b-b-white {
  border-bottom: 2px solid #fff;
}

.sidebar {
  position: sticky;
  position: -webkit-sticky;
  top: 0;
  z-index: v.$sidebar-z-index;
  color: #fff;
  padding: 1rem 0 2rem 2rem;
  user-select: none;
  min-height: $min-height;

  .arrow-open {
    display: inline-block;
    color: $open-bg-color; /* SVGのcurrentColorで塗る */
    filter: drop-shadow($shadow-params);
    position: relative;
    z-index: v.$sidebar-z-index;
    margin-right: -2px;
  }

  .menu {
    font-size: 16px;
    font-weight: bold;
    height: $menu-height;
    padding-left: 2rem;
    &.active {
      border-top-left-radius: 2rem;
      border-bottom-left-radius: 2rem;
      color: $active-color;
      background-color: $active-bg-color;
    }
    .item {
      width: 250px;
      &:hover {
        opacity: 0.8;
      }
    }
    .label {
      height: 95%;
      display: flex;
      align-items: center;
    }
  }

  .corner {
    display: block;
    width: 20px;
    height: 20px;
    position: absolute;
    left: v.$sidebar-width;
    transform: translateX(-100%);
    &::before {
      display: block;
      width: 200%;
      height: 200%;
      position: absolute;
      top: 0px;
      left: 0px;
      overflow: hidden;
      content: '';
      border-radius: 50%;
      box-shadow: 20px 20px 0 0px $active-bg-color;
    }
  }

  .sub-menu {
    font-size: 0.75rem;
    font-weight: 100;
    position: absolute;
    left: v.$sidebar-width;
    box-shadow: $shadow-params;
    border-radius: 0.5rem;
    background-color: $open-bg-color;
    color: $active-color;
    padding: 0.5rem;
    z-index: v.$sidebar-z-index + 1; /* sidebar より前面にする */
    .box {
      display: block;
      width: calc(100% - 1rem);
      padding: 0.5rem 0.5rem 0.6rem;
      border-radius: 0.5rem;
      text-decoration: none;
      &.active {
        background-color: $sub-active-bg-color;
        color: $active-bg-color;
      }
    }
  }

  @each $menu, $w in $menu-list {
    .corner-top-#{$menu} {
      @extend .corner;
      &::before {
        transform: translate(-50%, -50%);
      }
    }
    .corner-bottom-#{$menu} {
      @extend .corner;
      &::before {
        transform: translate(-50%, 0%) rotate(270deg);
      }
    }
    .sub-menu-#{$menu} {
      @extend .sub-menu;
      width: calc(v.$sidebar-width * $w);
    }
  }
}
</style>
