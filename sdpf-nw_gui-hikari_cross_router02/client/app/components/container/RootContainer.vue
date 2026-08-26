<script lang="ts" setup>
import { camelCase } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import { ThreatLevelTypes, TrafficDirectionTypes } from '@/api/threatDetections/constants'
import { ThreatDetectionSharedTerminalDirectionTypes } from '@/api/threatDetectionShared/constants'
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
import type { BreadCrumbsItemType } from '@/components/breadcrumbs/types'

type BreadCrumbType = {
  title: string
  class?: string
  breadcrumbs?: BreadCrumbsItemType[]
}

const RootTypes = {
  Create: 'create', // 新規作成
  Detail: 'id', // 詳細
  Edit: 'edit', // 編集
  Remove: 'remove', // 削除
} as const

const { getQuery } = useSidebar()

const { t } = useI18n()
const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)
const id = computed(() => route.params.id as string)
const currentPage = computed(() => route.path.split('/')[3])
const subMenuPage = computed(() => route.path.split('/')[4])
const lastPage = computed(() => route.path.split('/').at(-1))
const rootType = computed(() => ((route.name as string) ?? '').split('-').at(-1))
const baseUrl = computed(() => `/tenants/${tenantId.value}`)

const news = computed<BreadCrumbType>(() => {
  const newsBaseUrl = `${baseUrl.value}/${TenantPages.News}`
  const breadcrumbs = [{ name: t('sideBar.news'), path: newsBaseUrl }]
  switch (rootType.value) {
    case RootTypes.Detail:
      return {
        title: t('news.detail'),
        class: 'text-4xl',
        breadcrumbs,
      }
    default:
      return { title: t('sideBar.news'), class: 'text-4xl' }
  }
})
const monitoring = computed<BreadCrumbType>(() => {
  const breadcrumbs = [{ name: t('sideBar.monitoring'), path: route.path }]
  switch (subMenuPage.value) {
    case MonitoringPages.Summary:
      return {
        title: `${t('sideBar.monitoring')} ${t('sideBar.summary')}`,
        class: 'text-4xl',
        breadcrumbs,
      }
    case MonitoringPages.OperationStatus: {
      if (!id.value) {
        return { title: t('sideBar.operationStatus'), class: 'text-4xl', breadcrumbs }
      }
      if (lastPage.value === 'self-check') {
        const listPath = route.path.split('/').slice(0, -2).join('/')
        const path = route.path.split('/').slice(0, -1).join('/')
        const detailsBreadcrumbs = [
          ...breadcrumbs,
          { name: t('sideBar.operationStatus'), path: listPath },
          { name: t('sideBar.operationStatusDetails'), path },
        ]
        return {
          title: t('monitorings.selfCheck'),
          class: 'text-4xl',
          breadcrumbs: detailsBreadcrumbs,
        }
      }
      if (lastPage.value === 'fic-routes') {
        const listPath = route.path.split('/').slice(0, -2).join('/')
        const detailsBreadcrumbs = [...breadcrumbs, { name: t('sideBar.operationStatus'), path: listPath }]
        return {
          title: t('monitorings.ficRecieveRoutes'),
          class: 'text-4xl',
          breadcrumbs: detailsBreadcrumbs,
        }
      }
      const path = route.path.split('/').slice(0, -1).join('/')
      const detailsBreadcrumbs = [...breadcrumbs, { name: t('sideBar.operationStatus'), path }]
      return {
        title: t('sideBar.operationStatusDetails'),
        class: 'text-4xl',
        breadcrumbs: detailsBreadcrumbs,
      }
    }
    case MonitoringPages.AlertDetails:
      return { title: t('sideBar.alertDetails'), class: 'text-4xl', breadcrumbs }
    case MonitoringPages.TrafficDetails:
      return { title: t('sideBar.trafficDetails'), class: 'text-4xl', breadcrumbs }
    case MonitoringPages.GuaranteeMaintenance: {
      return {
        title: t('sideBar.guaranteeMaintenance'),
        class: 'text-4xl',
        breadcrumbs,
      }
    }
    default:
      return { title: '' }
  }
})

