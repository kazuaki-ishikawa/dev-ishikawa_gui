type TenantListType = {
  tenantId: string
}
export const useTenant = () => {
  const apiServer = import.meta.env.NUXT_PUBLIC_API_SERVER
  const tenantList = useState<TenantListType[]>('tenantList', () => [])
  const setTenantList = (list: TenantListType[] | undefined) => {
    tenantList.value = list ?? []
  }
  const url = `${apiServer}/ztgict/v1/tenants`
  const { data, status, error, execute: getTenantList } = useFetch<TenantListType[]>(url, { immediate: false })
  watch([status, error], () => {
    if (status.value === 'success' && !error.value) {
      setTenantList(data.value)
    } else {
      setTenantList([])
    }
  })

  return { tenantList, getTenantList }
}
