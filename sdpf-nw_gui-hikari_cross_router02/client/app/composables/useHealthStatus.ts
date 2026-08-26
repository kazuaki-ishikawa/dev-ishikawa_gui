import { MAX_LIMIT, HealthStatus } from '@/api/healthStatus/constants'
import type {
  HealthStatusResponse,
  HealthStatusListResponse,
  FicHealthStatusListResponse,
  FicHealthStatusResponse,
  FicRoutesRequestsResponse,
  HealthStatusCountResponse,
  FicConnectionBgpSessionResponse,
  FicRoutesResponse,
} from '@/api/healthStatus/types'
import type { MixedHealthStatusResponse } from '@/components/monitoring/types'

export const useGetAllHealthStatusList = () => {
  const { API } = useAPI()

  const healthStatuses = ref<HealthStatusResponse[]>([])
  const getAllHealthStatusList = async () => {
    try {
      const response = await API.ALL<HealthStatusListResponse, { limit: number }>('monitorings/health-status', {
        query: { limit: MAX_LIMIT },
      })
      healthStatuses.value = response
        .flatMap(n => n.healthStatuses)
        .sort((a, b) => (a.terminal.terminalStatus === 'ng' ? -1 : b.terminal.terminalStatus === 'ng' ? 1 : 0))
      return response
    } catch (error) {
      healthStatuses.value = []
      throw error
    }
  }

  return { healthStatuses, getAllHealthStatusList }
}

export const useGetHealthStatus = () => {
  const { API } = useAPI()

  const healthStatus = ref<HealthStatusResponse>()
  const getHealthStatus = async (terminalId: string) => {
    try {
      const response = await API.GET<HealthStatusListResponse, { terminalId: string }>('monitorings/health-status', {
        query: { terminalId },
      })
      healthStatus.value = response.healthStatuses.find(hs => hs.terminal.terminalId === terminalId)
      return response
    } catch (error) {
      healthStatus.value = undefined
      throw error
    }
  }

  return { healthStatus, getHealthStatus }
}

export const useGetHealthStatusCount = () => {
  const { API } = useAPI()

  const healthStatusCount = ref<HealthStatusCountResponse | null>(null)
  const getHealthStatusCount = async () => {
    try {
      const response = await API.GET<HealthStatusCountResponse>('monitorings/health-status/count')
      healthStatusCount.value = response
      return response
    } catch (error) {
      healthStatusCount.value = null
      throw error
    }
  }

  return { healthStatusCount, getHealthStatusCount }
}

export const useGetFicHealthStatusList = () => {
  const { API } = useAPI()

  const ficHealthStatuses = ref<FicHealthStatusResponse[]>([])
  const getFicHealthStatusList = async () => {
    try {
      const response = await API.GET<FicHealthStatusListResponse>('monitorings/fic-health-status')
      ficHealthStatuses.value = response.ficHealthStatuses
      return response
    } catch (error) {
      ficHealthStatuses.value = []
      throw error
    }
  }

  return { ficHealthStatuses, getFicHealthStatusList }
}

export const useGetFicConnectionBgpSessionList = () => {
  const { API } = useAPI()
  const { setLoadingState } = useLoading()

  const ficConnectionBgpSessionList = ref<FicConnectionBgpSessionResponse[]>([])
  const getFicConnectionBgpSessionList = async (ficConnectionIds: string[]) => {
    try {
      setLoadingState('start')
      const response = await Promise.all(
        ficConnectionIds.map((id: string) =>
          API.GET<FicConnectionBgpSessionResponse>(`fic-connections/${id}/bgp-session`, { suppressErrorDialog: true }),
        ),
      )
      ficConnectionBgpSessionList.value = response
      return response
    } catch (error) {
      ficConnectionBgpSessionList.value = []
      throw error
    } finally {
      setLoadingState('end')
    }
  }

  return { ficConnectionBgpSessionList, getFicConnectionBgpSessionList }
}

export const useResetFicConnectionBgpSession = () => {
  const { API } = useAPI()
  const { setSuccessSnackBarState } = useSnackBar()

  const resetFicConnectionBgpSession = async (ficConnectionId: string) => {
    const response = await API.POST<FicConnectionBgpSessionResponse, { operation: 'reset' }>(
      `fic-connections/${ficConnectionId}/bgp-session`,
      { body: { operation: 'reset' } },
    )
    setSuccessSnackBarState(true)
    return response
  }

  return { resetFicConnectionBgpSession }
}