const securityContracts = computed<BreadCrumbType>(() => {
  const breadcrumbs = [{ name: t('sideBar.securityContracts'), path: route.path }]
  switch (subMenuPage.value) {
    case SecurityContractsPages.Summary:
      return {
        title: t('sideBar.securityContractsSummary'),
        class: 'text-4xl',
        breadcrumbs,
      }
    case SecurityContractsPages.ThreatDetections: {
      if (lastPage.value === 'block') {
        return {
          title: t('sideBar.threatDetectionFilters'),
          class: 'text-4xl',
          breadcrumbs: [
            ...breadcrumbs,
            {
              name: t('sideBar.threatDetections'),
              path: route.path.replace('/block', ''),
              query: {
                threatLevel: [ThreatLevelTypes.Critical, ThreatLevelTypes.High],
                trafficDirection: [TrafficDirectionTypes.Out],
              },
            },
          ],
        }
      }
      return {
        title: t('sideBar.threatDetections'),
        class: 'text-4xl',
        breadcrumbs,
      }
    }
    case SecurityContractsPages.ThreatDetectionFilters:
      return {
        title: t('sideBar.threatDetectionFilters'),
        class: 'text-4xl',
        breadcrumbs,
      }
    case SecurityContractsPages.ThreatDetectionShared: {
      const listPath = route.path.split('/').slice(0, -1).join('/')
      if (!!lastPage.value && ['create-auth-key', 'start-sharing', 'terminals', 'request'].includes(lastPage.value)) {
        const terminalsKey =
          route.query.terminalDirection === ThreatDetectionSharedTerminalDirectionTypes.Provided
            ? 'providedList'
            : 'receivedList'
        const titleKey =
          lastPage.value === 'request'
            ? 'requestConfirmation'
            : lastPage.value === 'terminals'
              ? terminalsKey
              : camelCase(lastPage.value)
        return {
          title: t(`threatDetectionShared.${titleKey}`),
          class: 'text-4xl',
          breadcrumbs: [
            ...breadcrumbs,
            {
              name: t('threatDetectionShared.indexTitle'),
              path: listPath,
            },
          ],
        }
      }

      if (rootType.value === RootTypes.Detail) {
        return {
          title: t('threatDetectionShared.requestDetail'),
          class: 'text-4xl',
          breadcrumbs: [
            ...breadcrumbs,
            {
              name: t('threatDetectionShared.indexTitle'),
              path: listPath,
            },
          ],
        }
      }
      if (lastPage.value === 'threat-detections') {
        return {
          title: t('sideBar.threatDetectionSharedThreatDetections'),
          class: 'text-4xl',
          breadcrumbs,
        }
      }
      return {
        title: t('threatDetectionShared.indexTitle'),
        class: 'text-4xl',
        breadcrumbs,
      }
    }
    case SecurityContractsPages.FlowCollectors:
      return { title: t('sideBar.flowCollectors'), class: 'text-4xl', breadcrumbs }
    case SecurityContractsPages.SecurityHelpDesk: {
      return { title: t('sideBar.securityHelpDesk'), class: 'text-4xl', breadcrumbs }
    }
    default:
      return { title: '' }
  }
})

const vpns = computed<BreadCrumbType>(() => {
  const vnsBaseUrl = `${baseUrl.value}/${TenantPages.Vpns}`
  const breadcrumbs = [
    {
      name: `VPN ${t('common.list')}`,
      path: vnsBaseUrl,
      query: getQuery(TenantPages.Vpns),
    },
  ]
  switch (rootType.value) {
    case RootTypes.Create:
      return {
        title: `VPN ${t('common.createNew')}`,
        class: 'text-4xl',
        breadcrumbs,
      }
    case RootTypes.Detail:
      return {
        title: `VPN ${t('common.detail')}`,
        class: 'text-4xl',
        breadcrumbs,
      }
    case RootTypes.Edit:
      return {
        title: `VPN ${t('common.edit')}`,
        class: 'text-4xl',
        breadcrumbs: [...breadcrumbs, { name: `VPN ${t('common.detail')}`, path: `${vnsBaseUrl}/${id.value}` }],
      }
    default:
      return { title: `VPN ${t('common.list')}`, class: 'text-4xl' }
  }
})

