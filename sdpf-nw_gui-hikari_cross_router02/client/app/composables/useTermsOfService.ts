import { useI18n } from 'vue-i18n'
import type { ErrorResponse, DecodedDownloadDocumentResponse } from '@/api/types'
import { TermsOfServiceBasePath } from '@/api/termsOfService/constants'
import type {
  TermsOfServiceBasePathType,
  TermsOfServiceAcceptedResponse,
  TermsOfServiceResponse,
  TermsOfServiceAgreePostRequest,
  ConvertedTermsOfServiceResponse,
} from '@/api/termsOfService/types'
import { ContractsPages, TenantPages } from '@/components/sidebar/constants'

export const useTermsOfService = (basePath: TermsOfServiceBasePathType) => {
  const { API, downloadTermsOfService } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()
  const { setSuccessSnackBarState } = useSnackBar()
  const { isNovaView } = useNova()

  const subMenuPath = computed(() =>
    basePath === TermsOfServiceBasePath.Mobile ? 'mobile-terms-of-service' : 'terms-of-service',
  )

  // 子コンポーネントで使うので useState で管理する
  const trafficReportFlowAnalyzerTermsOfServiceAcceptedState = useState<boolean>(
    'trafficReportFlowAnalyzerTermsOfServiceAcceptedState',
    () => false,
  )
  const securityTermsOfServiceAcceptedState = useState<boolean>('securityTermsOfServiceAcceptedState', () => false)
  const moveToSecurityTermOfService = async (tenantId: string) => {
    if (isNovaView) {
      console.log('TODO: 遷移先不明、同意文のページへ遷移する')
      return
    }
    await navigateTo(
      `/tenants/${tenantId}/${TenantPages.Contracts}/${ContractsPages.SecurityTrafficReportFlowAnalyzer}`,
      { open: { target: '_blank', windowFeatures: { noopener: true, noreferrer: true } } },
    )
  }

  const termsOfServiceAccepted = ref<boolean>(false)
  const getTermsOfServiceAccepted = async () => {
    try {
      const response = await API.GET<TermsOfServiceAcceptedResponse>(basePath)
      termsOfServiceAccepted.value = response.termsOfServiceAccepted
      if (basePath === TermsOfServiceBasePath.TrafficReportFlowAnalyzer) {
        trafficReportFlowAnalyzerTermsOfServiceAcceptedState.value = response.termsOfServiceAccepted
      }
      if (basePath === TermsOfServiceBasePath.Security) {
        securityTermsOfServiceAcceptedState.value = response.termsOfServiceAccepted
      }
      return response
    } catch (error) {
      termsOfServiceAccepted.value = false
      throw error
    }
  }

  const termsOfServiceResponse = ref<TermsOfServiceResponse | null>(null)
  const getTermsOfService = async () => {
    try {
      const response = await API.GET<TermsOfServiceResponse>(`${basePath}/${subMenuPath.value}`)
      termsOfServiceResponse.value = response
      return response
    } catch (error) {
      termsOfServiceResponse.value = null
      throw error
    }
  }
  const termsOfService = computed<ConvertedTermsOfServiceResponse | null>(() =>
    termsOfServiceResponse.value
      ? {
          ...termsOfServiceResponse.value,
          termsOfService: Object.entries(termsOfServiceResponse.value.termsOfService).map(([key, value]) => ({
            name: key,
            uuid: value,
          })),
        }
      : null,
  )

  const agreeTermsOfService = async (request: TermsOfServiceAgreePostRequest) => {
    await API.POST<TermsOfServiceResponse, TermsOfServiceAgreePostRequest>(`${basePath}/${subMenuPath.value}/agree`, {
      body: request,
    })
    if (basePath === TermsOfServiceBasePath.TrafficReportFlowAnalyzer) {
      trafficReportFlowAnalyzerTermsOfServiceAcceptedState.value = true
    }
    if (basePath === TermsOfServiceBasePath.Security) {
      securityTermsOfServiceAcceptedState.value = true
    }
    setSuccessSnackBarState(true)
  }

  const downloadTermsOfServiceList = ref<DecodedDownloadDocumentResponse[]>([])
  const getDownloadTermsOfServiceList = async (termsOfService: Array<{ name: string; uuid: string }>) => {
    try {
      downloadTermsOfServiceList.value = await downloadTermsOfService({ documents: termsOfService })
      return Promise.resolve()
    } catch (error) {
      downloadTermsOfServiceList.value = []
      setNotificationMessageState({ message: `${t('message.failed')}\n${errorFormat(error as ErrorResponse)}` })
      return Promise.reject(error)
    }
  }

  return {
    trafficReportFlowAnalyzerTermsOfServiceAccepted: readonly(trafficReportFlowAnalyzerTermsOfServiceAcceptedState),
    securityTermsOfServiceAccepted: readonly(securityTermsOfServiceAcceptedState),
    moveToSecurityTermOfService,
    termsOfServiceAccepted,
    getTermsOfServiceAccepted,
    termsOfService,
    getTermsOfService,
    agreeTermsOfService,
    downloadTermsOfServiceList,
    getDownloadTermsOfServiceList,
  }
}
