import { ResourceStatusTypes, SortDirectionTypes } from '@/api/constants'
import { RouteName } from '@/route/constants'

export function getRouteQuery(page: string) {
  const query = { resourceStatus: [ResourceStatusTypes.Active, ResourceStatusTypes.Inactive] }

  const needsResourceStatusSort = (
    [RouteName.Terminal.List, RouteName.Ipoe.List, RouteName.Guarantee.List] as string[]
  ).includes(page)
  if (needsResourceStatusSort) {
    return { ...query, sortKey: 'resourceStatus', direction: SortDirectionTypes.Asc }
  }

  const needsResourceStatus = [
    RouteName.Vpn.List,
    RouteName.FicConnection.List,
    RouteName.BreakOut.List,
    RouteName.UnoConnection.List,
  ].includes(page)
  if (needsResourceStatus) {
    return query
  }
}
