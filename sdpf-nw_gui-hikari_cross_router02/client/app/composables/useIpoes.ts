import { useI18n } from 'vue-i18n'
import { OrderStatusTypes, ResourceStatusTypes } from '@/api/constants'
import type { ErrorResponse, ResourceStatusType } from '@/api/types'
import {
  RequestTypes,
  FletsTypes,
  HikariPlans,
  IpoeTypes,
  RemovalCollectTypes,
  IpoeContractTypes,
} from '@/api/ipoes/constants'
import type {
  FletsType,
  HikariPlanType,
  RemovalCollectType,
  FletsSeparatePostRequest,
  FletsSeparatePutRequest,
  FletsSeparateResponse,
  IpoeListQuery,
  IpoeListResponse,
  HikariCollaboPostRequest,
  HikariCollaboPutRequest,
  HikariCollaboDeleteRequest,
  HikariCollaboResponse,
  ResourceSummaryIpoeResponse,
  ResourceSummaryIpoeListResponse,
} from '@/api/ipoes/types'

export const useGetAllIpoeList = () => {
  const { API } = useAPI()

  const ipoeList = ref<IpoeListResponse | null>(null)
  const getAllIpoeList = async () => {
    try {
      const response = await API.ALL<IpoeListResponse, { limit: number }>('ipoe', {
        query: { limit: 100 },
      })
      ipoeList.value = {
        total: response[0]?.total ?? 0,
        offset: 0,
        ipoes: response.flatMap(val => (val ? val.ipoes : [])) ?? [],
      }
      return response
    } catch (error) {
      ipoeList.value = null
      throw error
    }
  }

  // ルーターに紐付け可能なIPoE回線の一覧を取得する
  // ルーターに紐付け済みのIPoE回線は除外する
  const getAttachableIpoeListOptions = (terminalId?: string, statuses?: ResourceStatusType[]) => {
    const attachables = statuses ?? [ResourceStatusTypes.Active, ResourceStatusTypes.Inactive]
    const ipoes = ipoeList.value?.ipoes ?? []
    return ipoes
      .filter(ipoe => attachables.includes(ipoe.resourceStatus) && (!ipoe.terminalId || ipoe.terminalId === terminalId))
      .map(ipoe => ({
        text: `${ipoe.ipoeId} / ${ipoe.customerNote}`,
        value: ipoe.ipoeId,
        hikariPlan: ipoe.hikariPlan,
      }))
  }

  return { getAllIpoeList, getAttachableIpoeListOptions }
}

export const useGetIpoeTableList = () => {
  const { API } = useAPI()

  const ipoeQuery = ref<IpoeListQuery>({ limit: 10, offset: 0 })
  const ipoeTableList = ref<IpoeListResponse>({ total: 0, offset: 0, ipoes: [] })
  const getIpoeTableList = async (query: IpoeListQuery) => {
    try {
      ipoeQuery.value = query
      const response = await API.GET<IpoeListResponse, IpoeListQuery>('ipoe', { query })
      ipoeTableList.value = response
      return response
    } catch (error) {
      ipoeTableList.value = { total: 0, offset: 0, ipoes: [] }
      throw error
    }
  }

  return { ipoeQuery, ipoeTableList, getIpoeTableList }
}

export const useGetAllSummaryIpoeList = () => {
  const { API } = useAPI()

  const summaryIpoeList = ref<ResourceSummaryIpoeResponse[]>([])
  const getAllSummaryIpoeList = async () => {
    try {
      const response = await API.ALL<ResourceSummaryIpoeListResponse, { limit: number }>('resource-summary/ipoe', {
        query: { limit: 1000 },
      })
      summaryIpoeList.value = response.flatMap(val => (val ? val.ipoes : [])) ?? []
      return response
    } catch (error) {
      summaryIpoeList.value = []
      throw error
    }
  }

  const customerNoteList = computed(() =>
    summaryIpoeList.value
      .filter(ipoe => ipoe.resourceStatus !== ResourceStatusTypes.Terminated)
      .map(({ ipoeId: id, customerNote }) => ({ id, customerNote })),
  )

  const ipoeListOptions = computed(() =>
    summaryIpoeList.value.map(({ ipoeId, customerNote }) => ({
      text: `${ipoeId} / ${customerNote}`,
      value: ipoeId,
    })),
  )

  return { getAllSummaryIpoeList, customerNoteList, ipoeListOptions }
}

