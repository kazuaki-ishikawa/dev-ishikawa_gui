import { TenantPages } from '@/components/sidebar/constants'
import { ResourceStatusTypes, SortDirectionTypes } from '@/api/constants'
import type { TenantPageType, SubMenuType } from '@/components/sidebar/types'

export const useSidebar = () => {
  const getQuery = (page: TenantPageType): SubMenuType['query'] => {
    const query = { resourceStatus: [ResourceStatusTypes.Active, ResourceStatusTypes.Inactive] }

    const needsResourceStatusSort = (
      [TenantPages.Terminals, TenantPages.Ipoes, TenantPages.Guarantees] as string[]
    ).includes(page)
    if (needsResourceStatusSort) {
      return { ...query, sortKey: 'resourceStatus', direction: SortDirectionTypes.Asc }
    }

    const needsResourceStatus = [TenantPages.Vpns, TenantPages.Fic, TenantPages.BreakOutLists].includes(page)
    if (needsResourceStatus) {
      return query
    }
  }

  return { getQuery }
}
