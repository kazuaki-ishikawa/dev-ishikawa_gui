import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import type { ErrorResponse } from '@/api/types'
import type { TimeType } from '@/api/hikariCollaboUtil/types'
import { SearchDateTypes } from '@/api/iwanUtil/constants'
import type {
  SearchAddressRequest,
  SearchAddressResponse,
  JudgeRequest,
  JudgeResponse,
  SearchDateRequest,
  SearchDateResponse,
  ConstructionDateType,
  RegistrationAddressPostRequest,
  RegistrationAddressResponse,
} from '@/api/iwanUtil/types'

const mergeAddressList = (original?: string[], list?: string[], hasNextRequestNumber?: boolean) => {
  // nextRequestNumber で取得時にマージする
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
    }
  }
}

export const useIwanUtilSearchAddress = () => {
  const { API } = useAPI()

  // ギャランティ回線新規作成画面 -> 設置場所住所登録依頼 の時に使うため state を使う
  const iwanUtilAddressCandidateState = useState<SearchAddressResponse | null>(
    'iwanUtilAddressCandidateState',
    () => null,
  )
  const selectedRequestKeys = ref<string[]>([])

  const iwanUtilSearchAddress = async (request: SearchAddressRequest) => {
    const response = await API.POST<SearchAddressResponse, SearchAddressRequest>('iwan-util/search-address', {
      body: request,
    })
    selectedRequestKeys.value = Object.keys(request).filter(key => !!request[key as keyof SearchAddressRequest])
    iwanUtilAddressCandidateState.value = filterAddressCandidate({
      original: iwanUtilAddressCandidateState.value,
      address: response,
      request: request,
    })
    return response
  }

  const clearIwanUtilSearchAddress = () => {
    iwanUtilAddressCandidateState.value = null
    selectedRequestKeys.value = []
  }

  return {
    iwanUtilAddressCandidate: shallowReadonly(iwanUtilAddressCandidateState),
    selectedRequestKeys: shallowReadonly(selectedRequestKeys),
    iwanUtilSearchAddress,
    clearIwanUtilSearchAddress,
  }
}

export const useIwanUtilJudgeAddressCode = () => {
  const { API } = useAPI()

  const iwanUtilJudged = ref<JudgeResponse | null>(null)
  const iwanUtilJudgeAddressCode = async (request: JudgeRequest) => {
    try {
      const response = await API.POST<JudgeResponse, JudgeRequest>('iwan-util/judge', { body: request })
      iwanUtilJudged.value = response
      return response
    } catch (error) {
      iwanUtilJudged.value = null
      throw error
    }
  }

  return { iwanUtilJudged, iwanUtilJudgeAddressCode }
}