const fic = computed<BreadCrumbType>(() => {
  const ficBaseUrl = `${baseUrl.value}/${TenantPages.Fic}`
  const breadcrumbs = [
    { name: `${t('sideBar.fic')} ${t('common.list')}`, path: ficBaseUrl, query: getQuery(TenantPages.Fic) },
  ]
  switch (rootType.value) {
    case RootTypes.Create:
      return {
        title: `${t('sideBar.fic')} ${t('common.createNew')}`,
        class: 'text-4xl',
        breadcrumbs,
      }
    case RootTypes.Detail:
      return {
        title: `${t('sideBar.fic')} ${t('common.detail')}`,
        class: 'text-4xl',
        breadcrumbs,
      }
    case RootTypes.Edit:
      return {
        title: `${t('sideBar.fic')} ${t('common.edit')}`,
        class: 'text-4xl',
        breadcrumbs: [
          ...breadcrumbs,
          { name: `${t('sideBar.fic')} ${t('common.detail')}`, path: `${ficBaseUrl}/${id.value}` },
        ],
      }
    default:
      return { title: `${t('sideBar.fic')} ${t('common.list')}`, class: 'text-4xl' }
  }
})

const supports = computed<BreadCrumbType>(() => {
  const supportBaseUrl = `${baseUrl.value}/${TenantPages.Supports}/${subMenuPage.value}`
  const breadcrumbs = [{ name: t('sideBar.support'), path: supportBaseUrl }]

  if (lastPage.value === SupportPages.PaidManagedService) {
    return {
      title: t('sideBar.paidManagedService'),
      class: 'text-4xl',
      breadcrumbs,
    }
  }

  switch (rootType.value) {
    case RootTypes.Create:
      return {
        title: `${t('sideBar.phoneTicketingSupport')} ${t('common.createNew')}`,
        class: 'text-4xl',
        breadcrumbs,
      }
    case RootTypes.Edit:
      return {
        title: `${t('sideBar.phoneTicketingSupport')} ${t('common.edit')}`,
        class: 'text-4xl',
        breadcrumbs: [
          ...breadcrumbs,
          { name: `${t('sideBar.support')} ${t('common.detail')}`, path: `${supportBaseUrl}/${id.value}` },
        ],
      }
    case RootTypes.Remove:
      return {
        title: `${t('sideBar.phoneTicketingSupport')} ${t('common.delete')}`,
        class: 'text-4xl',
        breadcrumbs,
      }
    default:
      return { title: t('sideBar.phoneTicketingSupport'), class: 'text-4xl', breadcrumbs }
  }
})

// 契約情報 - 契約者情報
const contractContractor = computed<BreadCrumbType>(() => {
  const contractorUrl = `${baseUrl.value}/${TenantPages.Contracts}/${subMenuPage.value}`
  const breadcrumbs = [{ name: t('sideBar.contractor'), path: contractorUrl }]
  switch (lastPage.value) {
    case RootTypes.Edit:
      return {
        title: `${t('sideBar.contractor')} ${t('common.edit')}`,
        class: 'text-4xl',
        breadcrumbs: [...breadcrumbs, { name: t('sideBar.contractor'), path: contractorUrl }],
      }
    default:
      return { title: t('sideBar.contractor'), class: 'text-4xl', breadcrumbs }
  }
})

