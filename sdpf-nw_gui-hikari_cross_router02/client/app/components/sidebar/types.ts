import type {
  TenantPages,
  MonitoringPages,
  SecurityContractsPages,
  ContractsPages,
  GuaranteePages,
  SupportPages,
  RinkMobilePages,
  IdaasPages,
} from './constants'
import type { IconType } from '@/components/icons/constants'

export type TenantPageType = (typeof TenantPages)[keyof typeof TenantPages]
type MonitoringPageType = (typeof MonitoringPages)[keyof typeof MonitoringPages]
export type SecurityContractsPageType = (typeof SecurityContractsPages)[keyof typeof SecurityContractsPages]
type ContractsPageType = (typeof ContractsPages)[keyof typeof ContractsPages]
type GuaranteePageType = (typeof GuaranteePages)[keyof typeof GuaranteePages]
type SupportPageType = (typeof SupportPages)[keyof typeof SupportPages]
type RinkMobilePageType = (typeof RinkMobilePages)[keyof typeof RinkMobilePages]
type IdaasPageType = (typeof IdaasPages)[keyof typeof IdaasPages]

export type SubMenuType = {
  label: string
  page:
    | MonitoringPageType
    | SecurityContractsPageType
    | ContractsPageType
    | GuaranteePageType
    | SupportPageType
    | RinkMobilePageType
    | IdaasPageType
  start?: 'create'
  query?: { [key: string]: string | string[] }
}

type BaseMenuType = {
  name: string
  icon: IconType
  subMenu?: SubMenuType[]
  subMenuHeight?: number
}
type InternalMenuType = {
  page: Exclude<TenantPageType, typeof TenantPages.BreakOutLists>
  externalLink?: never
}
type ExternalMenuType = {
  externalLink: string
  page: string
}
export type MenuType = BaseMenuType & (InternalMenuType | ExternalMenuType)
