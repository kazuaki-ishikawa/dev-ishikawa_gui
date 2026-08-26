import { useI18n } from 'vue-i18n'
import { ResourceStatusTypes } from '@/api/constants'
import { LIST_TOTAL_MAX_LENGTH } from '@/api/breakOut/constants'
import type {
  BreakOutPostRequest,
  BreakOutPutRequest,
  BreakOutListQuery,
  BreakOutListResponse,
  BreakOutResponse,
  InitialBreakOutDataType,
} from '@/api/breakOut/types'

export const useGetBreakOutList = () => {
  const { API } = useAPI()

  const getBreakOutListResponse = ref<BreakOutListResponse | null>(null)
  const getBreakOutList = async (query?: BreakOutListQuery) => {
    try {
      const response = await API.GET<BreakOutListResponse, BreakOutListQuery>('break-out-lists', {
        query: {
          resourceStatus: [ResourceStatusTypes.Active, ResourceStatusTypes.Inactive],
          ...query,
        },
      })
      getBreakOutListResponse.value = response
      return response
    } catch (error) {
      getBreakOutListResponse.value = null
      throw error
    }
  }

  const breakOutList = computed(() => getBreakOutListResponse.value?.breakOutLists ?? [])
  const customerNoteList = computed(() =>
    breakOutList.value.map(breakOut => ({ id: breakOut.breakOutListId, customerNote: breakOut.customerNote })),
  )

  return { breakOutList, customerNoteList, getBreakOutList }
}

export const useGetBreakOut = () => {
  const { API } = useAPI()

  const breakOut = ref<BreakOutResponse | null>(null)
  const getBreakOut = async (breakOutListId: string) => {
    try {
      const response = await API.GET<BreakOutResponse>(`break-out-lists/${breakOutListId}`)
      breakOut.value = response
      return response
    } catch (error) {
      breakOut.value = null
      throw error
    }
  }

  return { breakOut, getBreakOut }
}

export const useCreateBreakOut = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const createBreakOut = async (request: BreakOutPostRequest) => {
    const response = await API.POST<BreakOutResponse, BreakOutPostRequest>('break-out-lists', { body: request })
    setNotificationMessageState({
      message: t('message.accepted'),
      orderId: response.orderId,
    })
    return response
  }

  return { createBreakOut }
}

export const useUpdateBreakOut = () => {
  const { API } = useAPI()

  const updateBreakOut = async (breakOutListId: string, request: BreakOutPutRequest) => {
    const response = await API.PUT<BreakOutResponse, BreakOutPutRequest>(`break-out-lists/${breakOutListId}`, {
      body: request,
    })
    return response
  }

  return { updateBreakOut }
}

export const useDeleteBreakOut = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const deleteDialog = ref(false)
  const deleteBreakOut = async (breakOutListId: string) => {
    try {
      const response = await API.DELETE<BreakOutResponse>(`break-out-lists/${breakOutListId}`)
      setNotificationMessageState({ message: t('message.deleted') })
      return response
    } finally {
      deleteDialog.value = false
    }
  }

  return { deleteDialog, deleteBreakOut }
}

export const useBreakOut = () => {
  const { t } = useI18n()
  const { breakOutOptions } = useTerminalInput()

  const getBreakOutListOptions = (breakOutValueList: string[], breakOutList: BreakOutResponse[]) =>
    breakOutValueList.map(value => {
      // breakOutOptions(固定値) から値を取得
      const foundStaticValue = breakOutOptions.find(option => option.value === value)
      if (foundStaticValue) {
        return foundStaticValue
      }
      // BreakOutList から値を取得
      const foundBreakOut = breakOutList.find(option => option.breakOutListId === value)
      if (foundBreakOut) {
        return { value, text: foundBreakOut.customerNote, breakOut: foundBreakOut }
      }
      // どちらからも見つからない場合はidをそのまま表示する
      return { value, text: value }
    })

  const formatBreakOutPostRequest = (data: InitialBreakOutDataType): BreakOutPostRequest => ({
    customerNote: data.customerNote,
    fqdnList: data.fqdnList ? Array.from(new Set(data.fqdnList.split('\n').filter(Boolean))) : undefined,
    prefixList: data.prefixList ? Array.from(new Set(data.prefixList.split('\n').filter(Boolean))) : undefined,
  })

  const lengthRule = (length: number) => () =>
    length <= LIST_TOTAL_MAX_LENGTH || t('breakOut.invalid.listTotalMaxLength')

  return { getBreakOutListOptions, formatBreakOutPostRequest, lengthRule }
}