export const useGetIpoe = () => {
  const { t } = useI18n()
  const { API } = useAPI()
  const { setNotificationMessageState } = useNotificationDialog()

  const getFletsSeparateResponse = ref<FletsSeparateResponse | null>(null)
  const getHikariCollaboResponse = ref<HikariCollaboResponse | null>(null)
  const getHikariCollabo = async (ipoeId: string) => {
    try {
      const response = await API.GET<HikariCollaboResponse>(`ipoe/hikari-collabo/${ipoeId}`)
      getHikariCollaboResponse.value = response
      return response
    } catch (error) {
      getHikariCollaboResponse.value = null
      throw error
    }
  }
  const getIpoe = async (ipoeId: string) => {
    getFletsSeparateResponse.value = null
    getHikariCollaboResponse.value = null
    // ref を得るために getIpoeList を実行
    const list = await API.GET<IpoeListResponse, IpoeListQuery>('ipoe', { query: { ipoeId: [ipoeId], limit: 1 } })
    const ipoeRef = list.ipoes[0]?.ref ?? ''

    // ref によって処理を分岐
    if (ipoeRef.includes(IpoeContractTypes.SeparateContract)) {
      getFletsSeparateResponse.value = await API.GET<FletsSeparateResponse>(`ipoe/separate-contract/${ipoeId}`)
    } else if (ipoeRef.includes(IpoeContractTypes.HikariCollabo)) {
      getHikariCollaboResponse.value = await getHikariCollabo(ipoeId)
    } else {
      setNotificationMessageState({ message: `${t('message.failed')}\n${t('message.ipoeNotFoundError')}` })
    }
  }

  const isFletsSeparate = computed(() => !!getFletsSeparateResponse.value)
  const isHikariCollabo = computed(() => !!getHikariCollaboResponse.value)

  const editableHikariCollabo = computed(
    () =>
      !!getHikariCollaboResponse.value &&
      getHikariCollaboResponse.value?.resourceStatus === ResourceStatusTypes.Active &&
      (!getHikariCollaboResponse.value?.orderStatus ||
        getHikariCollaboResponse.value.orderStatus === OrderStatusTypes.Completed),
  )
  const editableFletsSeparate = computed(
    () =>
      !!getFletsSeparateResponse.value &&
      getFletsSeparateResponse.value?.resourceStatus === ResourceStatusTypes.Active &&
      (!getFletsSeparateResponse.value?.orderStatus ||
        getFletsSeparateResponse.value.orderStatus === OrderStatusTypes.Completed),
  )
  const editable = computed(() => (isFletsSeparate.value ? editableFletsSeparate.value : editableHikariCollabo.value))

  return {
    getIpoe,
    getHikariCollabo,
    hikariCollabo: shallowReadonly(getHikariCollaboResponse),
    fletsSeparate: shallowReadonly(getFletsSeparateResponse),
    isFletsSeparate,
    isHikariCollabo,
    editable,
  }
}

export const useCreateHikariCollabo = () => {
  const { API } = useAPI()

  const createHikariCollaboResponse = ref<HikariCollaboResponse | null>(null)
  const createHikariCollabo = async (request: HikariCollaboPostRequest) => {
    try {
      const response = await API.POST<HikariCollaboResponse, HikariCollaboPostRequest>('ipoe/hikari-collabo', {
        body: request,
      })
      createHikariCollaboResponse.value = response
      return response
    } catch (error) {
      createHikariCollaboResponse.value = null
      throw error
    }
  }

  return { createHikariCollaboResponse, createHikariCollabo }
}

