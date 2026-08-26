import { isEqual } from 'es-toolkit'

type NavigationState = {
  name: string
  params: Record<string, string>
}

export const useMiddleware = () => {
  const allowedNavigation = useState<NavigationState | null>('allowedNavigation', () => null)

  const allowNavigation = (state: NavigationState) => {
    allowedNavigation.value = state
  }

  const consumeNavigation = (state: NavigationState) => {
    const isAllowed = isEqual(state, allowedNavigation.value)
    allowedNavigation.value = null
    return isAllowed
  }

  return {
    allowNavigation,
    consumeNavigation,
  }
}