// 契約情報 - モバイル情報
const contractMobile = computed<BreadCrumbType>(() => {
  const mobileUrl = `${baseUrl.value}/${TenantPages.Contracts}/${subMenuPage.value}`
  const breadcrumbs = [{ name: t('sideBar.contractor'), path: mobileUrl }]
  switch (lastPage.value) {
    case 'mobile-terms-of-service':
      return {
        title: t('mobile.mobileTermsOfService'),
        class: 'text-4xl',
        breadcrumbs: [...breadcrumbs, { name: t('sideBar.mobile'), path: mobileUrl }],
      }
    case RootTypes.Edit:
      return {
        title: t('mobile.update'),
        class: 'text-4xl',
        breadcrumbs: [...breadcrumbs, { name: t('sideBar.mobile'), path: mobileUrl }],
      }
    default:
      return { title: t('sideBar.mobile'), class: 'text-4xl', breadcrumbs }
  }
})

// 契約情報
const contracts = computed<BreadCrumbType>(() => {
  const contractsBaseUrl = `${baseUrl.value}/${TenantPages.Contracts}`
  const breadcrumbs = [{ name: t('sideBar.contractor'), path: `${contractsBaseUrl}/${subMenuPage.value}` }]
  switch (subMenuPage.value) {
    case ContractsPages.Contractor:
      return contractContractor.value
    case ContractsPages.Mobile:
      return contractMobile.value
    case ContractsPages.TrafficMonitoring:
      return {
        title: t('sideBar.trafficMonitoring'),
        class: 'text-4xl',
        breadcrumbs,
      }
    case ContractsPages.GuaranteeTermsOfService:
      return {
        title: t('sideBar.addressSearchTermsOfService'),
        class: 'text-4xl',
        breadcrumbs,
      }
    case ContractsPages.SecurityTrafficReportFlowAnalyzer:
      return {
        title: t('sideBar.securityTrafficReportFlowAnalyzerTermsOfService'),
        class: 'text-3xl',
        breadcrumbs,
      }

    default:
      return { title: '' }
  }
})

const ipoes = computed<BreadCrumbType>(() => {
  const listName = `${t('sideBar.ipoes')} ${t('common.list')}`
  const detailName = `${t('sideBar.ipoes')} ${t('common.detail')}`
  const circuitBaseUrl = `${baseUrl.value}/${TenantPages.Ipoes}`
  const breadcrumbs = [{ name: listName, path: circuitBaseUrl, query: getQuery(TenantPages.Ipoes) }]
  const detailPath = {
    name: detailName,
    path: `${circuitBaseUrl}/${id.value}`,
  }
  switch (rootType.value) {
    case RootTypes.Create:
      return {
        title: `${t('sideBar.ipoes')} ${t('common.createNew')}`,
        class: 'text-4xl',
        breadcrumbs,
      }
    case RootTypes.Detail:
      return {
        title: detailName,
        class: 'text-4xl',
        breadcrumbs,
      }
    case RootTypes.Edit:
      return {
        title: `${t('sideBar.ipoes')} ${t('common.edit')}`,
        class: 'text-4xl',
        breadcrumbs: [...breadcrumbs, detailPath],
      }
    case RootTypes.Remove:
      return {
        title: `${t('sideBar.ipoes')} ${t('common.abolition')}`,
        class: 'text-4xl',
        breadcrumbs: [...breadcrumbs, detailPath],
      }
    case 'diversion':
      return {
        title: `${t('sideBar.ipoes')} ${t('ipoes.diversionApplication')}`,
        class: 'text-4xl',
        breadcrumbs: [...breadcrumbs, detailPath],
      }
    default:
      return { title: listName, class: 'text-4xl' }
  }
})