export const useCreateFletsSeparate = () => {
  const { t } = useI18n()
  const { API } = useAPI()
  const { setNotificationMessageState } = useNotificationDialog()
  const { setApiErrorMessageState } = useApiErrorDialog()
  const { isNovaView } = useNova()

  const fletsSeparateResponse = ref<FletsSeparateResponse | null>(null)

  const createFletsSeparate = async (request: FletsSeparatePostRequest) => {
    try {
      const response = await API.POST<FletsSeparateResponse, FletsSeparatePostRequest>('ipoe/separate-contract', {
        body: request,
        suppressErrorDialog: true,
      })
      fletsSeparateResponse.value = response
      // 新UIでは作成後にダイアログを表示しない
      if (!isNovaView.value) {
        setNotificationMessageState({
          message: t('message.accepted'),
          orderId: response.orderId,
        })
      }
      return response
    } catch (e) {
      fletsSeparateResponse.value = null
      const error = e as ErrorResponse
      const errorMessage = error.statusCode === 400 ? t('message.badError') : t('message.failed')
      setApiErrorMessageState({
        apiType: 'fletsSeparate',
        message: `${errorMessage}\n${errorFormat(error)}`,
      })
      throw error
    }
  }

  return { fletsSeparateResponse, createFletsSeparate }
}

export const useUpdateIpoe = () => {
  const { t } = useI18n()
  const { API } = useAPI()
  const { setNotificationMessageState } = useNotificationDialog()
  const { isNovaView } = useNova()

  const updateIpoe = async (
    ipoeId: string,
    isFletsSeparate: boolean,
    request: FletsSeparatePutRequest | HikariCollaboPutRequest,
  ) => {
    const response = await API.PUT<
      FletsSeparateResponse | HikariCollaboResponse,
      FletsSeparatePutRequest | HikariCollaboPutRequest
    >(`ipoe/${isFletsSeparate ? 'separate-contract' : 'hikari-collabo'}/${ipoeId}`, { body: request })

    if (!isNovaView.value) {
      setNotificationMessageState({
        message: t('message.accepted'),
        orderId: response.orderId,
      })
    }

    return response
  }

  return { updateIpoe }
}

export const useDeleteFletsSeparate = () => {
  const { t } = useI18n()
  const { API } = useAPI()
  const { setNotificationMessageState } = useNotificationDialog()
  const { isNovaView } = useNova()

  const deleteDialog = ref(false)
  const deleteFletsSeparate = async (ipoeId: string) => {
    try {
      const response = await API.DELETE<FletsSeparateResponse>(`ipoe/separate-contract/${ipoeId}`)
      // 新UIでは削除後にダイアログを表示しない
      if (!isNovaView.value) {
        setNotificationMessageState({ message: t('message.deleted') })
      }
      return response
    } finally {
      deleteDialog.value = false
    }
  }

  return { deleteDialog, deleteFletsSeparate }
}

export const useDeleteHikariCollabo = () => {
  const { t } = useI18n()
  const { API } = useAPI()
  const { setNotificationMessageState } = useNotificationDialog()

  const deleteHikariCollabo = async (ipoeId: string, body: HikariCollaboDeleteRequest) => {
    const response = await API.DELETE<HikariCollaboResponse, HikariCollaboDeleteRequest>(
      `ipoe/hikari-collabo/${ipoeId}`,
      { body },
    )
    setNotificationMessageState({ message: t('message.deleted') })
    return response
  }

  return { deleteHikariCollabo }
}

