export const useSnackBar = () => {
  const openSuccessSnackBar = useState('openSuccessSnackBar', () => false)
  const timeoutId = useState<ReturnType<typeof globalThis.setTimeout> | undefined>('snackBarTimeoutId', () => undefined)

  const setSuccessSnackBarState = (open: boolean) => {
    if (timeoutId.value !== undefined) {
      globalThis.clearTimeout(timeoutId.value)
      timeoutId.value = undefined
    }

    openSuccessSnackBar.value = open

    if (open) {
      timeoutId.value = globalThis.setTimeout(() => {
        openSuccessSnackBar.value = false
        timeoutId.value = undefined
      }, 3000)
    }
  }

  return { openSuccessSnackBar, setSuccessSnackBarState }
}
