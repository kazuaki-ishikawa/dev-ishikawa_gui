import { useI18n } from 'vue-i18n'
import {
  OrderStatusTypes,
  CircuitTypes,
  ResourceStatusTypes,
  TerminalTypes,
  SecurityOptionTypes,
  TerminalDeviceTypes,
} from '@/api/constants'
import type { ErrorResponse } from '@/api/types'
import { TERMINAL_MAX_LIMIT, OperationTypes, FirmwareVersionTypes } from '@/api/terminals/constants'
import type {
  TerminalListResponse,
  TerminalResponse,
  TerminalPostRequest,
  TerminalPutRequest,
  TerminalDeleteRequest,
  OperationType,
  TerminalOperationType,
  TerminalOperationResponse,
  ResourceSummaryTerminalQuery,
  ResourceSummaryTerminalListResponse,
  TerminalUtilOptionCountResponse,
  TerminalUtilOptionCountOptionType,
  TerminalListQuery,
} from '@/api/terminals/types'
import type { SortOption } from '@/components/table/types'
import { TenantPages } from '@/components/sidebar/constants'

export const useGetTerminalTableList = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const router = useRouter()

  const terminalTableQuery = ref<ResourceSummaryTerminalQuery>({ limit: 10, offset: 0 })
  const terminalTableList = ref<ResourceSummaryTerminalListResponse>({ total: 0, offset: 0, terminals: [] })
  const getTerminalTableList = async (query: ResourceSummaryTerminalQuery) => {
    try {
      terminalTableQuery.value = query
      const response = await API.GET<ResourceSummaryTerminalListResponse, ResourceSummaryTerminalQuery>(
        'resource-summary/terminals',
        { query },
      )
      terminalTableList.value = response
      return response
    } catch (error) {
      terminalTableList.value = { total: 0, offset: 0, terminals: [] }
      throw error
    }
  }

  const terminalSortOption = computed<Partial<SortOption>>(() => ({
    sortKey: terminalTableQuery.value.sortKey,
    direction: terminalTableQuery.value.direction,
  }))
  const terminalTablePagination = computed(() => ({
    limit: terminalTableQuery.value.limit || 10,
    page: (terminalTableQuery.value.offset ?? 0) + 1,
  }))

  const routerPushQuery = (query: ResourceSummaryTerminalQuery) => {
    router.push({ query: { ...query, offset: undefined, page: (query.offset ?? 0) + 1 } })
  }
  const handleChangeLimit = (limit?: number) => {
    routerPushQuery({ ...terminalTableQuery.value, limit, offset: 0 })
  }
  const handleChangePage = (page: number) => {
    routerPushQuery({ ...terminalTableQuery.value, offset: page - 1 })
  }
  const handleSort = (option?: SortOption) => {
    routerPushQuery({ ...terminalTableQuery.value, sortKey: option?.sortKey, direction: option?.direction })
  }
  const handleQueryClear = () => {
    terminalTableQuery.value = {
      sortKey: terminalTableQuery.value.sortKey,
      direction: terminalTableQuery.value.direction,
      limit: terminalTableQuery.value.limit,
      offset: 0,
    }
  }

  const updateQueryTerminalId = (terminalIds: string[]) => {
    terminalTableQuery.value = {
      ...terminalTableQuery.value,
      terminalId: terminalIds.length > 0 ? terminalIds : undefined,
    }
  }
  const updateQueryTerminalType = (terminalType: string) => {
    terminalTableQuery.value = {
      ...terminalTableQuery.value,
      terminalType: Object.values(TerminalTypes).find(v => v === terminalType),
    }
  }
  const updateQueryResourceStatus = (status: string[]) => {
    terminalTableQuery.value = {
      ...terminalTableQuery.value,
      resourceStatus: Object.values(ResourceStatusTypes).filter(v => status.includes(v)),
    }
  }
  const updateQueryPrimaryCircuitType = (circuitType: string) => {
    terminalTableQuery.value = {
      ...terminalTableQuery.value,
      primaryCircuitType: Object.values(CircuitTypes).find(v => v === circuitType),
    }
  }
  const updateQueryFlowCollectorPlan = (flowCollectorPlan: string) => {
    terminalTableQuery.value = {
      ...terminalTableQuery.value,
      flowCollectorPlan: Object.values(SecurityOptionTypes).find(v => v === flowCollectorPlan),
    }
  }

  const circuitTypeRoutePath = {
    [CircuitTypes.Guarantee]: 'guarantees/circuits',
    [CircuitTypes.Ipoe]: 'ipoes',
  }

  const terminalTableItems = computed(() =>
    terminalTableList.value.terminals.map(terminal => {
      const primaryCircuit = terminal.primaryCircuit.circuitType
      const secondaryCircuit = terminal.secondaryCircuit?.circuitType
      return {
        terminalId: terminal.terminalId,
        customerNote: terminal.customerNote,
        terminalType:
          terminal.terminalType === TerminalTypes.Rental ? t('terminals.rentalTerminal') : t('terminals.selfTerminal'),
        terminalDeviceType:
          terminal.terminalDeviceType === TerminalDeviceTypes.Router01
            ? t('terminals.router01')
            : terminal.terminalDeviceType === TerminalDeviceTypes.Router02
              ? t('terminals.router02')
              : '-',
        terminalPath:
          terminal.terminalType === TerminalTypes.Rental ? TenantPages.Terminals : TenantPages.SelfTerminals,
        primaryCircuit,
        primaryCircuitId: terminal.primaryCircuit?.circuitId,
        primaryCircuitPath: primaryCircuit === CircuitTypes.Mobile ? '' : circuitTypeRoutePath[primaryCircuit],
        secondaryCircuit,
        secondaryCircuitId: terminal.secondaryCircuit?.circuitId,
        secondaryCircuitPath: secondaryCircuit === CircuitTypes.Ipoe ? circuitTypeRoutePath[secondaryCircuit] : '',
        vpnId: terminal.vpnId,
        resourceStatus: terminal.resourceStatus,
        orderId: terminal.orderId,
        updateTime: terminal.updateTime,
        threatDetectionPlan: terminal.threatDetection.threatDetectionPlan,
        flowCollectorPlan: terminal.flowCollector.flowCollectorPlan,
        behaviorDetectionPlan: terminal.behaviorDetection?.behaviorDetectionPlan,
        flowCollectorStartDate: terminal.flowCollector?.flowCollectorStartDate ?? '',
        trafficReportFlowAnalyzerPlan: terminal.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan,
        trafficReportFlowAnalyzerAlert: terminal.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerAlert,
        securitySettings: '',
      }
    }),
  )

  return {
    terminalTableQuery,
    terminalTableList,
    terminalSortOption,
    terminalTablePagination,
    terminalTableItems,
    getTerminalTableList,
    routerPushQuery,
    handleChangeLimit,
    handleChangePage,
    handleSort,
    handleQueryClear,
    updateQueryTerminalId,
    updateQueryTerminalType,
    updateQueryResourceStatus,
    updateQueryPrimaryCircuitType,
    updateQueryFlowCollectorPlan,
  }
}

