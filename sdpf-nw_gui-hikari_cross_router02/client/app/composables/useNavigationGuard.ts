import { useI18n } from 'vue-i18n'

type NavigationGuardType = {
  navigationGuard: (navigation: boolean) => void
}

export const useNavigationGuard = (): NavigationGuardType => {
  const { t } = useI18n()
  const guard = ref(false)
  const navigationGuard = (navigation: boolean) => (guard.value = navigation)

  onBeforeRouteLeave(() => {
    if (!guard.value) {
      return
    }
    const answer = window.confirm(t('confirm.leave'))
    if (!answer) {
      return false
    }
  })

  return { navigationGuard }
}
