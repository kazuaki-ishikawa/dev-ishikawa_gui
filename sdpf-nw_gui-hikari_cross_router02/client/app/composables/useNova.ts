import { useI18n } from 'vue-i18n'
import { ResourceStatusTypes } from '@/api/constants'
import { RouteName } from '@/route/constants'

// 新UI(nova)用のcomposable（リリース後は削除予定）
type RouteNameTree = string | { [key: string]: RouteNameTree }
const createList = (obj: RouteNameTree): string[] => {
  if (typeof obj === 'string') {
    return [obj]
  } else {
    return Object.values(obj).flatMap(createList)
  }
}
const RouteNameSet = new Set(Object.values(RouteName).flatMap(createList))

export const useNova = () => {
  const route = useRoute()

  const isNovaView = computed(() => {
    const routeName = route.name?.toString() || ''
    return RouteNameSet.has(routeName) || routeName.includes('nova')
  })

  return { isNovaView }
}

export const useNovaResourceStatusOptions = () => {
  const { t } = useI18n()

  return computed(() =>
    [
      ResourceStatusTypes.Active,
      ResourceStatusTypes.Inactive,
      ResourceStatusTypes.Terminated,
    ].map(value => ({
      text: t(`nova.common.resourceStatus.${value}`),
      value,
    })),
  )
}