export const useGetAllResourceSummaryTerminalList = () => {
  const { API } = useAPI()

  const resourceSummaryTerminalList = ref<ResourceSummaryTerminalListResponse>({ total: 0, offset: 0, terminals: [] })
  const getAllResourceSummaryTerminalList = async (query?: ResourceSummaryTerminalQuery) => {
    try {
      const response = await API.ALL<
        ResourceSummaryTerminalListResponse,
        ResourceSummaryTerminalQuery & { limit: number }
      >('resource-summary/terminals', {
        query: {
          ...query,
          terminalId: query?.terminalId?.filter(Boolean),
          resourceStatus: query?.resourceStatus?.filter(Boolean),
          limit: TERMINAL_MAX_LIMIT,
        },
      })
      resourceSummaryTerminalList.value = {
        offset: 0,
        total: response?.[0]?.total ?? 0,
        terminals: response.flatMap(val => (val ? val.terminals : [])),
      }
      return response
    } catch (error) {
      resourceSummaryTerminalList.value = { total: 0, offset: 0, terminals: [] }
      throw error
    }
  }

  const customerNoteList = computed(() =>
    resourceSummaryTerminalList.value.terminals
      .filter(terminal => terminal.resourceStatus !== ResourceStatusTypes.Terminated)
      .map(({ terminalId: id, customerNote }) => ({ id, customerNote })),
  )
  const terminalIdOptions = computed(() =>
    resourceSummaryTerminalList.value.terminals.map(terminal => ({
      text: `${terminal.terminalId} / ${terminal.customerNote}`,
      value: terminal.terminalId,
    })),
  )

  return {
    resourceSummaryTerminalList,
    customerNoteList,
    terminalIdOptions,
    getAllResourceSummaryTerminalList,
  }
}