export const useGetFicRoutes = () => {
  const { API } = useAPI()
  const { setLoadingState } = useLoading()

  const ficRoutes = ref<FicRoutesRequestsResponse | null>(null)
  const getFicRoutes = async (ficConnectionId: string) => {
    try {
      setLoadingState('start')
      const { requestId } = await API.GET<FicRoutesResponse>(`monitorings/fic-routes/${ficConnectionId}`)
      while (true) {
        await sleep(3000)
        const response = await API.GET<FicRoutesRequestsResponse>(
          `monitorings/fic-routes/${ficConnectionId}/get-requests/${requestId}`,
        )
        if (response.completed) {
          ficRoutes.value = response
          return response
        }
      }
    } catch (error) {
      ficRoutes.value = null
      throw error
    } finally {
      setLoadingState('end')
    }
  }

  return { ficRoutes, getFicRoutes }
}

export const useReconcileTerminalStatus = () => {
  const { API } = useAPI()
  const { setSuccessSnackBarState } = useSnackBar()

  const reconcileTerminalStatus = async (terminalId: string) => {
    await API.POST(`monitorings/health-status/reconcile/${terminalId}`)
    setSuccessSnackBarState(true)
  }

  return { reconcileTerminalStatus }
}

export const useHealthStatus = () => {
  const moveToDetail = async (tenantId: string, terminalId: string) => {
    await navigateTo(`/tenants/${tenantId}/monitoring/operation-status/${terminalId}`)
  }
  const moveToSelfCheck = async (tenantId: string, terminalId: string) => {
    await navigateTo(`/tenants/${tenantId}/monitoring/operation-status/${terminalId}/self-check`)
  }
  const moveToFicRoutes = async (tenantId: string, ficId: string) => {
    await navigateTo(`/tenants/${tenantId}/monitoring/operation-status/${ficId}/fic-routes`)
  }

  const isHealthStatus = (status: unknown) => status === HealthStatus.OK || status === HealthStatus.NG
  const getGuaranteeStatus = (healthStatus: HealthStatusResponse) => {
    const bgp = healthStatus.guaranteeBgp?.internetBgpStatus
    const ping = healthStatus.guaranteePing?.internetPingStatus
    const statuses = [bgp?.act, bgp?.sby, ping?.act, ping?.sby]

    // null / undefined / 空文字などの欠損値や想定外の値があれば none とする
    if (!bgp || !ping || !statuses.every(isHealthStatus)) {
      return 'none' as const
    }

    // 全てのステータスが OK の場合は OK
    if (statuses.every(status => status === HealthStatus.OK)) {
      return HealthStatus.OK
    }

    // bgp と ping のどちらかですべてのステータスが NG の場合は NG
    const isBgpAllNg = bgp.act === HealthStatus.NG && bgp.sby === HealthStatus.NG
    const isPingAllNg = ping.act === HealthStatus.NG && ping.sby === HealthStatus.NG
    if (isBgpAllNg || isPingAllNg) {
      return HealthStatus.NG
    }

    // bgp と ping のどちらかで NG ステータスがある場合は Warning
    return HealthStatus.Warning
  }

  const getVpnStatus = (healthStatus: MixedHealthStatusResponse) => {
    const isSwitchover = healthStatus.terminal.isSwitchover
    const bgpDown =
      healthStatus.guaranteeBgp?.vpnBgpStatus?.act === HealthStatus.NG &&
      healthStatus.guaranteeBgp?.vpnBgpStatus?.sby === HealthStatus.NG

    // VPN 接続なしの場合はステータスなしとする
    const vpnStatus = healthStatus.vpn?.vpnStatus
    if (!vpnStatus) {
      return 'none' as const
    }
    // VPN BGP が両系 Down、もしくは迂回設定中でない場合は vpnStatus をそのまま返す
    return bgpDown || !isSwitchover ? vpnStatus : HealthStatus.Warning
  }

  return {
    moveToDetail,
    moveToSelfCheck,
    moveToFicRoutes,
    getGuaranteeStatus,
    getVpnStatus,
  }
}
