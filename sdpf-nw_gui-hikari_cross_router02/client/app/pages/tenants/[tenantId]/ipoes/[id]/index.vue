<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { ResourceStatusTypes } from '@/api/constants'
import { HikariPlans, RemovalCollectTypes } from '@/api/ipoes/constants'
import { OrderResourceTypes } from '@/api/orders/constants'
import { ReserveDateTypes } from '@/api/hikariCollaboUtil/constants'
import { TenantPages, ContractsPages } from '@/components/sidebar/constants'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { loading } = useLoading()

const tenantId = computed(() => route.params.tenantId as string)
const ipoeId = computed(() => route.params.id as string)
const fieldSurveyReserveDialog = ref(false)
const constructionReserveDialog = ref(false)
const visitCollectionDialog = ref(false)
const { lineOutDialogOpen, closeLineOutDialog, initializeLineOutDialog } = useLineOutDialog()

const { getExistText } = useIpoes()
const { getIpoe, getHikariCollabo, fletsSeparate, hikariCollabo, editable, isFletsSeparate, isHikariCollabo } =
  useGetIpoe()
const { deleteDialog, deleteFletsSeparate } = useDeleteFletsSeparate()
const handleRemoveFletsSeparate = async () => {
  await deleteFletsSeparate(ipoeId.value)
  // フレッツ回線別契約回線の削除に成功した場合、一覧画面に戻る
  return navigateTo({ path: `/tenants/${tenantId.value}/${TenantPages.Ipoes}` })
}

const { availableTime, checkAvailableTime } = useCheckAvailableTime()
const { contractor, getContractor } = useGetContractor()
const { disabledFletsSeparateApplication } = useApplicationRestriction()

const showRemovalInfo = computed(() => !!hikariCollabo.value?.removal)
const fieldSurveyButtonDisabled = computed(
  () =>
    !!hikariCollabo.value?.fieldSurvey?.date ||
    !!hikariCollabo.value?.ticketIssueRequirement ||
    (!hikariCollabo.value?.fieldSurveyRequirement && !hikariCollabo.value?.constructionOption?.siteRouteSurvey),
)
const constructionButtonDisabled = computed(
  () =>
    !!hikariCollabo.value?.construction?.date ||
    !!hikariCollabo.value?.ticketIssueRequirement ||
    !fieldSurveyButtonDisabled.value,
)
const visitCollectionButtonDisabled = computed(
  () => hikariCollabo.value?.removal?.collectType !== RemovalCollectTypes.Visit || !!hikariCollabo.value?.removal?.date,
)
const isOutsideReceptionHour = computed(() => !isFletsSeparate.value && !availableTime.value?.available)
const hasEmptyAddressCode = computed(() => !isFletsSeparate.value && !contractor.value?.addressCode)
const isHikariCross = computed(() => fletsSeparate.value?.hikariPlan === HikariPlans.Cross)
const isLineOut = computed(
  () =>
    hikariCollabo.value?.resourceStatus === ResourceStatusTypes.Inactive &&
    !!hikariCollabo.value?.ticketIssueRequirement &&
    !hikariCollabo.value?.fletsId,
)

const moveToPage = async (page: 'edit' | 'diversion') => {
  await navigateTo({ path: `${route.path}/${page}` })
}

const handleDelete = () => {
  if (isFletsSeparate.value) {
    deleteDialog.value = true
  } else if (isHikariCollabo.value) {
    return navigateTo({ path: `${route.path}/remove` })
  }
}
const fieldSurveyReserveDialogSubmit = async () => {
  await getHikariCollabo(ipoeId.value)
  fieldSurveyReserveDialog.value = false
  constructionReserveDialog.value = true
}
const reserveDialogSubmit = async () => {
  // 宅内工事日と訪問回収日の予約が完了したら、光コラボ回線の情報を再取得する
  await getHikariCollabo(ipoeId.value)
  constructionReserveDialog.value = false
  visitCollectionDialog.value = false
}

onBeforeMount(async () => {
  await getIpoe(ipoeId.value)
  checkAvailableTime()
  getContractor()
  initializeLineOutDialog({
    show: isLineOut.value,
    resourceType: OrderResourceTypes.Ipoe,
    resourceId: ipoeId.value,
  })
})
</script>

