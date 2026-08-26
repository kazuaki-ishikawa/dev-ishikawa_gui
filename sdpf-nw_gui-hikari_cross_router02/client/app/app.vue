<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { TermsOfServiceBasePath } from '@/api/termsOfService/constants'
import { RinkMobilePages, TenantPages } from '@/components/sidebar/constants'

const { t } = useI18n()
const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)

const { isNovaView } = useNova()

const { openSuccessSnackBar, setSuccessSnackBarState } = useSnackBar()
const {
  openNotificationDialog,
  notificationMessage,
  orderIdState,
  bulkOrderIdState,
  isRinkMobileState,
  isRinkLineGroupState,
  setNotificationMessageState,
} = useNotificationDialog()

const { openApiErrorDialog, apiErrorMessage, setApiErrorMessageState } = useApiErrorDialog()

const successSnackBarClose = () => {
  setSuccessSnackBarState(false)
}
const notificationDialogClose = () => {
  setNotificationMessageState()
}
const closeApiErrorDialog = () => {
  setApiErrorMessageState()
}

useMouseEventEmitter('click')

const notificationDialogSubmitButton = computed(() => {
  if (orderIdState.value) {
    // orderId が指定されたときはオーダー詳細画面に遷移ボタンを表示する
    return {
      label: t('common.moveToOrderDetail'),
      click: async () => {
        await navigateTo(`/tenants/${tenantId.value}/${TenantPages.Orders}/${orderIdState.value}`)
        notificationDialogClose()
      },
      width: 280,
    }
  } else if (bulkOrderIdState.value) {
    // bulkOrderId が指定された場合は query に bulkOrderId を付与してオーダー一覧画面に遷移する
    return {
      label: t('common.moveToOrderList'),
      click: async () => {
        await navigateTo({
          path: `/tenants/${tenantId.value}/${TenantPages.Orders}`,
          query: { bulkOrderId: bulkOrderIdState.value },
        })
        notificationDialogClose()
      },
      width: 280,
    }
  } else if (isRinkMobileState.value || isRinkLineGroupState.value) {
    return {
      label: t('rinkConnections.moveToTop'),
      click: async () => {
        await navigateTo(`/tenants/${tenantId.value}/${TenantPages.RinkMobile}/${RinkMobilePages.Contracts}`)
        notificationDialogClose()
      },
      width: 280,
    }
  } else {
    return undefined
  }
})
const notificationDialogCancelButton = computed(() => {
  if (isRinkLineGroupState.value) {
    return {
      label: t('rinkConnections.moveToLineGroups'),
      click: notificationDialogClose,
      width: 280,
    }
  }
  return undefined
})

const { getMobile } = useGetMobile()
const { getTermsOfServiceAccepted: getTrafficReportFlowAnalyzerTermsOfServiceAccepted } = useTermsOfService(
  TermsOfServiceBasePath.TrafficReportFlowAnalyzer,
)
const { getTermsOfServiceAccepted: getSecurityTermsOfServiceAccepted } = useTermsOfService(
  TermsOfServiceBasePath.Security,
)
const { getSettingsBehaviorDetection } = useGetSettingsBehaviorDetection()

// useState を使うために app.vue で 実行する
watch(
  tenantId,
  next => {
    if (next) {
      getMobile()
      getTrafficReportFlowAnalyzerTermsOfServiceAccepted()
      getSecurityTermsOfServiceAccepted()
      getSettingsBehaviorDetection()
    }
  },
  { immediate: true },
)

// LoadingAnimation の表示を限定する
const ShowLoadingAnimationList = [
  'tenants-tenantId-monitoring-operation-status-id-self-check',
  'tenants-tenantId-monitoring-operation-status-id-fic-routes',
  'tenants-tenantId-security-contracts-download',
]
const loadingMessage = ref('')
const { loading, loadingAnimation } = useLoading()
const showLoadingAnimation = computed(
  () => (loading.value && ShowLoadingAnimationList.includes(route.name as string)) || loadingAnimation.value,
)
watch(
  [showLoadingAnimation, () => route.name],
  ([show]) => {
    if (!show) {
      loadingMessage.value = ''
    } else if (route.name === 'tenants-tenantId-monitoring-operation-status-id-self-check') {
      loadingMessage.value = t('selfCheck.loadingMessage')
    } else if (route.name === 'tenants-tenantId-security-contracts-download') {
      loadingMessage.value = t('flowCollectors.message.downloadMessage')
    } else if (isNovaView.value) {
      loadingMessage.value = 'nova view loading message'
    }
  },
  { immediate: true },
)
watch(openNotificationDialog, () => {
  if (openNotificationDialog.value) {
    // 通知ダイアログが開いたときは大抵画面遷移が行われるので、自動で画面上部にスクロールさせる
    window.scrollTo(0, 0)
  }
})
</script>

<template>
  <v-app>
    <!-- SnackBar だけ共通にしておく -->
    <SnackBar
      :open="openSuccessSnackBar"
      :text="t('message.succeeded')"
      color="success"
      @close="successSnackBarClose"
    />
    <template v-if="!isNovaView">
      <LoadingMain v-if="showLoadingAnimation" :message="loadingMessage" />

      <NotificationDialog
        :open="openNotificationDialog"
        :message="notificationMessage"
        :submit-button="notificationDialogSubmitButton"
        :cancel-button="notificationDialogCancelButton"
        @close="notificationDialogClose"
      />
      <ApiErrorDialog :open="openApiErrorDialog" :message="apiErrorMessage" @close="closeApiErrorDialog" />
    </template>
    <template v-else>
      <v-overlay :model-value="showLoadingAnimation" class="align-center justify-center">
        <div class="text-center">
          <div class="my-2">show loading: {{ loadingMessage }}</div>
          <v-progress-circular :size="70" :width="10" color="primary" indeterminate />
        </div>
      </v-overlay>
      <v-dialog :model-value="openNotificationDialog || openApiErrorDialog" max-width="50%" persistent>
        <v-card>
          <v-card-title>{{ openNotificationDialog ? 'Notification' : 'API Error' }} Dialog</v-card-title>
          <v-card-text class="text-pre-wrap">{{ notificationMessage || apiErrorMessage }}</v-card-text>
          <v-card-actions class="mx-auto">
            <v-btn
              color="primary"
              text="閉じる"
              width="200"
              variant="tonal"
              @click="openNotificationDialog ? notificationDialogClose() : closeApiErrorDialog()"
            />
          </v-card-actions>
        </v-card>
      </v-dialog>
    </template>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </v-app>
</template>
