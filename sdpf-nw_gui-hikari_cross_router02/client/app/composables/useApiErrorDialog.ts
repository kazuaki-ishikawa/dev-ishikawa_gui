export const useApiErrorDialog = () => {
  const openApiErrorDialog = useState('openApiErrorDialog', () => false)
  const apiType = useState<'' | 'terminal' | 'fletsSeparate'>('apiType', () => '')
  const apiErrorMessage = useState('apiErrorMessage', () => '')

  const setApiErrorMessageState = (api?: { apiType: 'terminal' | 'fletsSeparate'; message: string }) => {
    // api?.message に値がある場合はダイアログを開く
    apiType.value = api?.apiType || ''
    apiErrorMessage.value = api?.message || ''
    openApiErrorDialog.value = !!api?.message
  }

  return {
    openApiErrorDialog: readonly(openApiErrorDialog),
    apiType: readonly(apiType),
    apiErrorMessage: readonly(apiErrorMessage),
    setApiErrorMessageState,
  }
}