const terminals = computed<BreadCrumbType>(() => {
  const breadcrumbs = [
    {
      name: `${t('sideBar.terminal')} ${t('common.list')}`,
      path: `${baseUrl.value}/${TenantPages.Terminals}`,
      query: getQuery(TenantPages.Terminals),
    },
  ]
  const detailPath = {
    name: `${t('sideBar.terminal')} ${t('common.detail')}`,
    path: `${baseUrl.value}/${currentPage.value}/${id.value}`,
  }
  switch (rootType.value) {
    case RootTypes.Create:
      return {
        title: `${t('sideBar.terminal')} ${t('common.createNew')}`,
        class: 'text-4xl',
        breadcrumbs,
      }
    case 'bulk':
      if ((route.name as string).split('-').at(3) === 'create') {
        return {
          title: `${t('terminals.createBulk')}`,
          class: 'text-4xl',
          breadcrumbs,
        }
      } else {
        return {
          title: `${t('terminals.editBulk')}`,
          class: 'text-4xl',
          breadcrumbs,
        }
      }
    case RootTypes.Detail:
      return {
        title: `${t('sideBar.terminal')} ${t('common.detail')}`,
        class: 'text-4xl',
        breadcrumbs,
      }
    case RootTypes.Edit:
      return {
        title: `${t('sideBar.terminal')} ${t('common.edit')}`,
        class: 'text-4xl',
        breadcrumbs: [...breadcrumbs, detailPath],
      }
    case RootTypes.Remove:
      return {
        title: `${t('sideBar.terminal')} ${t('common.abolition')}`,
        class: 'text-4xl',
        breadcrumbs: [...breadcrumbs, detailPath],
      }
    default:
      return { title: `${t('sideBar.terminal')} ${t('common.list')}`, class: 'text-4xl' }
  }
})

// ファームウェア一括更新
const firmwareUpdateBulk = computed<BreadCrumbType>(() => ({
  title: `${t('terminals.firmwareUpdateBulk')}`,
  class: 'text-4xl',
  breadcrumbs: [
    {
      name: `${t('sideBar.terminal')} ${t('common.list')}`,
      path: `${baseUrl.value}/${TenantPages.Terminals}`,
      query: getQuery(TenantPages.Terminals),
    },
  ],
}))

// 特定通信ブレイクアウト
const breakOutLists = computed<BreadCrumbType>(() => {
  const breadcrumbs = [
    {
      name: `${t('sideBar.terminal')} ${t('common.list')}`,
      path: `${baseUrl.value}/${TenantPages.Terminals}`,
      query: getQuery(TenantPages.Terminals),
    },
    {
      name: `${t('breakOut.title')} ${t('common.list')}`,
      path: `${baseUrl.value}/${TenantPages.BreakOutLists}`,
      query: getQuery(TenantPages.BreakOutLists),
    },
  ]
  const detailPath = {
    name: `${t('breakOut.title')} ${t('common.detail')}`,
    path: `${baseUrl.value}/${TenantPages.BreakOutLists}/${id.value}`,
  }

  switch (rootType.value) {
    case RootTypes.Create:
      return {
        title: `${t('breakOut.title')} ${t('common.createNew')}`,
        class: 'text-4xl',
        breadcrumbs,
      }
    case RootTypes.Detail:
      return {
        title: `${t('breakOut.title')} ${t('common.detail')}`,
        class: 'text-4xl',
        breadcrumbs,
      }
    case RootTypes.Edit:
      return {
        title: `${t('breakOut.title')} ${t('common.edit')}`,
        class: 'text-4xl',
        breadcrumbs: [...breadcrumbs, detailPath],
      }
    case RootTypes.Remove:
      return {
        title: `${t('breakOut.title')} ${t('common.abolition')}`,
        class: 'text-4xl',
        breadcrumbs: [...breadcrumbs, detailPath],
      }
    default:
      return {
        title: `${t('breakOut.title')} ${t('common.list')}`,
        class: 'text-4xl',
        breadcrumbs: [breadcrumbs[0]!],
      }
  }
})

