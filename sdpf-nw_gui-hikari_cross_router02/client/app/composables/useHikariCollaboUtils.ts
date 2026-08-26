import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import type { ErrorResponse } from '@/api/types'
import {
  BuildingTypes,
  AdmissionApplicationInfoTypes,
  ExpandedScheduledTime,
  DiversionContractTypes,
} from '@/api/hikariCollaboUtil/constants'
import type {
  ConstructionDateType,
  AdmissionApplicationInfoType,
  ExpandedTimeType,
  SearchAddressRequest,
  SearchAddressResponse,
  JudgeRequest,
  JudgeResponse,
  AvailableTimeResponse,
  SearchConstructionDateRequest,
  SearchConstructionDateResponse,
  ReserveConstructionDateRequest,
  HikariCollaboDiversionJudgeRequest,
  HikariCollaboDiversionJudgeResponse,
  HikariCollaboDiversionRequest,
} from '@/api/hikariCollaboUtil/types'
import type { HikariCollaboResponse } from '~/api/ipoes/types'

const mergeAddressList = (original?: string[], list?: string[], hasNextRequestNumber?: boolean) => {
  // nextRequestNumber で取得時にはマージする
  if (list && hasNextRequestNumber) {
    return Array.from(new Set([...(original ?? []), ...list]))
  }
  return list ? list : undefined
}

// 住所検索の建物名に含まれるべきではない文字列が返却されるケースがあるため、選択肢から除外する。(#13237)
const filterAddressCandidate = ({
  original,
  address,
  request,
}: {
  original: SearchAddressResponse | null
  address: SearchAddressResponse | null
  request: SearchAddressRequest
}) => {
  if (!address) {
    return original
  } else {
    const hasNextRequestNumber = !!request.nextRequestNumber
    return {
      ...address,
      municipalityList: mergeAddressList(original?.municipalityList, address.municipalityList, hasNextRequestNumber),
      largerSectionList: mergeAddressList(original?.largerSectionList, address.largerSectionList, hasNextRequestNumber),
      sectionList: mergeAddressList(original?.sectionList, address.sectionList, hasNextRequestNumber),
      houseNumber1List: mergeAddressList(original?.houseNumber1List, address.houseNumber1List, hasNextRequestNumber),
      houseNumber2List: mergeAddressList(original?.houseNumber2List, address.houseNumber2List, hasNextRequestNumber),
      houseNumber3List: mergeAddressList(original?.houseNumber3List, address.houseNumber3List, hasNextRequestNumber),
      buildingName1List: mergeAddressList(
        original?.buildingName1List,
        address.buildingName1List?.filter(v => !v.includes('※')),
        hasNextRequestNumber,
      ),
      buildingName2List: mergeAddressList(
        original?.buildingName2List,
        address.buildingName2List?.filter(v => !v.includes('※')),
        hasNextRequestNumber,
      ),
      buildingName3List: mergeAddressList(
        original?.buildingName3List,
        address.buildingName3List?.filter(v => !v.includes('※')),
        hasNextRequestNumber,
      ),
      buildingFacilityNameList: mergeAddressList(
        original?.buildingFacilityNameList,
        address.buildingFacilityNameList?.filter(v => !v.includes('※')),
        hasNextRequestNumber,
      ),
    }
  }
}

export const useSearchAddress = () => {
  const { t } = useI18n()
  const { API } = useAPI()
  const { setNotificationMessageState } = useNotificationDialog()

  const addressCandidate = ref<SearchAddressResponse | null>(null)
  const searchAddressErrorMessage = ref('')
  const selectedRequestKeys = ref<string[]>([])

  const searchAddress = async (request: SearchAddressRequest) => {
    try {
      searchAddressErrorMessage.value = ''
      const response = await API.POST<SearchAddressResponse, SearchAddressRequest>(
        'ipoe/hikari-collabo-util/search-address',
        { body: request, suppressErrorDialog: true },
      )
      selectedRequestKeys.value = Object.keys(request).filter(key => !!request[key as keyof SearchAddressRequest])
      addressCandidate.value = filterAddressCandidate({
        original: addressCandidate.value,
        address: response,
        request: request,
      })
      return response
    } catch (e) {
      const error = e as ErrorResponse
      if (request.buildingType === BuildingTypes.Apartment && error.statusCode === 400) {
        // buildingType === apartment かつ 400 の場合はメッセージ表示する
        searchAddressErrorMessage.value = t('message.searchAddress')
        addressCandidate.value = null
        selectedRequestKeys.value = []
      } else {
        setNotificationMessageState({ message: `${t('message.failed')}\n${errorFormat(error)}` })
      }
      throw error
    }
  }

  const clearSearchAddress = () => {
    addressCandidate.value = null
    searchAddressErrorMessage.value = ''
    selectedRequestKeys.value = []
  }

  return {
    searchAddress,
    addressCandidate: shallowReadonly(addressCandidate),
    searchAddressErrorMessage: readonly(searchAddressErrorMessage),
    selectedRequestKeys: shallowReadonly(selectedRequestKeys),
    clearSearchAddress,
  }
}

