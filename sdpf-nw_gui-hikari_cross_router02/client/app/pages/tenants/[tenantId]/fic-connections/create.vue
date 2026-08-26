<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { FIC_URL } from '@/api/ficConnections/constants'
import type { FicConnectionPostRequest } from '@/api/ficConnections/types'
import { TenantPages } from '@/components/sidebar/constants'

const FicConnectionRequestType = {
  ficConnection: 'fic-connection',
  simpleFicConnection: 'simple-fic-connection',
} as const

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const tenantId = computed(() => route.params.tenantId as string)
const openCreatedDialog = ref(false)
const { navigationGuard } = useNavigationGuard()
const requestType = ref({ input: '', valid: false })
watch(requestType, () => {
  navigationGuard(requestType.value.valid)
})

const { getSummaryVpnList, unterminatedVpnListOptions } = useGetSummaryVpnList()
const { customerNoteList, getFicConnectionList } = useGetFicConnectionList()
const { ficConnection, createFicConnection } = useCreateFicConnection()

const requestTypeOptions = computed(() =>
  Object.entries(FicConnectionRequestType).map(([key, value]) => ({
    text: t(`fic.${key}`),
    value,
    help: value === FicConnectionRequestType.simpleFicConnection ? t('fic.help.simpleFicConnection') : undefined,
  })),
)
const showCreation = computed(() => requestType.value.input === 'showCreation')

const moveToTutorial = async () => {
  await navigateTo(
    requestType.value.input === FicConnectionRequestType.ficConnection
      ? FIC_URL.FIC_TUTORIAL
      : FIC_URL.SIMPLE_FIC_TUTORIAL,
    {
      open: { target: '_blank', windowFeatures: { noopener: true, noreferrer: true } },
    },
  )
}
const moveToFicConsole = async () => {
  const ficConsoleURL = (window as { ficConsoleURL?: string }).ficConsoleURL ?? ''
  await navigateTo(
    { path: ficConsoleURL, query: { tenant_id: tenantId.value } },
    {
      open: { target: '_blank', windowFeatures: { noopener: true, noreferrer: true } },
    },
  )
}
const handleSimpleFicConnection = async () => {
  const simpleFicConnectionURL = (window as { consoleSolutionURL?: string }).consoleSolutionURL ?? ''
  await navigateTo(
    { path: simpleFicConnectionURL, query: { tenant_id: tenantId.value } },
    {
      open: { target: '_blank', windowFeatures: { noopener: true, noreferrer: true } },
    },
  )
}
const handleCreationSubmit = async (data: FicConnectionPostRequest) => {
  await createFicConnection(data)
  navigationGuard(false)
  openCreatedDialog.value = true
}

const moveToOrderDetail = async () => {
  await navigateTo(`/tenants/${tenantId.value}/${TenantPages.Orders}/${ficConnection.value?.orderId}`, {
    replace: true,
  })
}

onBeforeMount(() => {
  getSummaryVpnList()
  getFicConnectionList()
})
</script>

<template>
  <CardContainer>
    <template v-if="!showCreation">
      <InnerCard :title="t('fic.requestType')">
        <template #help>
          <i18n-t keypath="fic.help.ficType" scope="global">
            <template #linkText1>
              <NuxtLink :to="FIC_URL.FIC_TUTORIAL" target="_blank">
                {{ t('common.here') }}
              </NuxtLink>
            </template>
            <template #linkText2>
              <NuxtLink :to="FIC_URL.SIMPLE_FIC_TUTORIAL" target="_blank">
                {{ t('common.here') }}
              </NuxtLink>
            </template>
          </i18n-t>
        </template>
        <RadioForm
          v-model="requestType.input"
          :options="requestTypeOptions"
          required
          class="pt-3"
          data-cy="fic-connections-create-request-type-radio-button"
          @valid="(valid: boolean) => (requestType.valid = valid)"
        />
      </InnerCard>

      <div v-if="requestType.input === FicConnectionRequestType.simpleFicConnection" class="mb-5">
        <div class="font-weight-bold text-lg">{{ t('fic.help.explanation-1') }}</div>
        <i18n-t keypath="fic.help.explanation-2" tag="div" scope="global" class="text-pre-wrap pl-4">
          <template #here>
            <NuxtLink :to="FIC_URL.SIMPLE_FIC_EXPLANATION" target="_blank">
              {{ t('common.here') }}
            </NuxtLink>
          </template>
        </i18n-t>
        <div class="mt-6 font-weight-bold text-lg">{{ t('fic.help.explanation-3') }}</div>
        <div class="pl-4 text-pre-wrap">{{ t('fic.help.explanation-4') }}</div>
        <ul class="ma-0">
          <li>{{ t('fic.help.explanation-5') }}</li>
          <li>{{ t('fic.help.explanation-6') }}</li>
        </ul>
      </div>

      <CustomButton
        v-if="requestType.input"
        class="mb-5"
        icon="up-right-square"
        :width="280"
        :text="t('fic.createTutorial')"
        @click="moveToTutorial"
      />

      <FicConnectionImage
        v-if="requestType.input === FicConnectionRequestType.ficConnection"
        data-cy="fic-connection-image"
        @click="requestType.input = 'showCreation'"
      />
      <SimpleFicConnectionImage
        v-if="requestType.input === FicConnectionRequestType.simpleFicConnection"
        data-cy="simple-fic-connection-image"
        @click="handleSimpleFicConnection"
      />
    </template>

    <FicConnectionCreate
      v-if="showCreation"
      :vpn-list-options="unterminatedVpnListOptions"
      :customer-note-list="customerNoteList"
      @submit="handleCreationSubmit"
      @cancel="router.back()"
    />

    <DialogBase :open="openCreatedDialog" @close="router.back()">
      <i18n-t tag="div" keypath="fic.message.created" scope="global" class="text-pre-wrap mb-5">
        <template #sellerKey>
          <div class="break-all">{{ ficConnection?.publicServiceKey }}</div>
        </template>
      </i18n-t>

      <template #footer>
        <div class="flex-center-center ga-4">
          <CustomButton
            icon="right-arrow"
            :text="t('common.moveToOrderDetail')"
            :width="280"
            color="info"
            data-cy="fic-connection-create-dialog-move-to-order-detail-button"
            @click="moveToOrderDetail"
          />
          <CustomButton
            icon="right-arrow"
            :text="t('fic.moveToConnectionCreation')"
            :width="280"
            size="large"
            data-cy="fic-connection-create-dialog-move-to-fic-console-button"
            @click="moveToFicConsole"
          />
        </div>
      </template>
    </DialogBase>
  </CardContainer>
</template>

<style lang="scss" scoped>
.break-all {
  word-break: break-all;
}
</style>