export const useGetAllTerminalList = () => {
  const { API } = useAPI()

  const terminalList = ref<TerminalListResponse>({ total: 0, offset: 0, terminals: [] })
  const getAllTerminalList = async () => {
    try {
      const response = await API.ALL<TerminalListResponse, { limit: number }>('terminals', {
        query: { limit: 100 },
      })
      terminalList.value = {
        offset: 0,
        total: response?.[0]?.total ?? 0,
        terminals: response.flatMap(val => (val ? val.terminals : [])),
      }
      return response
    } catch (error) {
      terminalList.value = { total: 0, offset: 0, terminals: [] }
      throw error
    }
  }

  return { terminalList, getAllTerminalList }
}

export const useGetTerminal = () => {
  const { API } = useAPI()

  const terminal = ref<TerminalResponse | null>(null)
  const getTerminal = async (terminalId: string) => {
    try {
      const response = await API.GET<TerminalResponse>(`terminals/${terminalId}`)
      terminal.value = response
      return response
    } catch (error) {
      terminal.value = null
      throw error
    }
  }

  const isTerminated = computed(() => terminal.value?.resourceStatus === ResourceStatusTypes.Terminated)
  const editable = computed(
    () =>
      !!terminal.value &&
      terminal.value.resourceStatus === ResourceStatusTypes.Active &&
      (!terminal.value?.orderStatus || terminal.value.orderStatus === OrderStatusTypes.Completed),
  )
  const requiredFirmwareUpdate = computed(
    () =>
      !!terminal.value?.terminalDevices?.some(
        device =>
          device.deviceAttribute === 'active' &&
          device.firmwareVersion?.attribute === FirmwareVersionTypes.FirmwareUpdateRequired,
      ),
  )

  const inProgressSwitchover = computed(() => !!terminal.value?.guarantee?.routeSwitch?.switchover)
  const switchoverDisabled = computed(
    () =>
      !!terminal.value?.terminalDevices?.some(
        device => device.firmwareVersion?.attribute !== FirmwareVersionTypes.Latest,
      ),
  )

  return {
    getTerminal,
    terminal,
    isTerminated,
    editable,
    requiredFirmwareUpdate,
    inProgressSwitchover,
    switchoverDisabled,
  }
}

export const useGetTerminalList = () => {
  const { API } = useAPI()
  const { t } = useI18n()

  const terminalListQuery = ref<TerminalListQuery>({ limit: 10, offset: 0 })
  const terminalList = ref<TerminalListResponse>({
    total: 0,
    offset: 0,
    terminals: [],
  })
  const getTerminalList = async (query: TerminalListQuery) => {
    try {
      terminalListQuery.value = query
      const response = await API.GET<TerminalListResponse, TerminalListQuery>('terminals', { query })
      terminalList.value = response
      return response
    } catch (error) {
      terminalList.value = { total: 0, offset: 0, terminals: [] }
      throw error
    }
  }

  const terminalsTableItems = computed(() =>
    terminalList.value.terminals
      .filter(terminal => terminal.terminalDevices && 0 < terminal.terminalDevices.length)
      .map(terminal => {
        const primaryCircuit = terminal.primaryCircuit.circuitType
        const secondaryCircuit = terminal.secondaryCircuit?.circuitType
        const firmwareVersions = (terminal.terminalDevices ?? [])
          .map(device => {
            const firmwareVersionAttribute = device.firmwareVersion?.attribute ?? ''
            return Object.values(FirmwareVersionTypes).includes(firmwareVersionAttribute)
              ? `${device.firmwareVersion?.displayName}（${t(`terminals.${firmwareVersionAttribute}`)}）`
              : (device.firmwareVersion?.displayName ?? '')
          })
          .filter(Boolean)
          .join('\n')
        return {
          terminalId: terminal.terminalId,
          customerNote: terminal.customerNote,
          primaryCircuit: t(`service.${primaryCircuit}`),
          secondaryCircuit: secondaryCircuit ? t(`service.${secondaryCircuit}`) : '-',
          firmwareVersion: firmwareVersions,
        }
      }),
  )

  return { terminalListQuery, terminalList, terminalsTableItems, getTerminalList }
}