export const useJudgeAddressCode = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const judged = ref<JudgeResponse | null>(null)
  const showJudgeError = ref(false)
  const judgeAddressCode = async (request: JudgeRequest) => {
    try {
      showJudgeError.value = false
      const response = await API.POST<JudgeResponse, JudgeRequest>('ipoe/hikari-collabo-util/judge', {
        body: request,
        suppressErrorDialog: true,
      })
      judged.value = response
      return response
    } catch (e) {
      const error = e as ErrorResponse
      judged.value = null
      showJudgeError.value = error.data?.errorCode === 400 && error.data?.errorMessage === 'used accessline not found'
      if (!showJudgeError.value) {
        setNotificationMessageState({ message: `${t('message.failed')}\n${errorFormat(error)}` })
      }
      throw error
    }
  }

  return {
    judgeAddressCode,
    judged: shallowReadonly(judged),
    showJudgeError,
  }
}

export const useCheckAvailableTime = () => {
  const { API } = useAPI()

  const availableTime = ref<AvailableTimeResponse | null>(null)
  const checkAvailableTime = async () => {
    try {
      const response = await API.GET<AvailableTimeResponse>('ipoe/hikari-collabo-util/available')
      availableTime.value = response
      return response
    } catch (error) {
      availableTime.value = null
      throw error
    }
  }
  return { availableTime: readonly(availableTime), checkAvailableTime }
}

export const useSearchConstructionDate = () => {
  const { API } = useAPI()

  const constructionDates = ref<ConstructionDateType[]>([])
  const searchConstructionDate = async (ipoeId: string, query: SearchConstructionDateRequest) => {
    try {
      const response = await API.GET<SearchConstructionDateResponse, SearchConstructionDateRequest>(
        `ipoe/hikari-collabo/${ipoeId}/search-date`,
        { query },
      )
      constructionDates.value = response.constructionDates
      return response
    } catch (error) {
      constructionDates.value = []
      throw error
    }
  }

  return { constructionDates: readonly(constructionDates), searchConstructionDate }
}

export const useReserveConstructionDate = () => {
  const { API } = useAPI()

  const reserveConstructionDate = (ipoeId: string, request: ReserveConstructionDateRequest) =>
    API.POST<ReserveConstructionDateRequest, ReserveConstructionDateRequest>(
      `ipoe/hikari-collabo/${ipoeId}/reserve-date`,
      { body: request },
    )

  return { reserveConstructionDate }
}

export const useHikariCollaboDiversion = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const judgedResponse = ref<HikariCollaboDiversionJudgeResponse>()
  const postHikariCollaboDiversionJudge = async (ipoeId: string, request: HikariCollaboDiversionJudgeRequest) => {
    const response = await API.POST<HikariCollaboDiversionJudgeResponse, HikariCollaboDiversionJudgeRequest>(
      `ipoe/hikari-collabo-util/${ipoeId}/diversion/judge`,
      { body: request },
    )
    judgedResponse.value = response
    return response
  }

  const putHikariCollaboDiversion = async (ipoeId: string, request: HikariCollaboDiversionRequest) => {
    const response = await API.PUT<HikariCollaboResponse, HikariCollaboDiversionRequest>(
      `ipoe/hikari-collabo-util/${ipoeId}/diversion`,
      { body: request },
    )
    setNotificationMessageState({ message: t('message.accepted'), orderId: response.orderId })
    return response
  }

  return { judgedResponse, postHikariCollaboDiversionJudge, putHikariCollaboDiversion }
}

export const useHikariCollaboUtils = () => {
  const { t } = useI18n()

  const admissionApplicationInfoOptions = Object.values(AdmissionApplicationInfoTypes).map(value => ({
    text: t(`ipoes.${value}`),
    value,
  }))
  const getAdmissionApplicationInfoText = (type?: AdmissionApplicationInfoType) => {
    const found = admissionApplicationInfoOptions.find(info => info.value === type)
    return found?.text ?? ''
  }

  const buildingTypeOptions = Object.values(BuildingTypes).map(value => ({ value, text: t(`ipoes.${value}`) }))
  const getYearMonthOptions = (minDate: string) =>
    [...Array(6)].map((_, index) => {
      const value = dayjs(minDate).add(index, 'months').format('YYYY-MM')
      return { value, text: value.replaceAll('-', '/') }
    })

  const getTimeText = (time?: string | null) => {
    const found = Object.keys(ExpandedScheduledTime).find(key => key === time)
    return found && time ? ExpandedScheduledTime[time as ExpandedTimeType] : ''
  }

  const diversionContractTypeOptions = Object.values(DiversionContractTypes).map(value => ({
    text: t(`ipoes.${value}`),
    value,
  }))
  const getDiversionContractTypeText = (type?: string) => {
    const found = diversionContractTypeOptions.find(({ value }) => value === type)
    return found?.text ?? type
  }

  return {
    admissionApplicationInfoOptions,
    getAdmissionApplicationInfoText,
    getTimeText,
    buildingTypeOptions,
    getYearMonthOptions,
    diversionContractTypeOptions,
    getDiversionContractTypeText,
  }
}
