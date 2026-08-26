import { defineComponent, h } from 'vue'
import type { Component, PropType } from 'vue'
import type { IconSet } from 'vuetify'
import { NovaIconTypes, type NovaIconType } from '@/components/icons/constants'
import AccessMobileIcon from '~icons/nova/access-mobile'
import AccessSiteIcon from '~icons/nova/access-site'
import AlertCircleIcon from '~icons/nova/alert-circle'
import AlertTriangleIcon from '~icons/nova/alert-triangle'
import ArrowLeftDoubleIcon from '~icons/nova/arrow-left-double'
import CheckIcon from '~icons/nova/check'
import ChevronLeftIcon from '~icons/nova/chevron-left'
import ChevronLeftDoubleIcon from '~icons/nova/chevron-left-double'
import ChevronRightIcon from '~icons/nova/chevron-right'
import ChevronRightDoubleIcon from '~icons/nova/chevron-right-double'
import ClockIcon from '~icons/nova/clock'
import CloseCircleIcon from '~icons/nova/close-circle'
import ContractIcon from '~icons/nova/contract'
import DownloadIcon from '~icons/nova/download'
import EditIcon from '~icons/nova/edit'
import EdrIcon from '~icons/nova/edr'
import EyeOffIcon from '~icons/nova/eye-off'
import EyeIcon from '~icons/nova/eye'
import GlobalConnectIcon from '~icons/nova/global-connect'
import HelpCircleIcon from '~icons/nova/help-circle'
import HelpIcon from '~icons/nova/help'
import HomeIcon from '~icons/nova/home'
import IdaasIcon from '~icons/nova/idaas'
import InformationIcon from '~icons/nova/information'
import InterconnectIcon from '~icons/nova/interconnect'
import InternetGatewayIcon from '~icons/nova/internet-gateway'
import LanSecurityIcon from '~icons/nova/lan-security'
import LockIcon from '~icons/nova/lock'
import MaintenanceIcon from '~icons/nova/maintenance'
import NotificationIcon from '~icons/nova/notification'
import OrderHistoryIcon from '~icons/nova/order-history'
import RemoteAccessIcon from '~icons/nova/remote-access'
import SatelliteConnectIcon from '~icons/nova/satellite-connect'
import SearchIcon from '~icons/nova/search'
import SecuredWanIcon from '~icons/nova/secured-wan'
import SortArrowsIcon from '~icons/nova/sort-arrows'
import SortArrowsAscIcon from '~icons/nova/sort-arrows-asc'
import SortArrowsDescIcon from '~icons/nova/sort-arrows-desc'
import SupportSpeechBubbleIcon from '~icons/nova/support-speech-bubble'
import UpRightSquareIcon from '~icons/nova/up-right-square'
import WanSecurityIcon from '~icons/nova/wan-security'

export const novaIconComponents = {
  [NovaIconTypes.AccessMobile]: AccessMobileIcon,
  [NovaIconTypes.AccessSite]: AccessSiteIcon,
  [NovaIconTypes.AlertCircle]: AlertCircleIcon,
  [NovaIconTypes.AlertTriangle]: AlertTriangleIcon,
  [NovaIconTypes.ArrowLeftDouble]: ArrowLeftDoubleIcon,
  [NovaIconTypes.Check]: CheckIcon,
  [NovaIconTypes.ChevronLeft]: ChevronLeftIcon,
  [NovaIconTypes.ChevronLeftDouble]: ChevronLeftDoubleIcon,
  [NovaIconTypes.ChevronRight]: ChevronRightIcon,
  [NovaIconTypes.ChevronRightDouble]: ChevronRightDoubleIcon,
  [NovaIconTypes.Clock]: ClockIcon,
  [NovaIconTypes.CloseCircle]: CloseCircleIcon,
  [NovaIconTypes.Contract]: ContractIcon,
  [NovaIconTypes.Download]: DownloadIcon,
  [NovaIconTypes.Edit]: EditIcon,
  [NovaIconTypes.Edr]: EdrIcon,
  [NovaIconTypes.EyeOff]: EyeOffIcon,
  [NovaIconTypes.Eye]: EyeIcon,
  [NovaIconTypes.GlobalConnect]: GlobalConnectIcon,
  [NovaIconTypes.HelpCircle]: HelpCircleIcon,
  [NovaIconTypes.Help]: HelpIcon,
  [NovaIconTypes.Home]: HomeIcon,
  [NovaIconTypes.Idaas]: IdaasIcon,
  [NovaIconTypes.Information]: InformationIcon,
  [NovaIconTypes.Interconnect]: InterconnectIcon,
  [NovaIconTypes.InternetGateway]: InternetGatewayIcon,
  [NovaIconTypes.LanSecurity]: LanSecurityIcon,
  [NovaIconTypes.Lock]: LockIcon,
  [NovaIconTypes.Maintenance]: MaintenanceIcon,
  [NovaIconTypes.Notification]: NotificationIcon,
  [NovaIconTypes.OrderHistory]: OrderHistoryIcon,
  [NovaIconTypes.RemoteAccess]: RemoteAccessIcon,
  [NovaIconTypes.SatelliteConnect]: SatelliteConnectIcon,
  [NovaIconTypes.Search]: SearchIcon,
  [NovaIconTypes.SecuredWan]: SecuredWanIcon,
  [NovaIconTypes.SortArrows]: SortArrowsIcon,
  [NovaIconTypes.SortArrowsAsc]: SortArrowsAscIcon,
  [NovaIconTypes.SortArrowsDesc]: SortArrowsDescIcon,
  [NovaIconTypes.SupportSpeechBubble]: SupportSpeechBubbleIcon,
  [NovaIconTypes.UpRightSquare]: UpRightSquareIcon,
  [NovaIconTypes.WanSecurity]: WanSecurityIcon,
} as const satisfies Record<string, Component>

const toPascalCase = (value: string) => value.replace(/(^|-)([a-z])/g, (_, __, char: string) => char.toUpperCase())

export const novaAliases = Object.fromEntries(
  Object.keys(novaIconComponents).map(iconName => [`nova${toPascalCase(iconName)}`, `nova:${iconName}`]),
) as Record<string, string>

const NovaIconComponent = defineComponent({
  name: 'NovaIconComponent',
  props: {
    tag: {
      type: [String, Object, Function] as PropType<string | Component>,
      required: true,
    },
    icon: String,
    disabled: Boolean,
  },
  setup(props) {
    return () => {
      const tag = props.tag as string | Component
      const iconName = props.icon as NovaIconType | undefined
      const iconComponent = iconName ? novaIconComponents[iconName] : undefined

      if (!iconComponent) {
        return h(tag)
      }

      return h(tag, null, [h(iconComponent, { class: 'v-icon__svg' })])
    }
  },
})

export const novaIconSet: IconSet = {
  component: NovaIconComponent as IconSet['component'],
}
