import { useI18n } from 'vue-i18n'
import type { MobileResponse, MobilePutRequest } from '@/api/mobile/types'

export const useGetMobile = () => {
  // 子コンポーネントで使うので useState で管理する
  const mobileDiscountCodeState = useState<string>('mobileDiscountCodeState', () => '')

  const { API } = useAPI()

  const mobile = ref<MobileResponse | null>(null)
  const getMobile = async () => {
    try {
      const response = await API.GET<MobileResponse>('settings/mobile')
      mobileDiscountCodeState.value = response?.mobileDiscountCode ?? ''
      mobile.value = response
      return response
    } catch (error) {
      mobileDiscountCodeState.value = ''
      mobile.value = null
      throw error
    }
  }

  return { mobileDiscountCode: readonly(mobileDiscountCodeState), mobile, getMobile }
}

export const useUpdateMobile = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const inputMobile = ref<MobilePutRequest>({ mobileDiscountCode: null })
  const updateMobile = async (request: MobilePutRequest) => {
    const response = await API.PUT<MobileResponse, MobilePutRequest>('settings/mobile', { body: request })
    setNotificationMessageState({ message: t('message.updated') })
    return response
  }

  return { inputMobile, updateMobile }
}
