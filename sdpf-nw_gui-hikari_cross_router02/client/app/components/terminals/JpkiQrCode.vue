<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const jpkiRequestId = defineModel<string>('jpkiRequestId', { required: true })

type Emits = {
  (e: 'valid', valid: boolean): void
}
const emit = defineEmits<Emits>()

const { t } = useI18n()

const { jpkiRequestLoading, jpkiRequest, createJpkiRequest } = useCreateJpkiRequest()
const { isJpkiAuthenticationCompleted, isJpkiAuthenticationAborted, resetJpkiRequestStatus, getJpkiRequestStatus } =
  useGetJpkiRequestStatus()

const POLLING_INTERVAL = 3000
const pollingTimerId = ref<number | undefined>(undefined)
const isMounted = ref(true)

const startPolling = (requestId: string) => {
  if (!isMounted.value || pollingTimerId.value) {
    return
  }
  const poll = async () => {
    try {
      jpkiRequestId.value = requestId
      await getJpkiRequestStatus(requestId)

      // 完了 or 失敗したらポーリング停止
      if (isJpkiAuthenticationCompleted.value || isJpkiAuthenticationAborted.value) {
        stopPolling()
        emit('valid', isJpkiAuthenticationCompleted.value)
        return
      }
    } catch {
      stopPolling()
      emit('valid', false)
    }

    // ポーリング継続
    if (isMounted.value && pollingTimerId.value) {
      pollingTimerId.value = window.setTimeout(poll, POLLING_INTERVAL)
    }
  }

  pollingTimerId.value = window.setTimeout(poll, 0)
}

const stopPolling = () => {
  if (pollingTimerId.value) {
    window.clearTimeout(pollingTimerId.value)
    pollingTimerId.value = undefined
  }
}

// QRコード発行（初回 or 再発行）
const generateQrCode = async () => {
  // ポーリング停止と認証状態をリセット
  emit('valid', false)
  stopPolling()
  resetJpkiRequestStatus()

  jpkiRequest.value = undefined
  const response = await createJpkiRequest()
  // POST 待機中に unmount された場合はポーリングを開始しない
  if (!isMounted.value) {
    return
  }
  if (response?.jpkiRequestId) {
    startPolling(response.jpkiRequestId)
  } else {
    jpkiRequestId.value = ''
  }
}

// マウント時にQRコードを発行
onMounted(() => {
  if (!isJpkiAuthenticationCompleted.value) {
    generateQrCode()
  }
})

onUnmounted(() => {
  isMounted.value = false
  stopPolling()
})
</script>

<template>
  <div>
    <CustomButton
      class="mt-3"
      :text="t('terminals.jpkiQrCodeReissue')"
      :disabled="jpkiRequestLoading"
      :width="240"
      data-cy="jpki-qr-code-reissue"
      @click="generateQrCode"
    />
    <div class="d-flex justify-center">
      <QrCode :uri="jpkiRequest?.url" />
    </div>
  </div>
</template>
