import { useI18n } from 'vue-i18n'
import type { OrderResourceType } from '@/api/orders/types'
import type { MOBILE_INFORMATION_KEYS } from '@/api/terminals/constants'
import type { TerminalInputDataType, TerminalMobileInputDataType } from '@/api/terminals/types'

type LocalStorageTerminalType = {
  name: string
  terminal: TerminalInputDataType
  mobile: Pick<TerminalMobileInputDataType, (typeof MOBILE_INFORMATION_KEYS)[number]>
}
// key が timestamp(Date.now()) の値になる
type LocalStorageItemType = [string, LocalStorageTerminalType]

const TERMINAL_MAX_LENGTH = 10

export const useTerminalLocalStorage = () => {
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()
  const localStorageKeyName = computed(() => {
    const tenantId = useRoute().params.tenantId as string
    return `${tenantId}_terminalData`
  })

  const localStorageItemMapState = useState<Map<string, LocalStorageTerminalType>>(
    'localStorageItemMapState',
    () => new Map(),
  )
  const localStorageItemState = useState<LocalStorageTerminalType | undefined>('localStorageItemState', () => undefined)

  const getLocalStorageItemList = () => {
    const parsedLocalStorageItem = JSON.parse(localStorage.getItem(localStorageKeyName.value) ?? 'null')
    localStorageItemMapState.value = Array.isArray(parsedLocalStorageItem)
      ? new Map(parsedLocalStorageItem as LocalStorageItemType[])
      : new Map()
  }

  const getLocalStorageItem = (timestamp: string) => {
    localStorageItemState.value = localStorageItemMapState.value.get(timestamp)
  }
  const setLocalStorageItem = (item: LocalStorageTerminalType) => {
    const timestamp = `${Date.now()}`
    localStorageItemMapState.value.set(timestamp, item)
    localStorage.setItem(
      localStorageKeyName.value,
      JSON.stringify(Array.from(localStorageItemMapState.value.entries())),
    )
    setNotificationMessageState({ message: t('message.saved') })
  }

  const deleteLocalStorageItem = (timestamp: string) => {
    localStorageItemMapState.value.delete(timestamp)
    localStorage.setItem(
      localStorageKeyName.value,
      JSON.stringify(Array.from(localStorageItemMapState.value.entries())),
    )
  }

  const localStorageTableItems = computed(() =>
    Array.from(localStorageItemMapState.value.entries())
      .map(([timestamp, value]) => ({
        name: value.name,
        timestamp,
      }))
      .sort((a, b) => Number(b.timestamp) - Number(a.timestamp)),
  )
  const localStorageAddable = computed(() => localStorageTableItems.value.length < TERMINAL_MAX_LENGTH)

  const openLocalStorageTableDialogState = useState<'deleteOnly' | 'noLimit' | null>(
    'openLocalStorageTableDialogState',
    () => null,
  )
  const setOpenLocalStorageTableDialog = (status?: 'deleteOnly' | 'noLimit') => {
    // ダイアログを開くタイミングで localStorageItemState を初期化する
    if (status) {
      localStorageItemState.value = undefined
    }
    openLocalStorageTableDialogState.value = status ?? null
  }

  const showLocalStorageButtonState = useState('showLocalStorageButtonState', () => false)
  const setShowLocalStorageButton = (bool: boolean) => {
    showLocalStorageButtonState.value = bool
  }

  const openLocalStorageSaveDialogState = useState('openLocalStorageSaveDialogState', () => false)
  const setOpenLocalStorageSaveDialog = (bool = false) => {
    openLocalStorageSaveDialogState.value = bool
  }

  return {
    localStorageItemState,
    getLocalStorageItem,
    getLocalStorageItemList,
    setLocalStorageItem,
    deleteLocalStorageItem,
    localStorageTableItems,
    localStorageAddable,
    openLocalStorageTableDialog: readonly(openLocalStorageTableDialogState),
    setOpenLocalStorageTableDialog,
    showLocalStorageButton: readonly(showLocalStorageButtonState),
    setShowLocalStorageButton,
    openLocalStorageSaveDialog: readonly(openLocalStorageSaveDialogState),
    setOpenLocalStorageSaveDialog,
  }
}

export const useLineOutDialog = () => {
  const lineOutDialogOpen = ref(false)
  const localStorageKey = ref('')

  const clearLineOutDialogStorage = () => {
    localStorage.removeItem(localStorageKey.value)
  }

  const closeLineOutDialog = (hideNextTime: boolean) => {
    if (hideNextTime) {
      localStorage.setItem(localStorageKey.value, 'hideLineOutMessage')
    } else {
      clearLineOutDialogStorage()
    }
    lineOutDialogOpen.value = false
  }

  const initializeLineOutDialog = (data: { show: boolean; resourceType: OrderResourceType; resourceId: string }) => {
    localStorageKey.value = `${data.resourceType}.${data.resourceId}`
    if (!data.show) {
      clearLineOutDialogStorage()
      lineOutDialogOpen.value = false
    } else {
      lineOutDialogOpen.value = !localStorage.getItem(localStorageKey.value)
    }
  }

  return { lineOutDialogOpen, closeLineOutDialog, initializeLineOutDialog }
}