<template>
  <CardContainer>
    <FletsSeparateDetail v-if="isFletsSeparate" :flets-separate="fletsSeparate" :tenant-id="tenantId" />
    <HikariCollaboDetail
      v-else-if="isHikariCollabo"
      :hikari-collabo="hikariCollabo"
      :tenant-id="tenantId"
      :show-removal-info="showRemovalInfo"
    >
      <template #siteRouteSurvey>
        <DetailGrid>
          <div>{{ t('ipoes.siteRouteSurvey') }}</div>
          <div>{{ getExistText(hikariCollabo?.constructionOption?.siteRouteSurvey) }}</div>
        </DetailGrid>
      </template>
      <template #constructionResultReport>
        <DetailGrid>
          <div>{{ t('ipoes.constructionResultReport') }}</div>
          <div>{{ getExistText(hikariCollabo?.constructionOption?.constructionResultReport) }}</div>
        </DetailGrid>
      </template>
      <template #fieldSurveyButton>
        <div class="mb-1 flex-flex-end-center">
          <CustomButton
            class="ml-auto"
            icon="right-arrow"
            :text="t('ipoeConstruction.fieldSurveyDateReserve')"
            :width="180"
            :disabled="fieldSurveyButtonDisabled || showRemovalInfo"
            data-cy="ipoes-id-index-field-survey-date-reserve-button"
            @click="fieldSurveyReserveDialog = true"
          />
        </div>
      </template>
      <template #constructionButton>
        <div class="mb-1 flex-flex-end-center">
          <CustomButton
            class="ml-auto"
            icon="right-arrow"
            :text="t('ipoeConstruction.constructionDateReserve')"
            :disabled="constructionButtonDisabled || showRemovalInfo"
            :width="180"
            data-cy="ipoes-id-index-construction-date-reserve-button"
            @click="constructionReserveDialog = true"
          />
        </div>
      </template>
      <template #removalButton>
        <div v-if="showRemovalInfo" class="mb-1 flex-flex-end-center">
          <CustomButton
            class="ml-auto"
            icon="right-arrow"
            :text="t('ipoeConstruction.visitCollectionDateReserve')"
            :width="180"
            :disabled="visitCollectionButtonDisabled"
            data-cy="ipoes-id-index-visit-collection-date-reserve-button"
            @click="visitCollectionDialog = true"
          />
        </div>
      </template>
    </HikariCollaboDetail>

    <div class="grid-flow-col justify-end ga-4 pt-2">
      <CustomButton
        color="info"
        icon="left-arrow"
        :text="t('common.return')"
        :width="180"
        data-cy="ipoes-id-index-return-button"
        @click="router.back()"
      />
      <CustomButton
        color="warning"
        icon="right-arrow"
        :text="t('common.delete')"
        :width="180"
        :disabled="
          !editable ||
          isOutsideReceptionHour ||
          hasEmptyAddressCode ||
          loading ||
          (isFletsSeparate && disabledFletsSeparateApplication)
        "
        data-cy="ipoes-id-index-delete-button"
        @click="handleDelete"
      />
      <CustomButton
        v-if="isFletsSeparate"
        icon="right-arrow"
        :text="t('ipoes.diversion')"
        :width="180"
        :disabled="!editable || isOutsideReceptionHour || isHikariCross || loading || disabledFletsSeparateApplication"
        data-cy="ipoes-id-index-diversion-button"
        @click="moveToPage('diversion')"
      />
      <CustomButton
        icon="right-arrow"
        :text="t('common.edit')"
        :width="180"
        :disabled="!editable || loading"
        data-cy="ipoes-id-index-edit-button"
        @click="moveToPage('edit')"
      />
    </div>
    <div v-if="isOutsideReceptionHour" class="text-right pl-6 pt-2 text-warning">
      {{ t('ipoes.message.outsideReceptionHour') }}
    </div>
    <i18n-t
      v-else-if="hasEmptyAddressCode"
      tag="div"
      keypath="ipoes.message.addressCodeRequired"
      scope="global"
      class="text-right pl-6 pt-2 text-warning"
    >
      <template #contractor>
        <NuxtLink
          :to="`/tenants/${tenantId}/${TenantPages.Contracts}/${ContractsPages.Contractor}`"
          class="text-warning"
        >
          {{ t('sideBar.contractor') }}
        </NuxtLink>
      </template>
    </i18n-t>

    <DeleteConfirmationDialog
      :open="deleteDialog"
      type="flets"
      :data="{ id: fletsSeparate?.ipoeId, customerNote: fletsSeparate?.customerNote }"
      data-cy="ipoe-id-index-delete-confirmation-dialog"
      @submit="handleRemoveFletsSeparate"
      @close="deleteDialog = false"
    />
    <ReserveDateDialog
      v-if="!!hikariCollabo"
      :type="ReserveDateTypes.FieldSurvey"
      :open="fieldSurveyReserveDialog"
      :hikari-collabo="hikariCollabo"
      @submit="fieldSurveyReserveDialogSubmit"
      @close="fieldSurveyReserveDialog = false"
    />
    <ReserveDateDialog
      v-if="!!hikariCollabo"
      :type="ReserveDateTypes.Construction"
      :open="constructionReserveDialog"
      :hikari-collabo="hikariCollabo"
      @submit="reserveDialogSubmit"
      @close="constructionReserveDialog = false"
    />
    <ReserveDateDialog
      v-if="!!hikariCollabo"
      :type="ReserveDateTypes.Removal"
      :open="visitCollectionDialog"
      :hikari-collabo="hikariCollabo"
      @submit="reserveDialogSubmit"
      @close="visitCollectionDialog = false"
    />
    <LineOutDialog
      :open="lineOutDialogOpen"
      data-cy="ipoes-id-index-line-out-dialog"
      @close="hideNextTime => closeLineOutDialog(hideNextTime)"
    />
  </CardContainer>
</template>

<style lang="scss" scoped>
.grid-flow-col {
  display: grid;
  grid-auto-flow: column;
}
</style>
