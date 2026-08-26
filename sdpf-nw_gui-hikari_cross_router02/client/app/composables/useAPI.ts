import { FetchError } from 'ofetch'
import { useI18n } from 'vue-i18n'
import type {
  SessionResponse,
  OptionType,
  DownloadDocumentResponse,
  DecodedDownloadDocumentResponse,
  ErrorResponse,
} from '@/api/types'

export const useAPI = () => {
  const apiServer = import.meta.env.NUXT_PUBLIC_API_SERVER

  const route = useRoute()
  const { t } = useI18n()
  const { setLoadingState } = useLoading()
  const { setNotificationMessageState } = useNotificationDialog()

  const backend = useState('backend', () => '')
  const rinkMobileBackend = useState('rinkMobileBackend', () => '')
  const idaasBackend = useState('idaasBackend', () => '')
  const msbBackend = useState('msbBackend', () => '')
  const showMsbMenu = useState('showMsbMenu', () => false)
  const showDirectSales = useState('showDirectSales', () => false)
  const authToken = useState('authToken', () => '') // 開発専用

  function fetcher<T>(url: string, fetchOptions: OptionType) {
    if (import.meta.env.USE_STUB) {
      return $fetch<T>(url, {
        onRequest: ({ options }) => {
          options.headers.set('x-auth-token', authToken.value)
        },
        ...fetchOptions,
      })
    }
    return $fetch<T>(url, fetchOptions)
  }

  const getCasvalSession = async (params: { tenant_id: string; refresh?: true }) => {
    try {
      setLoadingState('start')
      const url = `${apiServer}/session`
      const response = await $fetch<SessionResponse>(url, {
        params,
        onResponse({ response }) {
          authToken.value = response.headers.get('x-auth-token') ?? ''
        },
      })
      if (!response?.backend) {
        throw new Error('Session response is invalid')
      }
      backend.value = response.backend[0]
      rinkMobileBackend.value = response.backend[1]
      idaasBackend.value = response.backend[2]
      msbBackend.value = response.backend[3]
      showMsbMenu.value = !!response.auth.menus?.includes('sss.menu.rink_msb')
      showDirectSales.value = !!response.auth.menus?.includes('rink.direct_sales')
      return Promise.resolve()
    } catch (error) {
      backend.value = ''
      rinkMobileBackend.value = ''
      idaasBackend.value = ''
      msbBackend.value = ''
      showMsbMenu.value = false
      showDirectSales.value = false
      return Promise.reject(error)
    } finally {
      setLoadingState('end')
    }
  }

  async function sessionProxy<T>(
    tenantId: string,
    path: string,
    options: OptionType,
    { isRinkMobile = false, isIdaas = false, isMsb = false } = {},
  ): Promise<T> {
    setLoadingState('start')
    try {
      // backend が空ということはリロード直後なのでセッションを取得する
      if (backend.value === '') {
        await getCasvalSession({ tenant_id: tenantId })
      }
      const fetchUrl = isRinkMobile
        ? `${rinkMobileBackend.value}/tenants/${tenantId}/${path}`
        : isIdaas
          ? `${idaasBackend.value}/${path}`
          : isMsb
            ? `${msbBackend.value}/${path}`
            : `${backend.value}/${path}`
      const response = await fetcher<T>(fetchUrl, options)
      return Promise.resolve(response)
    } catch (error) {
      if (!(error instanceof FetchError)) {
        return Promise.reject(error)
      }
      // Casval のセッション期限切れの場合には errorCode === 401, errorMessage === 'Authorization failed.' が返ってくる
      // それ以外はリトライの対象外となるためそのままエラーとして返す
      if (error.data.errorCode !== 401 || error.data.errorMessage !== 'Authorization failed.') {
        return Promise.reject(error)
      }
    } finally {
      setLoadingState('end')
    }

    // 401 が返ってきたのでセッションを再取得してリトライ
    setLoadingState('start')
    try {
      await getCasvalSession({ tenant_id: tenantId, refresh: true })
      const fetchUrl = isRinkMobile
        ? `${rinkMobileBackend.value}/tenants/${tenantId}/${path}`
        : isIdaas
          ? `${idaasBackend.value}/${path}`
          : isMsb
            ? `${msbBackend.value}/${path}`
            : `${backend.value}/${path}`
      const response = await fetcher<T>(fetchUrl, options)
      return Promise.resolve(response)
    } catch (error) {
      return Promise.reject(error)
    } finally {
      setLoadingState('end')
    }
  }

  const downloadTermsOfService = (query: {
    documents: Array<{ name: string; uuid: string }>
  }): Promise<DecodedDownloadDocumentResponse[]> => {
    const promises = query.documents.map(async document => {
      try {
        setLoadingState('start')
        const response = await sessionProxy<DownloadDocumentResponse>(
          route.params.tenantId as string,
          'download-terms-of-service',
          {
            method: 'get',
            query: { documentId: document.uuid },
          },
        )
        return Promise.resolve({
          title: document.name,
          content: decodeURIComponent(
            Array.prototype.map
              .call(atob(response.content), c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join(''),
          ),
        })
      } catch (error) {
        return Promise.reject(error)
      } finally {
        setLoadingState('end')
      }
    })
    return Promise.all(promises)
  }

  async function simpleRequest<T>(params: {
    path: string
    method: 'get' | 'post' | 'put' | 'patch' | 'delete'
    body?: object
    query?: object
    suppressErrorDialog?: boolean
    apiType?: 'rinkMobile' | 'idaas' | 'msb'
  }) {
    try {
      return await sessionProxy<T>(
        route.params.tenantId as string,
        params.path,
        {
          method: params.method,
          body: params.body,
          query: params.query,
        },
        {
          isRinkMobile: params.apiType === 'rinkMobile',
          isIdaas: params.apiType === 'idaas',
          isMsb: params.apiType === 'msb',
        },
      )
    } catch (error) {
      if (!params.suppressErrorDialog) {
        setNotificationMessageState({ message: `${t('message.failed')}\n${errorFormat(error as ErrorResponse)}` })
      }
      return Promise.reject(error)
    }
  }

  async function allRequest<T extends { total?: number }, Q extends { limit: number }>(params: {
    path: string
    query: Q
    suppressErrorDialog?: boolean
    apiType?: 'rinkMobile' | 'idaas' | 'msb'
  }) {
    try {
      setLoadingState('start')

      const firstResponse = await simpleRequest<T>({
        path: params.path,
        method: 'get',
        query: { ...params.query, offset: 0 },
        apiType: params.apiType,
        suppressErrorDialog: true,
      })

      const counts = Math.ceil((firstResponse?.total ?? 0) / params.query.limit)

      // counts分を取得するためループする
      const promises = [...Array(counts)].map((_, index) => {
        if (index === 0) {
          return Promise.resolve(firstResponse)
        }

        // RINK MOBILE API の場合は offset は件数ベースで指定する必要があるため、index * limit で計算する
        const offset = params.apiType === 'rinkMobile' ? index * params.query.limit : index
        return simpleRequest<T>({
          path: params.path,
          method: 'get',
          query: { ...params.query, offset },
          apiType: params.apiType,
          suppressErrorDialog: true,
        })
      })

      const responses = await Promise.all<T>(promises)
      return Promise.resolve(responses) as Promise<T[]>
    } catch (error) {
      if (!params.suppressErrorDialog) {
        setNotificationMessageState({ message: `${t('message.failed')}\n${errorFormat(error as ErrorResponse)}` })
      }
      return Promise.reject(error)
    } finally {
      setLoadingState('end')
    }
  }

  // 単体・リスト GET
  function GET<T, Q extends object = never>(path: string, data?: { query?: Q; suppressErrorDialog?: boolean }) {
    return simpleRequest<T>({
      path,
      method: 'get',
      ...data,
    })
  }

  // 全件取得 GET
  function ALL<T extends { total?: number }, Q extends { limit: number }>(
    path: string,
    data: {
      query: Q
      suppressErrorDialog?: boolean
    },
  ) {
    return allRequest<T, Q>({ path, ...data })
  }

  // POST
  function POST<T, B extends object = never>(path: string, data?: { body?: B; suppressErrorDialog?: boolean }) {
    return simpleRequest<T>({ path, method: 'post', ...data })
  }
  // PUT
  function PUT<T, B extends object = never>(path: string, data?: { body?: B; suppressErrorDialog?: boolean }) {
    return simpleRequest<T>({ path, method: 'put', ...data })
  }
  // DELETE
  function DELETE<T, D extends object = never>(path: string, data?: { body?: D; suppressErrorDialog?: boolean }) {
    return simpleRequest<T>({ path, method: 'delete', ...data })
  }

  const RINK_MOBILE_API = {
    GET<T, Q extends object = never>(path: string, data?: { query?: Q; suppressErrorDialog?: boolean }) {
      return simpleRequest<T>({ path, method: 'get', apiType: 'rinkMobile', ...data })
    },
    // 全件取得 GET
    ALL<T extends { total?: number }, Q extends { limit: number }>(
      path: string,
      data: {
        query: Q
        suppressErrorDialog?: boolean
      },
    ) {
      return allRequest<T, Q>({ path, apiType: 'rinkMobile', ...data })
    },
    POST<T, B extends object = never, Q extends object = never>(
      path: string,
      data?: { body?: B; query?: Q; suppressErrorDialog?: boolean },
    ) {
      return simpleRequest<T>({ path, method: 'post', apiType: 'rinkMobile', ...data })
    },
    PUT<T, B extends object = never>(path: string, data?: { body?: B; suppressErrorDialog?: boolean }) {
      return simpleRequest<T>({ path, method: 'put', apiType: 'rinkMobile', ...data })
    },
    DELETE<T, B extends object = never>(path: string, data?: { body?: B; suppressErrorDialog?: boolean }) {
      return simpleRequest<T>({ path, method: 'delete', apiType: 'rinkMobile', ...data })
    },
  }

  const IDAAS_API = {
    GET<T, Q extends object = never>(path: string, data?: { query?: Q; suppressErrorDialog?: boolean }) {
      return simpleRequest<T>({ path, method: 'get', apiType: 'idaas', ...data })
    },
    // 全件取得 GET
    ALL<T extends { total?: number }, Q extends { limit: number }>(
      path: string,
      data: { query: Q; suppressErrorDialog?: boolean },
    ) {
      return allRequest<T, Q>({ path, apiType: 'idaas', ...data })
    },
    POST<T, B extends object = never>(path: string, data?: { body?: B; suppressErrorDialog?: boolean }) {
      return simpleRequest<T>({ path, method: 'post', apiType: 'idaas', ...data })
    },
    PUT<T, B extends object = never>(path: string, data?: { body?: B; suppressErrorDialog?: boolean }) {
      return simpleRequest<T>({ path, method: 'put', apiType: 'idaas', ...data })
    },
    DELETE<T>(path: string, data?: { suppressErrorDialog?: boolean }) {
      return simpleRequest<T>({ path, method: 'delete', apiType: 'idaas', ...data })
    },
  }

  const MSB_API = {
    GET<T, Q extends object = never>(path: string, data?: { query?: Q; suppressErrorDialog?: boolean }) {
      return simpleRequest<T>({ path, method: 'get', apiType: 'msb', ...data })
    },
    POST<T, B extends object = never>(path: string, data?: { body?: B; suppressErrorDialog?: boolean }) {
      return simpleRequest<T>({ path, method: 'post', apiType: 'msb', ...data })
    },
    PATCH<T, B extends object = never>(path: string, data?: { body?: B; suppressErrorDialog?: boolean }) {
      return simpleRequest<T>({ path, method: 'patch', apiType: 'msb', ...data })
    },
    DELETE<T, B extends object = never>(path: string, data?: { body?: B; suppressErrorDialog?: boolean }) {
      return simpleRequest<T>({ path, method: 'delete', apiType: 'msb', ...data })
    },
  }

  return {
    API: { GET, ALL, POST, PUT, DELETE },
    RINK_MOBILE_API,
    IDAAS_API,
    MSB_API,
    showMsbMenu: readonly(showMsbMenu),
    showDirectSales: readonly(showDirectSales),
    getCasvalSession,
    downloadTermsOfService,
  }
}
