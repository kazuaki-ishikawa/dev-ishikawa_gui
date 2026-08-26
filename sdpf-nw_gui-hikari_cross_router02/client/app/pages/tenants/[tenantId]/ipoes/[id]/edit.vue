<script lang="ts" setup>
import dayjs from 'dayjs'
import { isEqual } from 'es-toolkit'
import { useI18n } from 'vue-i18n'
import { FletsOrderTypes, IPOE_LINK, MIN_BUSINESS_DAYS_UNTIL_AVAILABLE, IpoeTypes } from '@/api/ipoes/constants'
import type { IpoeType } from '@/api/ipoes/types'
import { ServiceClosedDaysServiceTypes } from '@/api/serviceClosedDays/constants'
import { IconTypes } from '@/components/icons/constants'

const { t } = useI18n()
const route = useRoute()
const rules = useRules()
const { navigationGuard } = useNavigationGuard()

const isConfirmation = ref(false)
const agreed = ref(false)

const inputData = ref({
  customerNote: '',
  ipoeType: '',
  appControl: '',
  onSiteRepairOption: 'false',
  changeEffectiveDate: '',
})
const inputValid = ref({
  customerNote: true,
  ipoeType: true,
  appControl: true,
  onSiteRepairOption: true,
  changeEffectiveDate: true,
})

const tenantId = computed(() => route.params.tenantId as string)
const ipoeId = computed(() => route.params.id as string)
const { loading } = useLoading()
const router = useRouter()

const {
  // 更新APIのIPoEアクセスプランは標準/ワイドのみ対応
  nextIpoeTypeOptions: ipoeTypeOptions,
  getHikariPlanText,
  getIpoeTypeText,
  existOptions,
  getFletsOpenText,
  getFletsTypeText,
  getExistText,
  getNecessaryText,
} = useIpoes()
const { getIpoe, fletsSeparate, hikariCollabo, isFletsSeparate, isHikariCollabo, editable } = useGetIpoe()
const { updateIpoe } = useUpdateIpoe()
const { customerNoteList, getAllSummaryIpoeList } = useGetAllSummaryIpoeList()
const { getTimeText, getAdmissionApplicationInfoText } = useHikariCollaboUtils()
const { availableTime, checkAvailableTime } = useCheckAvailableTime()
const { contractor, getContractor } = useGetContractor()
const { disabledDates, getServiceClosedDays, serviceClosedDaysFetchFailed } = useServiceClosedDays()

const currentData = computed(() => (isFletsSeparate.value ? fletsSeparate.value : hikariCollabo.value))
const originalData = computed(() => ({
  customerNote: currentData.value?.customerNote ?? '',
  ipoeType: currentData.value?.ipoeType ?? '',
  appControl: `${currentData.value?.appControl ?? ''}`,
  onSiteRepairOption: `${hikariCollabo.value?.onSiteRepairOption ?? 'false'}`,
  changeEffectiveDate: hikariCollabo.value?.changeEffectiveDate ?? '',
}))
const showChangeEffectiveDate = computed(
  () => originalData.value.onSiteRepairOption !== inputData.value.onSiteRepairOption,
)
// スーパーワイド（光クロス）のIPoEアクセスプランは更新APIが対応していないため変更不可
const isSuperWide = computed(() => originalData.value.ipoeType === IpoeTypes.SuperWide)
const isWidePlan = computed(() => inputData.value.ipoeType === IpoeTypes.Wide)
const showAppControlInput = computed(() => isWidePlan.value || isSuperWide.value)

watch(originalData, () => (inputData.value = { ...originalData.value }))
watchEffect(() => {
  navigationGuard(!isEqual(inputData.value, originalData.value))
})

const minDate = computed(() => calcMinDate(MIN_BUSINESS_DAYS_UNTIL_AVAILABLE, disabledDates))