export const useIpoes = () => {
  const { t } = useI18n()

  const requestTypeOptions = Object.values(RequestTypes).map(value => ({ text: t(`ipoes.${value}`), value }))
  const novaRequestTypeOptions = Object.values(RequestTypes).map(value => ({ text: t(`nova.ipoes.${value}`), value }))
  const fletsTypeOptions = Object.values(FletsTypes).map(value => ({ text: t(`nova.ipoes.${value}`), value }))
  const ipoeTypeOptions = Object.values(IpoeTypes).map(value => ({ text: t(`nova.ipoes.${value}`), value }))
  const crossIpoeTypeOptions = ipoeTypeOptions.filter(({ value }) => value === IpoeTypes.SuperWide)
  const nextIpoeTypeOptions = ipoeTypeOptions.filter(({ value }) => value !== IpoeTypes.SuperWide)
  // スーパーワイドは、フレッツ回線別契約型で回線プランが光クロスの場合のみ選択できる
  const getFletsSeparateIpoeTypeOptions = (hikariPlan: HikariPlanType | '') =>
    hikariPlan === HikariPlans.Cross ? crossIpoeTypeOptions : nextIpoeTypeOptions
  const existOptions = [
    { text: t('nova.common.exist'), value: 'true' },
    { text: t('nova.common.nonExist'), value: 'false' },
  ]
  const fletsOpenOptions = [
    { text: t('nova.ipoes.opening'), value: 'true' },
    { text: t('nova.ipoes.unOpened'), value: 'false' },
  ]
  const photographConsentOptions = [
    { text: t('nova.ipoes.photographConsentTrue'), value: 'true' },
    { text: t('nova.ipoes.photographConsentFalse'), value: 'false' },
  ]
  const collectTypeOptions = Object.values(RemovalCollectTypes).map(value => ({
    value,
    text: t(`nova.ipoes.${value}`),
  }))
  const lanCollectOptions = [
    { value: 'true', text: t('ipoes.removalLanCollectTrue') },
    { value: 'false', text: t('ipoes.removalLanCollectFalse') },
  ]
  const kitSendInstallAddressSameOptions = [
    { value: 'true', text: t('ipoes.same') },
    { value: 'false', text: t('ipoes.difference') },
  ]
  const appControlOptions = [
    { text: t('nova.common.use'), value: 'true' },
    { text: t('nova.common.disuse'), value: 'false' },
  ]
  const hikariPlanOptions = [
    { text: t('nova.ipoes.hikariPlanNext'), value: HikariPlans.Next },
    { text: t('nova.ipoes.hikariPlanCross'), value: HikariPlans.Cross },
  ]

  const getHikariPlanText = (hikariPlan?: HikariPlanType) => {
    const found = hikariPlanOptions.find(option => option.value === hikariPlan)
    return found?.text ?? ''
  }
  const getIpoeTypeText = (ipoeType?: string) => {
    const found = ipoeTypeOptions.find(option => option.value === ipoeType)
    return found?.text ?? ''
  }
  const isWidePlanType = (ipoeType?: string) => ipoeType === IpoeTypes.Wide || ipoeType === IpoeTypes.SuperWide
  const getFletsOpenText = (fletsOpen?: boolean) => {
    const found = fletsOpenOptions.find(option => option.value === `${fletsOpen}`)
    return found?.text ?? ''
  }
  const getFletsTypeText = (fletsType?: FletsType) => {
    const found = fletsTypeOptions.find(option => option.value === fletsType)
    return found?.text ?? ''
  }
  const getCollectTypeText = (type?: RemovalCollectType) => {
    const found = collectTypeOptions.find(collectType => collectType.value === type)
    return found?.text ?? ''
  }
  const getLanCollectText = (bool?: boolean) => {
    const found = lanCollectOptions.find(lanCollect => lanCollect.value === `${bool}`)
    return found?.text ?? ''
  }
  const getKitSendInstallAddressSameText = (bool?: boolean) => {
    const found = kitSendInstallAddressSameOptions.find(option => option.value === `${bool}`)
    return found?.text ?? ''
  }
  const getExistText = (bool?: boolean | null) => {
    const found = existOptions.find(exist => exist.value === `${bool}`)
    return found?.text ?? ''
  }
  const getNecessaryText = (bool?: boolean) => {
    const found = bool ? t('common.necessary') : t('common.unnecessary')
    return typeof bool === 'boolean' ? found : ''
  }

  return {
    requestTypeOptions,
    novaRequestTypeOptions,
    fletsTypeOptions,
    hikariPlanOptions,
    ipoeTypeOptions,
    crossIpoeTypeOptions,
    nextIpoeTypeOptions,
    getFletsSeparateIpoeTypeOptions,
    existOptions,
    fletsOpenOptions,
    photographConsentOptions,
    collectTypeOptions,
    lanCollectOptions,
    kitSendInstallAddressSameOptions,
    appControlOptions,
    getIpoeTypeText,
    isWidePlanType,
    getFletsOpenText,
    getFletsTypeText,
    getCollectTypeText,
    getLanCollectText,
    getKitSendInstallAddressSameText,
    getExistText,
    getNecessaryText,
    getHikariPlanText,
  }
}