// ギャランティアクセス
const guaranteeCircuits = computed<BreadCrumbType>(() => {
  const guaranteeCircuitsBaseUrl = `${baseUrl.value}/${TenantPages.Guarantees}/${subMenuPage.value}`
  const breadcrumbs = [
    {
      name: `${t('sideBar.guarantee')} ${t('common.list')}`,
      path: guaranteeCircuitsBaseUrl,
      query: getQuery(TenantPages.Guarantees),
    },
  ]
  const detailPath = {
    name: `${t('sideBar.guarantee')} ${t('common.detail')}`,
    path: `${guaranteeCircuitsBaseUrl}/${id.value}`,
  }
  switch (rootType.value) {
    case RootTypes.Create:
      return {
        title: `${t('sideBar.guarantee')} ${t('common.createNew')}`,
        class: 'text-4xl',
        breadcrumbs,
      }
    case RootTypes.Detail:
      return {
        title: `${t('sideBar.guarantee')} ${t('common.detail')}`,
        class: 'text-4xl',
        breadcrumbs,
      }
    case RootTypes.Edit:
      return {
        title: `${t('sideBar.guarantee')} ${t('common.edit')}`,
        class: 'text-4xl',
        breadcrumbs: [...breadcrumbs, detailPath],
      }
    case RootTypes.Remove:
      return {
        title: `${t('sideBar.guarantee')} ${t('common.abolition')}`,
        class: 'text-4xl',
        breadcrumbs: [...breadcrumbs, detailPath],
      }
    default:
      return {
        title: `${t('sideBar.guarantee')} ${t('common.list')}`,
        class: 'text-4xl',
      }
  }
})

const guarantees = computed<BreadCrumbType>(() => {
  const breadcrumbs = [{ name: t('sideBar.guarantee'), path: route.path }]
  switch (subMenuPage.value) {
    case GuaranteePages.Circuits:
      return { ...guaranteeCircuits.value, breadcrumbs: breadcrumbs.concat(guaranteeCircuits.value?.breadcrumbs ?? []) }
    case GuaranteePages.AddressRegistrationRequest:
      return {
        title: t('sideBar.addressRegistrationRequest'),
        class: 'text-4xl',
        breadcrumbs,
      }
    default:
      return { title: '' }
  }
})

const orders = computed<BreadCrumbType>(() => {
  const orderBaseUrl = `${baseUrl.value}/${TenantPages.Orders}`
  const breadcrumbs = [{ name: t('sideBar.orders'), path: orderBaseUrl }]
  switch (rootType.value) {
    case RootTypes.Detail:
      return {
        title: t('orders.detail'),
        class: 'text-4xl',
        breadcrumbs,
      }
    case RootTypes.Edit:
      return {
        title: t('orders.update'),
        class: 'text-4xl',
        breadcrumbs: [...breadcrumbs, { name: t('orders.detail'), path: `${orderBaseUrl}/${id.value}` }],
      }
    default:
      return { title: t('sideBar.orders'), class: 'text-4xl' }
  }
})

const quickSetup = computed<BreadCrumbType>(() => ({
  title: `${t('sideBar.quickSetup')}`,
  class: 'text-4xl',
}))

// モバイルアクセス - 契約情報
const rinkMobileContracts = (url: string, breadcrumbs: BreadCrumbsItemType[]) => {
  const subMenuName = t('service.rinkContracts')

  // 詳細画面
  if (rootType.value === RootTypes.Detail) {
    return {
      title: `${subMenuName} ${t('common.detail')}`,
      class: 'text-4xl',
      breadcrumbs: [
        ...breadcrumbs,
        {
          name: `${subMenuName} ${t('common.list')}`,
          path: url,
        },
      ],
    }
  }
  // 一覧画面
  return {
    title: `${subMenuName} ${t('common.list')}`,
    class: 'text-4xl',
    breadcrumbs: [breadcrumbs[0]!],
  }
}

