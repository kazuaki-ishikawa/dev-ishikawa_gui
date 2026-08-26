<script lang="ts" setup>
import AlertChartIcon from '~icons/ztgict/alert-chart'
import AlertTriangleIcon from '~icons/ztgict/alert-triangle'
import AlertIcon from '~icons/ztgict/alert'
import AlertCircleIcon from '~icons/ztgict/alert-circle'
import ArrowDownIcon from '~icons/ztgict/arrow-down'
import ArrowUpIcon from '~icons/ztgict/arrow-up'
import CaretDownIcon from '~icons/ztgict/caret-down'
import CaretRightIcon from '~icons/ztgict/caret-right'
import ChevronLeftIcon from '~icons/ztgict/chevron-left'
import ChevronRightIcon from '~icons/ztgict/chevron-right'
import ChevronUpIcon from '~icons/ztgict/chevron-up'
import CircleArrowsIcon from '~icons/ztgict/circle-arrows'
import CircleCaretRightIcon from '~icons/ztgict/circle-caret-right'
import CircleCloseIcon from '~icons/ztgict/circle-close'
import CloseIcon from '~icons/ztgict/close'
import CommentsIcon from '~icons/ztgict/comments'
import ContractorIcon from '~icons/ztgict/contractor'
import DashboardIcon from '~icons/ztgict/dashboard'
import DatabaseIcon from '~icons/ztgict/database'
import EyeIcon from '~icons/ztgict/eye'
import EyeOffIcon from '~icons/ztgict/eye-off'
import FicIcon from '~icons/ztgict/fic'
import ForwardIcon from '~icons/ztgict/forward'
import GuaranteeIcon from '~icons/ztgict/guarantee'
import HelpIcon from '~icons/ztgict/help'
import IpoeIcon from '~icons/ztgict/ipoe'
import LockIcon from '~icons/ztgict/lock'
import MonitoringIcon from '~icons/ztgict/monitoring'
import NewsIcon from '~icons/ztgict/news'
import NgIcon from '~icons/ztgict/ng'
import NoteIcon from '~icons/ztgict/note'
import OkIcon from '~icons/ztgict/ok'
import OperationStatusIcon from '~icons/ztgict/operation-status'
import OrderIcon from '~icons/ztgict/order'
import QuickSetupIcon from '~icons/ztgict/quick-setup'
import TrafficStatusIcon from '~icons/ztgict/traffic-status'
import SearchDataIcon from '~icons/ztgict/search-data'
import SearchIcon from '~icons/ztgict/search'
import SimIcon from '~icons/ztgict/sim'
import SupportIcon from '~icons/ztgict/support'
import TerminalIcon from '~icons/ztgict/terminal'
import UpRightSquareIcon from '~icons/ztgict/up-right-square'
import VpnIcon from '~icons/ztgict/vpn'
import { IconTypes, IconSize } from '@/components/icons/constants'
import type { IconType } from '@/components/icons/constants'
import type { ColorKeyList } from '@/components/constants'

type PropType = {
  type: IconType
  color?: (typeof ColorKeyList)[number]
  lightColor?: (typeof ColorKeyList)[number]
  size?: keyof typeof IconSize
}
const props = withDefaults(defineProps<PropType>(), {
  size: 'middle',
  color: undefined,
  lightColor: undefined,
})

const { $vuetify } = useNuxtApp()
const colors = computed(() => $vuetify.theme.current.value.colors)

const sizePx = computed(() => IconSize[props.size])
const fillColor = computed(() => {
  if (props.color) {
    return colors.value[props.color] as string
  }
  if (props.lightColor) {
    return colors.value[`light-${props.lightColor}`] as string
  }
  return '#fff'
})
const iconStyle = computed(() => ({ fill: fillColor.value, color: fillColor.value }))
const lockIconStyle = computed(() => ({ fill: 'none', stroke: fillColor.value }))
</script>

<template>
  <AlertChartIcon v-if="type === IconTypes.AlertChart" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <AlertTriangleIcon v-else-if="type === IconTypes.AlertTriangle" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <AlertIcon v-else-if="type === IconTypes.Alert" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <AlertCircleIcon v-else-if="type === IconTypes.AlertCircle" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <ArrowDownIcon v-else-if="type === IconTypes.ArrowDown" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <ArrowUpIcon v-else-if="type === IconTypes.ArrowUp" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <CaretDownIcon v-else-if="type === IconTypes.CaretDown" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <CaretRightIcon v-else-if="type === IconTypes.CaretRight" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <ChevronLeftIcon v-else-if="type === IconTypes.ChevronLeft" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <ChevronRightIcon v-else-if="type === IconTypes.ChevronRight" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <ChevronUpIcon v-else-if="type === IconTypes.ChevronUp" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <CircleArrowsIcon v-else-if="type === IconTypes.CircleArrows" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <CircleCaretRightIcon
    v-else-if="type === IconTypes.CircleCaretRight"
    :width="sizePx"
    :height="sizePx"
    :style="iconStyle"
  />
  <CircleCloseIcon v-else-if="type === IconTypes.CircleClose" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <CloseIcon v-else-if="type === IconTypes.Close" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <CommentsIcon v-else-if="type === IconTypes.Comments" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <DashboardIcon v-else-if="type === IconTypes.Dashboard" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <DatabaseIcon v-else-if="type === IconTypes.Database" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <EyeIcon v-else-if="type === IconTypes.Eye" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <EyeOffIcon v-else-if="type === IconTypes.EyeOff" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <FicIcon v-else-if="type === IconTypes.Fic" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <ForwardIcon v-else-if="type === IconTypes.Forward" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <GuaranteeIcon v-else-if="type === IconTypes.Guarantee" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <HelpIcon v-else-if="type === IconTypes.Help" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <IpoeIcon v-else-if="type === IconTypes.Ipoe" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <LockIcon v-else-if="type === IconTypes.Lock" :width="sizePx" :height="sizePx" :style="lockIconStyle" />
  <MonitoringIcon v-else-if="type === IconTypes.Monitoring" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <NewsIcon v-else-if="type === IconTypes.News" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <NgIcon v-else-if="type === IconTypes.NG" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <NoteIcon v-else-if="type === IconTypes.Note" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <OkIcon v-else-if="type === IconTypes.OK" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <OperationStatusIcon
    v-else-if="type === IconTypes.OperationStatus"
    :width="sizePx"
    :height="sizePx"
    :style="iconStyle"
  />
  <OrderIcon v-else-if="type === IconTypes.Order" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <ContractorIcon v-else-if="type === IconTypes.Contractor" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <QuickSetupIcon v-else-if="type === IconTypes.QuickSetup" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <TrafficStatusIcon v-else-if="type === IconTypes.TrafficStatus" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <SearchDataIcon v-else-if="type === IconTypes.SearchData" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <SearchIcon v-else-if="type === IconTypes.Search" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <SimIcon v-else-if="type === IconTypes.Sim" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <SupportIcon v-else-if="type === IconTypes.Support" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <TerminalIcon v-else-if="type === IconTypes.Terminal" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <UpRightSquareIcon v-else-if="type === IconTypes.UpRightSquare" :width="sizePx" :height="sizePx" :style="iconStyle" />
  <VpnIcon v-else-if="type === IconTypes.Vpn" :width="sizePx" :height="sizePx" :style="iconStyle" />
</template>