const overAvailableTime = computed(() => !availableTime.value?.available)
const emptyAddressCode = computed(() => !contractor.value?.addressCode)
const onSiteRepairOptionDisabled = computed(() => {
  const isSameStartMonth =
    originalData.value.onSiteRepairOption === 'true' && dayjs().isSame(currentData.value?.serviceStartTime, 'months')
  return !isHikariCollabo.value || isSameStartMonth
})
const onSiteRepairOptionInputDisabled = computed(
  () => onSiteRepairOptionDisabled.value || isConfirmation.value || overAvailableTime.value || emptyAddressCode.value,
)
const showFieldSurveyInfo = computed(
  () => !!hikariCollabo.value?.constructionOption?.siteRouteSurvey || !!hikariCollabo.value?.fieldSurveyRequirement,
)
const confirmationDisabled = computed(() => {
  const invalid = Object.values(inputValid.value).some(valid => !valid)
  const termsAgreed = isConfirmation.value && needAgreement.value && !agreed.value
  return (
    !editable.value ||
    invalid ||
    isEqual(inputData.value, originalData.value) ||
    termsAgreed ||
    serviceClosedDaysFetchFailed.value
  )
})

const needAgreement = computed(() => originalData.value.ipoeType === IpoeTypes.Normal && isWidePlan.value)

const showPhotographOption = computed(() => !!hikariCollabo.value?.constructionOption?.constructionResultReport)

const terminalId = computed(() => fletsSeparate.value?.terminalId || hikariCollabo.value?.terminalId)
const terminalIdLink = computed(() =>
  terminalId.value ? `/tenants/${tenantId.value}/terminals/${terminalId.value}` : '',
)

const requestTypeText = computed(() => {
  if (isFletsSeparate.value) {
    return t('ipoes.fletsSeparate')
  } else if (isHikariCollabo.value) {
    // HikariCollabo の場合は fletsOrderType から直接生成（migrate は new と同じ表示）
    const fletsOrderType = hikariCollabo.value?.fletsOrderType
    const key = fletsOrderType === FletsOrderTypes.Migrate ? FletsOrderTypes.New : fletsOrderType
    return key ? t(`ipoes.${key}`) : ''
  } else {
    return ''
  }
})

const { getOrderIdLink, orderStatusTypeTranslation } = useOrders()
const orderId = computed(() => fletsSeparate.value?.orderId || hikariCollabo.value?.orderId)
const orderIdLink = computed(() => getOrderIdLink({ tenantId: tenantId.value, orderId: orderId.value }))

const submit = computed(() => {
  const click = isConfirmation.value ? handleSubmit : switchConfirm
  const text = isConfirmation.value ? t('common.save') : t('common.confirm')
  return { click, text }
})

const switchConfirm = () => (isConfirmation.value = !isConfirmation.value)
const handleSubmit = async () => {
  const onSiteRepairOption = inputData.value.onSiteRepairOption === 'true'
  await updateIpoe(ipoeId.value, isFletsSeparate.value, {
    customerNote: inputData.value.customerNote,
    ipoeType: isSuperWide.value ? undefined : (inputData.value.ipoeType as IpoeType),
    appControl: inputData.value.appControl === 'true',
    onSiteRepairOption: !onSiteRepairOptionDisabled.value ? onSiteRepairOption : undefined,
    changeEffectiveDate: inputData.value.changeEffectiveDate || undefined,
  })
  // 更新に成功した時は直前の画面（詳細）に戻る
  navigationGuard(false)
  router.back()
}

const handleIpoeTypeChange = (value: string) => {
  inputData.value.ipoeType = value
  inputData.value.appControl = 'false'
}
const handleOnSiteRepairOptionChange = (value: string) => {
  inputData.value.changeEffectiveDate = ''
  inputValid.value.changeEffectiveDate = originalData.value.onSiteRepairOption === value
}

const ipoeOrderStatus = computed(() => hikariCollabo.value?.orderStatus || fletsSeparate.value?.orderStatus)

watch(isConfirmation, () => window.scrollTo({ top: 0, behavior: 'smooth' }))
onBeforeMount(async () => {
  getAllSummaryIpoeList()
  checkAvailableTime()
  getContractor()
  await getIpoe(ipoeId.value)
  if (isHikariCollabo.value) {
    getServiceClosedDays(ServiceClosedDaysServiceTypes.HikariCollabo)
  }
})
</script>