// モバイルアクセス - 設備申込と回線申し込み
const rinkMobileConnectionAndLines = (
  menuName: 'rinkConnections' | 'rinkLines',
  url: string,
  breadcrumbs: BreadCrumbsItemType[],
) => {
  const subMenuName = t(`service.${menuName}`)
  breadcrumbs.push({
    name: t(`sideBar.${menuName}`),
    path: url,
  })

  switch (rootType.value) {
    case RootTypes.Create:
      return {
        title: `${subMenuName}${menuName === 'rinkLines' ? t('common.newApplication') : t('common.createNew')}`,
        class: 'text-4xl',
        breadcrumbs,
      }
    case RootTypes.Edit:
      return {
        title: `${subMenuName}${t('common.edit')}`,
        class: 'text-4xl',
        breadcrumbs,
      }
    case RootTypes.Remove:
      return {
        title: `${subMenuName}${t('common.delete')}`,
        class: 'text-4xl',
        breadcrumbs,
      }
    default:
      return {
        title: t(`sideBar.${menuName}`),
        class: 'text-4xl',
        breadcrumbs: [breadcrumbs[0]!],
      }
  }
}
// モバイルアクセス - 容量シェアグループ
const rinkMobileLineGroups = (url: string, breadcrumbs: BreadCrumbsItemType[], rinkMobileId?: string) => {
  const subMenuName = t('service.rinkLineGroups')

  const nextBreadcrumbs = [
    ...breadcrumbs,
    {
      name: t('sideBar.rinkLines'),
      path: `${baseUrl.value}/${TenantPages.RinkMobile}/${RinkMobilePages.Lines}`,
    },
    {
      name: `${subMenuName} ${t('common.list')}`,
      path: url,
      ...(rinkMobileId ? { query: { rinkMobileId } } : {}),
    },
  ]

  switch (rootType.value) {
    case RootTypes.Create:
      return {
        title: `${subMenuName}${t('common.createNew')}`,
        class: 'text-4xl',
        breadcrumbs: nextBreadcrumbs,
      }
    case 'lines': {
      return {
        title: lastPage.value === 'add-lines' ? t('rinkLineGroups.addLine') : t('rinkLineGroups.deleteLine'),
        class: 'text-4xl',
        breadcrumbs: nextBreadcrumbs,
      }
    }
    default:
      return {
        title: `${subMenuName} ${t('common.list')}`,
        class: 'text-4xl',
        breadcrumbs: [
          ...breadcrumbs,
          {
            name: t('sideBar.rinkLines'),
            path: `${baseUrl.value}/${TenantPages.RinkMobile}/${RinkMobilePages.Lines}`,
          },
        ],
      }
  }
}

const rinkMobile = computed<BreadCrumbType>(() => {
  const rinkMobileId = route.query.rinkMobileId as string | undefined
  const rinkMobileBaseUrl = `${baseUrl.value}/${TenantPages.RinkMobile}/${subMenuPage.value}`
  const breadcrumbs = [{ name: t('sideBar.rinkMobile'), path: route.path }]

  switch (subMenuPage.value) {
    case RinkMobilePages.Contracts:
      return rinkMobileContracts(rinkMobileBaseUrl, breadcrumbs)
    case RinkMobilePages.Connections:
      return rinkMobileConnectionAndLines('rinkConnections', rinkMobileBaseUrl, breadcrumbs)
    case RinkMobilePages.Lines:
      return rinkMobileConnectionAndLines('rinkLines', rinkMobileBaseUrl, breadcrumbs)
    case RinkMobilePages.Devices:
      return {
        title: t('sideBar.rinkDevices'),
        class: 'text-4xl',
        breadcrumbs: [breadcrumbs[0]!],
      }
    default:
      return rinkMobileLineGroups(rinkMobileBaseUrl, breadcrumbs, rinkMobileId)
  }
})

const idaas = computed<BreadCrumbType>(() => {
  const breadcrumbs = [{ name: t('sideBar.idaas'), path: route.path }]
  switch (subMenuPage.value) {
    case IdaasPages.AuthenticationRiskReports:
      return {
        title: t('idaas.authenticationRiskReports'),
        class: 'text-4xl',
        breadcrumbs,
      }
    case IdaasPages.APIKey:
      return {
        title: t('idaas.apiKey'),
        class: 'text-4xl',
        breadcrumbs,
      }
    default:
      return { title: '' }
  }
})