export const useIwanUtilSearchDate = () => {
  const { API } = useAPI()

  const searchedDate = ref<SearchDateResponse | null>(null)
  const iwanUtilSearchDate = async (request: SearchDateRequest) => {
    try {
      const formattedRequest = {
        ...request,
        // admissionApplicationRequired は type = fieldSurvey の場合に必須
        admissionApplicationRequired:
          request.type === SearchDateTypes.FieldSurvey ? !!request.admissionApplicationRequired : undefined,
        // fieldSurveyLess は type = construction の場合に必須
        fieldSurveyLess: request.type === SearchDateTypes.Construction ? !!request.fieldSurveyLess : undefined,
        // fieldSurveyDate は type = construction かつ fieldSurveyLess = false の場合に必須
        fieldSurveyDate:
          request.type === SearchDateTypes.Construction && !request.fieldSurveyLess
            ? request.fieldSurveyDate
            : undefined,
      }
      const response = await API.GET<SearchDateResponse, SearchDateRequest>('iwan-util/search-date', {
        query: formattedRequest,
      })
      searchedDate.value = response
      return response
    } catch (error) {
      searchedDate.value = null
      throw error
    }
  }

  // 希望日選択用の処理
  const yearMonth = ref<string>()
  const yearMonthOptions = ref<Array<{ value: string; text: string }>>([])
  // 最初にテーブルを表示する時の処理（yearMonthOptionsを作るために一度初期値を取得する必要がある）
  const getFirstReservableDate = async ({
    searchDateRequest,
    currentYearMonth,
  }: {
    searchDateRequest: SearchDateRequest
    currentYearMonth?: string // YYYY-MM
  }) => {
    // 基準月を取得して yearMonthOptions を作る
    await iwanUtilSearchDate(searchDateRequest)
    const baseDate =
      searchedDate.value?.constructionDates && !!searchedDate.value.constructionDates?.[0]
        ? searchedDate.value.constructionDates[0].scheduledDate
        : undefined
    const minYearMonth = dayjs(baseDate).format('YYYY-MM')

    yearMonthOptions.value = [...Array(6)]
      .map((_, index) => {
        // 基準月は今月で、+5か月先までリストにする
        const value = dayjs().add(index, 'months').format('YYYY-MM')
        return { value, text: value.replace('-', '/') }
      })
      // minYearMonth より前の月はリストから除外する
      .filter(({ value }) => dayjs(value).isSameOrAfter(dayjs(minYearMonth), 'months'))

    if (!!currentYearMonth && dayjs(minYearMonth).isBefore(dayjs(currentYearMonth), 'months')) {
      // 選択中のカレンダーを表示するための処理
      iwanUtilSearchDate({ ...searchDateRequest, yearMonth: currentYearMonth })
      yearMonth.value = currentYearMonth
    } else {
      yearMonth.value = minYearMonth
    }
  }

  // 宅内工事の初回希望日を searchedDate.constructionsDate に追加する
  // date: 初回希望日
  // time: 初回希望時間帯
  // fieldSurveyDate: 現調希望日
  // yearMonth: searchDate 実行時の yearMonth
  const addOriginalReservedDate = (date: string, time: TimeType, fieldSurveyDate: string, yearMonth?: string) => {
    // searchDate 実行時の yearMonth と初回の希望日が違う場合 or
    // 初回の希望日が過去日の場合 or
    // fieldSurveyDate がある場合 かつ fieldSurveyDate + 16暦日 以前の場合は何もしない
    if (
      yearMonth !== dayjs(date).format('YYYY-MM') ||
      dayjs().isAfter(date, 'days') ||
      (fieldSurveyDate && dayjs(date).diff(fieldSurveyDate, 'days') < 16)
    ) {
      return
    }
    const constructionDates =
      searchedDate.value?.constructionDates.reduce<ConstructionDateType[]>((constructionDates, cur) => {
        const scheduledTimes = cur.scheduledTimes?.map(({ scheduledTime }) => scheduledTime) ?? []
        // 初回希望日は含まれるが初回希望時間帯が含まれない場合
        if (cur.scheduledDate === date && !scheduledTimes.includes(time)) {
          constructionDates.push({
            scheduledDate: cur.scheduledDate,
            scheduledTimes: [...scheduledTimes, time].map(scheduledTime => ({ scheduledTime })),
          })
        } else {
          constructionDates.push(cur)
        }
        return constructionDates
      }, []) ?? []

    const scheduledDates = searchedDate.value?.constructionDates?.map(({ scheduledDate }) => scheduledDate) ?? []
    if (!scheduledDates.includes(date)) {
      // 初回希望日が含まれなかった場合
      constructionDates.push({
        scheduledDate: date,
        scheduledTimes: [{ scheduledTime: time }],
      })
      constructionDates.sort((a, b) => {
        if (dayjs(a.scheduledDate).isAfter(dayjs(b.scheduledDate), 'days')) {
          return 1
        } else {
          return -1
        }
      })
    }
    searchedDate.value = { constructionDates }
  }

  return {
    searchedDate,
    iwanUtilSearchDate,
    yearMonth,
    yearMonthOptions,
    getFirstReservableDate,
    addOriginalReservedDate,
  }
}

export const useRegistrationAddress = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const registrationAddress = async (request: RegistrationAddressPostRequest) => {
    try {
      const formattedRequest = Object.entries(request).reduce(
        (acc, [key, value]) => ({ ...acc, [key]: value || undefined }),
        {} as RegistrationAddressPostRequest,
      )
      const response = await API.POST<RegistrationAddressResponse, RegistrationAddressPostRequest>(
        'iwan-util/registration-address',
        { body: formattedRequest, suppressErrorDialog: true },
      )
      setNotificationMessageState({
        message: t('addressRegistrationRequest.createdMessage'),
        orderId: response.orderId,
      })
      return response
    } catch (e) {
      const error = e as ErrorResponse
      const message =
        error.statusCode === 500
          ? t('guarantees.outsideReceptionHourApiError')
          : `${t('message.failed')}\n${errorFormat(error)}`
      setNotificationMessageState({ message })
      throw error
    }
  }

  return { registrationAddress }
}