export const useCreateTerminal = () => {
  const { t } = useI18n()
  const { API } = useAPI()
  const { setApiErrorMessageState } = useApiErrorDialog()
  const { resetJpkiRequestStatus } = useGetJpkiRequestStatus()

  const createTerminal = async (request: TerminalPostRequest) => {
    try {
      const response = await API.POST<TerminalResponse, TerminalPostRequest>('terminals', {
        body: request,
        suppressErrorDialog: true,
      })
      return response
    } catch (e) {
      const error = e as ErrorResponse
      const errorMessage = error.statusCode === 400 ? t('message.badError') : t('message.failed')
      setApiErrorMessageState({
        apiType: 'terminal',
        message: `${errorMessage}\n${errorFormat(error)}`,
      })
      throw error
    } finally {
      resetJpkiRequestStatus()
    }
  }

  return { createTerminal }
}

export const useUpdateTerminal = () => {
  const { t } = useI18n()
  const { API } = useAPI()
  const { setApiErrorMessageState } = useApiErrorDialog()

  const updateTerminal = async (terminalId: string, request: TerminalPutRequest) => {
    try {
      const response = await API.PUT<TerminalResponse, TerminalPutRequest>(`terminals/${terminalId}`, {
        body: request,
        suppressErrorDialog: true,
      })
      return response
    } catch (e) {
      const error = e as ErrorResponse
      const errorMessage = error.statusCode === 400 ? t('message.badError') : t('message.failed')
      setApiErrorMessageState({
        apiType: 'terminal',
        message: `${errorMessage}\n${errorFormat(error)}`,
      })
      throw error
    }
  }

  return { updateTerminal }
}

export const useDeleteTerminal = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const deleteTerminal = async (terminalId: string, body: TerminalDeleteRequest) => {
    try {
      const response = await API.DELETE<TerminalResponse, TerminalDeleteRequest>(`terminals/${terminalId}`, {
        body,
        suppressErrorDialog: true,
      })
      setNotificationMessageState({ message: t('message.deleted') })
      return response
    } catch (e) {
      const error = e as ErrorResponse
      const errorMessage = error.statusCode === 400 ? t('message.badError') : t('message.failed')
      setNotificationMessageState({ message: `${errorMessage}\n${errorFormat(error)}` })
      throw error
    }
  }

  return { deleteTerminal }
}

export const useGetTerminalOperations = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const isTerminalOperationBadRequest = ref(false)
  const operations = ref<TerminalOperationType[]>([])
  const getTerminalOperations = async (terminalId: string) => {
    try {
      isTerminalOperationBadRequest.value = false
      const response = await API.GET<TerminalOperationResponse>(`terminals/${terminalId}/operation`, {
        suppressErrorDialog: true,
      })
      operations.value = response.operations
      return response
    } catch (e) {
      operations.value = []
      const error = e as ErrorResponse
      // 400 Bad Request の場合にはエラーを表示しない
      if (error.statusCode === 400) {
        isTerminalOperationBadRequest.value = true
        return { operations: [] }
      }
      setNotificationMessageState({ message: `${t('message.failed')}\n${errorFormat(error)}` })
      throw error
    }
  }

  return { operations, isTerminalOperationBadRequest, getTerminalOperations }
}

export const usePostTerminalOperation = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()
  const { setSuccessSnackBarState } = useSnackBar()

  const postTerminalOperation = async (terminalId: string, operation: OperationType) => {
    const response = await API.POST<TerminalOperationType, { operation: OperationType }>(
      `terminals/${terminalId}/operation`,
      { body: { operation } },
    )
    if ([OperationTypes.BreakOutListUpdate, OperationTypes.Switchback, OperationTypes.Switchover].includes(operation)) {
      setNotificationMessageState({ message: t(`terminals.message.${operation}`) })
    } else {
      setSuccessSnackBarState(true)
    }
    return response
  }

  return { postTerminalOperation }
}

export const useGetTerminalUtilOptionCount = () => {
  const { API } = useAPI()

  const terminalUtilOptionCount = ref<TerminalUtilOptionCountResponse | null>(null)
  const getTerminalUtilOptionCount = async (optionType?: TerminalUtilOptionCountOptionType) => {
    try {
      const response = await API.GET<
        TerminalUtilOptionCountResponse,
        { optionType?: TerminalUtilOptionCountOptionType }
      >('terminal-util/option-count', { query: { optionType } })
      terminalUtilOptionCount.value = response
      return response
    } catch (error) {
      terminalUtilOptionCount.value = null
      throw error
    }
  }

  return { terminalUtilOptionCount, getTerminalUtilOptionCount }
}