const msb = computed<BreadCrumbType>(() => {
  const msbBaseUrl = `${baseUrl.value}/${TenantPages.Msb}`
  const breadcrumbs = [
    {
      name: t('sideBar.mySecureBusinesses'),
      path: msbBaseUrl,
      query: getQuery(TenantPages.Msb),
    },
  ]
  switch (subMenuPage.value) {
    case RootTypes.Create:
      return {
        title: `${t('sideBar.mySecureBusinesses')} ${t('common.createNew')}`,
        class: 'text-4xl',
        breadcrumbs,
      }
    case RootTypes.Edit:
      return {
        title: `${t('sideBar.mySecureBusinesses')} ${t('msb.editApplication')}`,
        class: 'text-4xl',
        breadcrumbs: breadcrumbs,
      }
    case RootTypes.Remove:
      return {
        title: `${t('sideBar.mySecureBusinesses')} ${t('common.delete')}`,
        class: 'text-4xl',
        breadcrumbs,
      }
    default:
      return { title: t('sideBar.mySecureBusinesses'), class: 'text-4xl' }
  }
})
const root = computed(() => {
  switch (currentPage.value) {
    case TenantPages.News:
      return news.value
    case TenantPages.Monitoring:
      return monitoring.value
    case TenantPages.SecurityContracts:
      return securityContracts.value
    case TenantPages.Vpns:
      return vpns.value
    case TenantPages.Fic:
      return fic.value
    case TenantPages.Supports:
      return supports.value
    case TenantPages.Contracts:
      return contracts.value
    case TenantPages.Ipoes:
      return ipoes.value
    case TenantPages.Terminals:
    case TenantPages.SelfTerminals:
      return terminals.value
    case TenantPages.FirmwareUpdateBulk:
      return firmwareUpdateBulk.value
    case TenantPages.BreakOutLists:
      return breakOutLists.value
    case TenantPages.Guarantees:
      return guarantees.value
    case TenantPages.Orders:
      return orders.value
    case TenantPages.QuickSetup:
      return quickSetup.value
    case TenantPages.RinkMobile:
      return rinkMobile.value
    case TenantPages.Idaas:
      return idaas.value
    case TenantPages.Msb:
      return msb.value
    default:
      return { title: '' }
  }
})

const headerRef = ref<HTMLElement | null>(null)
const headerHeight = ref('88px')
watch([root, headerRef], async () => {
  await nextTick()
  headerHeight.value = `${headerRef.value?.offsetHeight ?? 88}px`
})
</script>

<template>
  <div class="container">
    <span class="left-corner" />
    <span class="right-corner" />
    <div ref="headerRef" class="header d-flex">
      <div class="header-title flex-grow-1">
        <RootBreadcrumbs class="mb-2" :items="root?.breadcrumbs ?? []" :current-name="root.title" />
        <div class="font-weight-bold text-pre-wrap" :class="root.class">{{ root.title }}</div>
      </div>
    </div>
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
$border-radius: v.$container-border-radius;
$min-width: v.$container-min-width;
$header-height: v-bind(headerHeight);
$padding: 3rem;
$bg-color: rgb(var(--v-theme-highlight));

.container {
  position: relative;
  padding: $padding * 1.5 $padding $padding * 0.9 0;
  min-width: $min-width;
  .header {
    box-sizing: border-box;
    margin: 0 auto;
    width: calc(100% - $padding * 2);
    border-radius: $border-radius;
    box-shadow: 0 0.5rem 0 $padding $bg-color;
    color: $bg-color;
    .header-title {
      padding: 1.5rem;
    }
  }
  .content {
    padding: $padding * 0.3 $padding $padding * 0.6;
    border-radius: 0 0 $border-radius $border-radius;
    min-height: calc(100% - $header-height - 2rem);
    background-color: $bg-color;
  }
  .corner {
    position: absolute;
    display: block;
    top: 2rem;
    width: 70px;
    height: 70px;
    background-color: $bg-color;
  }

  .left-corner {
    @extend .corner;
    left: 0;
    border-top-left-radius: $border-radius;
    border-bottom-right-radius: 70px;
  }
  .right-corner {
    @extend .corner;
    right: 3rem;
    border-top-right-radius: $border-radius;
    border-bottom-left-radius: 70px;
  }
}
</style>
