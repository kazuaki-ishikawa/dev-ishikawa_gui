import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import type { ErrorResponse } from '@/api/types'
import type {
  CampaignListQuery,
  CampaignListResponse,
  CampaignPostRequest,
  CampaignDeleteRequest,
  CampaignResponse,
} from '@/api/campaigns/types'

export const useGetCampaignList = () => {
  const { API } = useAPI()

  const campaigns = ref<CampaignResponse[]>([])
  const getCampaignList = async (query: CampaignListQuery) => {
    try {
      const response = await API.GET<CampaignListResponse, CampaignListQuery>('campaigns', { query })
      // キャンペーンの終了日が過ぎているものは表示しないが、終了日が設定されていないものは表示する
      campaigns.value = response.campaigns.filter(
        campaign => !campaign.expirationTime || dayjs().isBefore(campaign.expirationTime),
      )
      return response
    } catch (error) {
      campaigns.value = []
      throw error
    }
  }

  return { campaigns, getCampaignList }
}

export const useCreateCampaign = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const createCampaign = async (request: CampaignPostRequest) => {
    try {
      const response = await API.POST<CampaignResponse, CampaignPostRequest>('campaigns', {
        body: request,
        suppressErrorDialog: true,
      })
      return response
    } catch (e) {
      const error = e as ErrorResponse
      const message =
        error.data?.errorCode === 500
          ? t('guarantees.outsideReceptionHourApiError')
          : `${t('message.failed')}\n${errorFormat(error)}`
      setNotificationMessageState({ message })
      throw error
    }
  }

  return { createCampaign }
}

export const useDeleteCampaign = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const deleteDialog = ref(false)
  const deleteCampaign = async (body: CampaignDeleteRequest) => {
    try {
      const response = await API.DELETE<CampaignResponse, CampaignDeleteRequest>('campaigns', { body })
      setNotificationMessageState({ message: t('campaign.quitCampaignMessage') })
      return response
    } finally {
      deleteDialog.value = false
    }
  }

  return { deleteDialog, deleteCampaign }
}
