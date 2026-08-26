<script setup lang="ts">
import type { BreakOutResponse } from '@/api/breakOut/types'
import type { SelfTerminalResponse } from '@/api/selfTerminals/types'
import type { TerminalResponse } from '@/api/terminals/types'
import { OrderRequestTypes } from '@/api/orders/constants'
import type { OrderRequestType } from '@/api/orders/types'

type PropType = {
  terminal: TerminalResponse | SelfTerminalResponse
  tenantId: string
  requestType: OrderRequestType
  breakOutList: BreakOutResponse[]
}
const props = defineProps<PropType>()

const { getBreakOutListOptions } = useBreakOut()
const { formatLansToInputType, formatLanStaticRoutesToInputType } = useTerminalInput()
const isTerminated = computed(() => props.requestType === OrderRequestTypes.Delete)
const breakOutListOptions = computed(() => {
  if ('breakOut' in props.terminal) {
    return getBreakOutListOptions(props.terminal.breakOut ?? [], props.breakOutList)
  }
  return []
})
const formattedData = computed(() => {
  if ('lans' in props.terminal) {
    return {
      lans: formatLansToInputType(props.terminal.lans),
      lanStaticRoutes: formatLanStaticRoutesToInputType(props.terminal.lanStaticRoutes),
      terminal: props.terminal,
    }
  } else {
    return { terminal: props.terminal }
  }
})
</script>

<template>
  <TerminalDetail
    v-if="formattedData.lans"
    :terminal="formattedData.terminal"
    :tenant-id="tenantId"
    :lans="formattedData.lans"
    :lan-static-routes="formattedData.lanStaticRoutes"
    :is-terminated="isTerminated"
    :break-out-list-options="breakOutListOptions"
    is-order
  />
  <SelfTerminalDetail
    v-else-if="formattedData.terminal"
    :self-terminal="formattedData.terminal"
    :tenant-id="tenantId"
    is-order
  />
</template>