<template>
  <CardContainer>
    <div v-if="isConfirmation" class="mb-5">
      {{ t('confirm.update') }}
    </div>
    <InnerCard :title="t('sideBar.ipoes')">
      <DetailGrid>
        <div>{{ t('ipoes.ipoeId') }}</div>
        <div>{{ hikariCollabo?.ipoeId || fletsSeparate?.ipoeId }}</div>
      </DetailGrid>
      <InputGrid required :label="t('ipoes.customerNote')">
        <InputForm
          v-model="inputData.customerNote"
          :rules="[rules.customerNote, rules.duplicateCustomerNote(customerNoteList, ipoeId)]"
          required
          maxlength="64"
          :placeholder="isFletsSeparate ? '東京本社A館フレッツ光ファミリー' : '東京本社A館光回線ファミリータイプ'"
          :disabled="isConfirmation"
          data-cy="ipoes-id-edit-customer-note"
          @valid="(valid: boolean) => (inputValid.customerNote = valid)"
        />
      </InputGrid>
      <DetailGrid>
        <div>{{ t('ipoes.requestType') }}</div>
        <div>{{ requestTypeText }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.ipv4Address') }}</div>
        <div>{{ hikariCollabo?.ipv4Address || fletsSeparate?.ipv4Address }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.fletsId') }}</div>
        <div>{{ hikariCollabo?.fletsId || fletsSeparate?.fletsId }}</div>
      </DetailGrid>
      <DetailGrid v-if="isFletsSeparate">
        <div>{{ t('ipoes.hikariPlan') }}</div>
        <div data-cy="ipoes-id-edit-hikari-plan">{{ getHikariPlanText(fletsSeparate?.hikariPlan) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.terminalId') }}</div>
        <NuxtLink class="cursor-pointer" :to="terminalIdLink">{{ terminalId }}</NuxtLink>
      </DetailGrid>
      <InputGrid v-if="!!originalData.ipoeType && !isSuperWide" required :label="t('ipoes.ipoeType')">
        <SelectForm
          :model-value="inputData.ipoeType"
          required
          :options="ipoeTypeOptions"
          :placeholder="ipoeTypeOptions[0]?.text"
          :disabled="isConfirmation"
          data-cy="ipoes-id-edit-ipoe-type"
          @valid="(valid: boolean) => (inputValid.ipoeType = valid)"
          @update:model-value="handleIpoeTypeChange"
        />
      </InputGrid>
      <DetailGrid v-else>
        <div>{{ t('ipoes.ipoeType') }}</div>
        <div data-cy="ipoes-id-edit-ipoe-type-text">{{ getIpoeTypeText(originalData.ipoeType) }}</div>
      </DetailGrid>
      <InputGrid
        v-if="showAppControlInput"
        class="mt-2 mb-3"
        required
        :label="t('ipoes.appControl')"
        :help-option="{ icon: IconTypes.Alert, color: 'warning' }"
      >
        <template #help>
          <i18n-t keypath="ipoes.help.appControl" tag="span" scope="global" class="text-pre-wrap">
            <template #linkText>
              <NuxtLink :to="IPOE_LINK.PRICE_LIST" target="_blank">
                {{ t('common.here') }}
              </NuxtLink>
            </template>
          </i18n-t>
        </template>
        <RadioForm
          v-model="inputData.appControl"
          required
          :options="existOptions"
          :disabled="isConfirmation"
          data-cy="ipoes-id-edit-app-control"
          @valid="(valid: boolean) => (inputValid.appControl = valid)"
        />
      </InputGrid>
      <DetailGrid>
        <div>{{ t('ipoes.ref') }}</div>
        <div>{{ hikariCollabo?.ref || fletsSeparate?.ref }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.resourceStatus') }}</div>
        <div>{{ hikariCollabo?.resourceStatus || fletsSeparate?.resourceStatus }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.orderId') }}</div>
        <NuxtLink class="cursor-pointer" :to="orderIdLink">{{ orderId }}</NuxtLink>
      </DetailGrid>
      <DetailGrid v-if="ipoeOrderStatus">
        <div>{{ t('details.orderStatus') }}</div>
        <div>{{ orderStatusTypeTranslation[ipoeOrderStatus] }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.creationTime') }}</div>
        <div>{{ formatDateTime(hikariCollabo?.creationTime || fletsSeparate?.creationTime) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.updateTime') }}</div>
        <div>{{ formatDateTime(hikariCollabo?.updateTime || fletsSeparate?.updateTime) }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('details.serviceStartTime') }}</div>
        <div>{{ formatDateTime(hikariCollabo?.serviceStartTime || fletsSeparate?.serviceStartTime) }}</div>
      </DetailGrid>
    </InnerCard>

    <InnerCard :title="requestTypeText">
      <template v-if="isFletsSeparate">
        <DetailGrid>
          <div>{{ t('ipoes.accessKey') }}</div>
          <div>{{ fletsSeparate?.accessKey }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.ipoeApplicationDate') }}</div>
          <div>{{ fletsSeparate?.ipoeApplicationDate }}</div>
        </DetailGrid>
      </template>
      <template v-else-if="isHikariCollabo">
        <DetailGrid>
          <div>{{ t('ipoes.addressCode') }}</div>
          <div>{{ hikariCollabo?.installationPlaceCode }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.postalCode') }}</div>
          <div>{{ hikariCollabo?.postalCode }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.address') }}</div>
          <div>{{ hikariCollabo?.address }}</div>
        </DetailGrid>
        <InputGrid :label="t('ipoes.onSiteRepairOption')">
          <RadioForm
            v-model="inputData.onSiteRepairOption"
            :options="existOptions"
            :disabled="onSiteRepairOptionInputDisabled"
            data-cy="ipoes-id-edit-on-site-repair-option"
            @valid="(valid: boolean) => (inputValid.onSiteRepairOption = valid)"
            @update:model-value="handleOnSiteRepairOptionChange"
          />
          <div v-if="overAvailableTime" class="pt-2 text-warning">
            {{ t('ipoes.message.outsideReceptionHour') }}
          </div>
          <i18n-t
            v-else-if="emptyAddressCode"
            tag="div"
            keypath="ipoes.message.addressCodeRequired"
            scope="global"
            class="pt-2 text-warning"
          >
            <template #contractor>
              <NuxtLink :to="`/tenants/${tenantId}/contracts/contractor`" class="text-warning">
                {{ t('sideBar.contractor') }}
              </NuxtLink>
            </template>
          </i18n-t>
        </InputGrid>
        <InputGrid v-if="showChangeEffectiveDate" required :label="t('ipoes.changeEffectiveDate')">
          <DatePicker
            v-model="inputData.changeEffectiveDate"
            :min-date="minDate"
            :disabled="onSiteRepairOptionInputDisabled || serviceClosedDaysFetchFailed"
            :disabled-dates="disabledDates"
            required
            data-cy="ipoes-id-edit-change-effective-date"
            @valid="(valid: boolean) => (inputValid.changeEffectiveDate = valid)"
          />
        </InputGrid>
      </template>
    </InnerCard>

    <InnerCard :title="t('ipoes.fletsInformation')">
      <template v-if="isFletsSeparate">
        <DetailGrid>
          <div>{{ t('ipoes.fletsOpen') }}</div>
          <div>{{ getFletsOpenText(fletsSeparate?.fletsOpen) }}</div>
        </DetailGrid>
        <DetailGrid v-if="!fletsSeparate?.fletsOpen">
          <div>{{ t('ipoes.fletsOpenDate') }}</div>
          <div>{{ fletsSeparate?.fletsOpenDate }}</div>
        </DetailGrid>
      </template>
      <template v-else-if="isHikariCollabo">
        <DetailGrid>
          <div>{{ t('ipoes.fletsType') }}</div>
          <div>{{ getFletsTypeText(hikariCollabo?.fletsType) }}</div>
        </DetailGrid>
      </template>
      <template v-if="isFletsSeparate">
        <DetailGrid>
          <div>{{ t('ipoes.contractorName') }}</div>
          <div>{{ fletsSeparate?.originContractor?.name }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.contractorNameKana') }}</div>
          <div>{{ fletsSeparate?.originContractor?.nameKana }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.contractorPhoneNumber') }}</div>
          <div>{{ fletsSeparate?.originContractor?.phoneNumber }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.contractorPostalCode') }}</div>
          <div>{{ fletsSeparate?.originContractor?.postalCode }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.contractorMailAddress') }}</div>
          <div>{{ fletsSeparate?.originContractor?.mailAddress }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.installationPlacePhoneNumber') }}</div>
          <div>{{ fletsSeparate?.installationPlace?.phoneNumber }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.installationPlacePostalCode') }}</div>
          <div>{{ fletsSeparate?.installationPlace?.postalCode }}</div>
        </DetailGrid>
      </template>
    </InnerCard>

    <InnerCard v-if="isFletsSeparate" :title="t('ipoes.applicant')">
      <DetailGrid>
        <div>{{ t('ipoes.applicantName') }}</div>
        <div>{{ fletsSeparate?.applicant?.name }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.applicantNameKana') }}</div>
        <div>{{ fletsSeparate?.applicant?.nameKana }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.applicantPhoneNumber') }}</div>
        <div>{{ fletsSeparate?.applicant?.phoneNumber }}</div>
      </DetailGrid>
      <DetailGrid>
        <div>{{ t('ipoes.applicantMailAddress') }}</div>
        <div>{{ fletsSeparate?.applicant?.mailAddress }}</div>
      </DetailGrid>
    </InnerCard>
    <template v-if="isHikariCollabo">
      <InnerCard :title="t('ipoes.constructionOption')">
        <DetailGrid>
          <div>{{ t('ipoes.siteRouteSurvey') }}</div>
          <div>{{ getExistText(hikariCollabo?.constructionOption?.siteRouteSurvey) }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.lineConfirmation') }}</div>
          <div>{{ getExistText(hikariCollabo?.constructionOption?.lineConfirmation) }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.wiringRouteConstruction') }}</div>
          <div>{{ getExistText(hikariCollabo?.constructionOption?.wiringRouteConstruction) }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.constructionResultReport') }}</div>
          <div>{{ getExistText(hikariCollabo?.constructionOption?.constructionResultReport) }}</div>
        </DetailGrid>
        <template v-if="showPhotographOption">
          <DetailGrid>
            <div>{{ t('ipoes.photographConsent') }}</div>
            <div>{{ getExistText(hikariCollabo?.constructionOption?.photographConsent) }}</div>
          </DetailGrid>
          <DetailGrid>
            <div>{{ t('ipoes.photographConsentName') }}</div>
            <div>{{ hikariCollabo?.constructionOption?.photographConsentName }}</div>
          </DetailGrid>
        </template>
        <DetailGrid>
          <div>{{ t('ipoes.specifiedVisitDateTime') }}</div>
          <div>{{ getExistText(hikariCollabo?.constructionOption?.specifiedVisitDateTime) }}</div>
        </DetailGrid>
      </InnerCard>

      <InnerCard :title="t('ipoes.fieldSurveyInfo')">
        <DetailGrid>
          <div>{{ t('ipoes.fieldSurveyRequirement') }}</div>
          <div>{{ getNecessaryText(showFieldSurveyInfo) }}</div>
        </DetailGrid>
        <template v-if="!!showFieldSurveyInfo">
          <DetailGrid>
            <div>{{ t('ipoes.fieldSurveyDate') }}</div>
            <div>{{ formatDate(hikariCollabo?.fieldSurvey?.date) }}</div>
          </DetailGrid>
          <DetailGrid>
            <div>{{ t('ipoes.fieldSurveyTime') }}</div>
            <div>{{ getTimeText(hikariCollabo?.fieldSurvey?.time) }}</div>
          </DetailGrid>
          <DetailGrid>
            <div>{{ t('ipoes.workerCompanyName') }}</div>
            <div>{{ hikariCollabo?.fieldSurvey?.workerCompanyName }}</div>
          </DetailGrid>
          <DetailGrid>
            <div>{{ t('ipoes.workerCompanyPhoneNumber') }}</div>
            <div>{{ hikariCollabo?.fieldSurvey?.workerCompanyPhoneNumber }}</div>
          </DetailGrid>
          <DetailGrid>
            <div>{{ t('ipoes.workerResponsiblePersonName') }}</div>
            <div>{{ hikariCollabo?.fieldSurvey?.workerResponsiblePersonName }}</div>
          </DetailGrid>
          <DetailGrid>
            <div>{{ t('ipoes.admissionApplicationInfo') }}</div>
            <div>{{ getAdmissionApplicationInfoText(hikariCollabo?.fieldSurvey?.admissionApplicationInfo) }}</div>
          </DetailGrid>
          <DetailGrid>
            <div>{{ t('ipoes.companyName') }}</div>
            <div>{{ hikariCollabo?.fieldSurvey?.attendanceCompanyName }}</div>
          </DetailGrid>
          <DetailGrid>
            <div>{{ t('ipoes.departmentName') }}</div>
            <div>{{ hikariCollabo?.fieldSurvey?.attendanceDepartmentName }}</div>
          </DetailGrid>
          <DetailGrid>
            <div>{{ t('ipoes.personName') }}</div>
            <div>{{ hikariCollabo?.fieldSurvey?.attendancePersonName }}</div>
          </DetailGrid>
          <DetailGrid>
            <div>{{ t('ipoes.personNameKana') }}</div>
            <div>{{ hikariCollabo?.fieldSurvey?.attendancePersonNameKana }}</div>
          </DetailGrid>
          <DetailGrid>
            <div>{{ t('ipoes.phoneNumber') }}</div>
            <div>{{ hikariCollabo?.fieldSurvey?.attendancePhoneNumber }}</div>
          </DetailGrid>
        </template>
      </InnerCard>

      <InnerCard :title="t('ipoes.constructionInfo')">
        <DetailGrid>
          <div>{{ t('ipoes.constructionDate') }}</div>
          <div>{{ formatDate(hikariCollabo?.construction?.date) }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.constructionTime') }}</div>
          <div>{{ getTimeText(hikariCollabo?.construction?.time) }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.workerCompanyName') }}</div>
          <div>{{ hikariCollabo?.construction?.workerCompanyName }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.workerCompanyPhoneNumber') }}</div>
          <div>{{ hikariCollabo?.construction?.workerCompanyPhoneNumber }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.workerResponsiblePersonName') }}</div>
          <div>{{ hikariCollabo?.construction?.workerResponsiblePersonName }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.admissionApplicationInfo') }}</div>
          <div>{{ getAdmissionApplicationInfoText(hikariCollabo?.construction?.admissionApplicationInfo) }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.companyName') }}</div>
          <div>{{ hikariCollabo?.construction?.attendanceCompanyName }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.departmentName') }}</div>
          <div>{{ hikariCollabo?.construction?.attendanceDepartmentName }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.personName') }}</div>
          <div>{{ hikariCollabo?.construction?.attendancePersonName }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.personNameKana') }}</div>
          <div>{{ hikariCollabo?.construction?.attendancePersonNameKana }}</div>
        </DetailGrid>
        <DetailGrid>
          <div>{{ t('ipoes.phoneNumber') }}</div>
          <div>{{ hikariCollabo?.construction?.attendancePhoneNumber }}</div>
        </DetailGrid>
      </InnerCard>
    </template>

    <HikariCollaboTermsOfService v-if="isConfirmation && needAgreement" v-model="agreed" />

    <div class="flex-flex-end-center pt-2">
      <CancelButton
        v-model:is-confirmation="isConfirmation"
        data-cy="ipoes-id-edit-cancel-button"
        @cancel="router.back()"
      />
      <CustomButton
        class="ml-6"
        icon="right-arrow"
        :text="submit.text"
        :width="180"
        :disabled="confirmationDisabled || loading"
        data-cy="ipoes-id-edit-submit-button"
        @click="submit.click"
      />
    </div>
  </CardContainer>
</template>
