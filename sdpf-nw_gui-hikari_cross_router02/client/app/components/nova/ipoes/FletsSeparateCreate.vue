<script setup lang="ts">
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { HikariPlanTypes, IPOE_LINK, IpoeTypes, initialFletsSeparateInputData } from '@/api/ipoes/constants'
import type { FletsSeparatePostRequest, HikariPlanType, IpoeType } from '@/api/ipoes/types'
import { FletsSeparateSteps } from '@/components/nova/ipoes/constants'
import { RouteName } from '@/route/constants'

type PropType = {
  step: number
  customerNoteList: Array<{ id: string; customerNote: string }>
}
type Emits = {
  (e: 'update:step', step: number): void
  (e: 'moveToList'): void
}
const props = defineProps<PropType>()
const emits = defineEmits<Emits>()

const { t } = useI18n()
const { loading } = useLoading()
const route = useRoute()
const rules = useRules()
const tenantId = computed(() => route.params.tenantId as string)
const orderId = computed(() => fletsSeparateResponse.value?.orderId)

const { fletsSeparateResponse, createFletsSeparate } = useCreateFletsSeparate()

const buttonLabels = computed(() => {
  switch (props.step) {
    case FletsSeparateSteps.Input:
      return {
        prev: t('nova.common.cancel'),
        next: t('nova.common.reviewApplicationDetails'),
      }
    case FletsSeparateSteps.Confirm:
      return {
        prev: t('nova.common.return'),
        next: t('nova.common.officialApply'),
      }
    case FletsSeparateSteps.Complete:
      return {
        prev: t('nova.ipoes.moveToList'),
        next: t('nova.common.moveToOrderDetail'),
      }
    default:
      return { prev: '', next: '' }
  }
})
const disabled = computed(() => {
  switch (props.step) {
    case FletsSeparateSteps.Input:
      return !formValid.value || !customerInformationValid.value || loading.value
    case FletsSeparateSteps.Confirm:
      return (isWide.value && !widePlanTermsAgreed.value) || loading.value
    case FletsSeparateSteps.Complete:
      return !orderId.value || loading.value
    default:
      return true
  }
})

const hikariPlanOptions = computed(() => [
  { text: t('nova.ipoes.hikariPlanNext'), value: HikariPlanTypes.Next },
  { text: t('nova.ipoes.hikariPlanCross'), value: HikariPlanTypes.Cross },
])
const ipoeTypeOptions = computed(() => {
  if (inputData.value.hikariPlan === HikariPlanTypes.Cross) {
    return [
      {
        text: t('nova.ipoes.superWidePlan'),
        value: IpoeTypes.SuperWide,
        help: 'TODO: カード内の文言がfigmaに記載されていない',
      },
    ]
  }

  return [
    {
      text: t('nova.ipoes.normalPlan'),
      value: IpoeTypes.Normal,
      help: t('nova.ipoes.note.normalPlan'),
    },
    { text: t('nova.ipoes.widePlan'), value: IpoeTypes.Wide, help: t('nova.ipoes.note.widePlan') },
  ]
})
const appControlOptions = computed(() => [
  { text: t('nova.common.use'), value: 'true' },
  { text: t('nova.common.disuse'), value: 'false' },
])
const fletsOpenOptions = computed(() => [
  { text: t('nova.ipoes.opened'), value: 'true' },
  { text: t('nova.ipoes.unopened'), value: 'false' },
])

const inputData = ref(structuredClone(initialFletsSeparateInputData))
const formValid = ref(false)
const isConfirmation = computed(() => props.step === FletsSeparateSteps.Confirm)

const today = dayjs().format('YYYY-MM-DD')
const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')

const isWide = computed(() => [IpoeTypes.Wide, IpoeTypes.SuperWide].includes(inputData.value.ipoeType))
const widePlanTermsAgreed = ref(false)

const nameEmpty = computed(
  () =>
    !inputData.value.applicant.name &&
    !inputData.value.applicant.nameKana &&
    !inputData.value.originContractor.name &&
    !inputData.value.originContractor.nameKana,
)
const postalCodeEmpty = computed(
  () => !inputData.value.originContractor.postalCode && !inputData.value.installationPlace.postalCode,
)
const contactEmpty = computed(
  () =>
    !inputData.value.applicant.phoneNumber &&
    !inputData.value.applicant.mailAddress &&
    !inputData.value.originContractor.phoneNumber &&
    !inputData.value.originContractor.mailAddress &&
    !inputData.value.installationPlace.phoneNumber,
)

const showCustomerInformation = computed(() => !inputData.value.fletsId || !inputData.value.accessKey)
const customerInformationValid = computed(() => {
  if (!showCustomerInformation.value) {
    return true
  }

  return inputData.value.fletsId
    ? !nameEmpty.value || !contactEmpty.value
    : !nameEmpty.value && !postalCodeEmpty.value && !contactEmpty.value
})
watch(showCustomerInformation, show => {
  if (!show) {
    inputData.value = {
      ...inputData.value,
      applicant: { ...initialFletsSeparateInputData.applicant },
      originContractor: { ...initialFletsSeparateInputData.originContractor },
      installationPlace: { ...initialFletsSeparateInputData.installationPlace },
    }
  }
})

const handleFletsOpenChange = () => {
  inputData.value.fletsOpenDate = ''
}
const handleHikariPlanChange = () => {
  inputData.value.ipoeType = ''
  inputData.value.appControl = ''
}
const handleIpoeTypeChange = () => {
  inputData.value.appControl = ''
}

const getRequest = () =>
  Object.entries(inputData.value).reduce<FletsSeparatePostRequest>(
    (request, [key, value]) => {
      if (typeof value === 'object' && Object.values(value).some(item => !!item)) {
        const customerInformation = Object.entries(value).reduce<Record<string, string>>(
          (information, [name, item]) => {
            if (item) {
              information[name] = item
            }
            return information
          },
          {},
        )
        Object.assign(request, { [key]: customerInformation })
      } else if (key === 'ipoeType') {
        Object.assign(request, { [key]: value as IpoeType })
      } else if (key === 'hikariPlan') {
        Object.assign(request, { [key]: value as HikariPlanType })
      } else if (key === 'appControl' && isWide.value && value) {
        Object.assign(request, { [key]: value === 'true' })
      } else if (key === 'fletsOpen' && value) {
        Object.assign(request, { [key]: value === 'true' })
      } else if (typeof value === 'string' && value) {
        Object.assign(request, { [key]: value })
      }
      return request
    },
    { customerNote: '', ipoeType: IpoeTypes.Normal, appControl: false, fletsOpen: true },
  )

const moveToOrderDetail = () => {
  if (!fletsSeparateResponse.value?.orderId) {
    return
  }

  return navigateTo({
    name: RouteName.Order.Detail,
    params: { tenantId: tenantId.value, id: fletsSeparateResponse.value.orderId },
    replace: true,
  })
}

const handlePrev = () => {
  switch (props.step) {
    case FletsSeparateSteps.Input:
      return emits('update:step', FletsSeparateSteps.RequestType)
    case FletsSeparateSteps.Confirm:
      widePlanTermsAgreed.value = false
      return emits('update:step', FletsSeparateSteps.Input)
    case FletsSeparateSteps.Complete:
      return emits('moveToList')
  }
}
const handleNext = async () => {
  switch (props.step) {
    case FletsSeparateSteps.Input:
      return emits('update:step', FletsSeparateSteps.Confirm)
    case FletsSeparateSteps.Confirm:
      try {
        await createFletsSeparate(getRequest())
        return emits('update:step', FletsSeparateSteps.Complete)
      } catch {
        // エラー通知は useCreateFletsSeparate 内で表示済み
        return
      }
    case FletsSeparateSteps.Complete:
      return moveToOrderDetail()
  }
}
</script>

<template>
  <div>
    <!-- お申し込み内容の入力 -->
    <v-form
      v-if="step === FletsSeparateSteps.Input || step === FletsSeparateSteps.Confirm"
      v-model="formValid"
      @submit.prevent
    >
      <v-card flat rounded="md" class="mt-6">
        <NovaCardTitleWithBorder
          :title="isConfirmation ? t('nova.applicationForNew.confirmTitle') : t('nova.applicationForNew.inputTitle')"
        >
          <div v-if="isConfirmation" class="text-body-medium text-pre-wrap">
            {{ t('nova.create.confirmDescription') }}
          </div>
        </NovaCardTitleWithBorder>

        <v-card-item>
          <NovaInputGrid required :label="t('nova.ipoes.hikariPlan')">
            <NovaRadioForm
              v-model="inputData.hikariPlan"
              :input-props="{ options: hikariPlanOptions, inline: false }"
              :is-confirmation="isConfirmation"
              @update:model-value="handleHikariPlanChange"
            />
          </NovaInputGrid>
          <NovaInputGrid required :label="t('nova.ipoes.plan')">
            <NovaRadioCardForm
              v-model="inputData.ipoeType"
              :input-props="{ options: ipoeTypeOptions }"
              :is-confirmation="isConfirmation"
              @update:model-value="handleIpoeTypeChange"
            >
              <template #title="{ option }">
                {{ option.text }}
                <NovaLightColorTag
                  v-if="option.value === IpoeTypes.Wide"
                  :label="t('nova.ipoes.campaignInProgress')"
                  class="ml-2"
                  color="primary"
                />
              </template>
            </NovaRadioCardForm>
            <NovaCautionCard
              v-if="!isConfirmation && inputData.hikariPlan !== HikariPlanTypes.Cross"
              :title="t('nova.ipoes.campaign.title')"
              color="secondary"
              icon="information"
              class="mt-2"
            >
              <span>{{ t('nova.ipoes.campaign.description1') }}</span>
              <span class="font-weight-bold">{{ t('nova.ipoes.campaign.description2') }}</span>
              <span>{{ t('nova.ipoes.campaign.description3') }}</span>
            </NovaCautionCard>
            <NovaCautionCard
              v-if="!isConfirmation"
              :title="t('nova.common.caution')"
              icon="alert-triangle"
              class="mt-2"
            >
              <i18n-t keypath="nova.ipoes.widePlanNotice" scope="global">
                <template #plan>
                  {{
                    inputData.hikariPlan === HikariPlanTypes.Cross
                      ? t('nova.ipoes.superWidePlan')
                      : t('nova.ipoes.widePlan')
                  }}
                </template>
                <template #linkText>
                  <NuxtLink :to="IPOE_LINK.PRICE" target="_blank">{{ t('nova.common.here') }}</NuxtLink>
                </template>
              </i18n-t>
            </NovaCautionCard>
          </NovaInputGrid>
          <NovaInputGrid v-if="isWide" required :label="t('nova.ipoes.widePlusForWebConference')" is-paid-option>
            <template #help>
              <i18n-t keypath="nova.ipoes.help.appControl" scope="global">
                <template #linkText>
                  <NuxtLink :to="IPOE_LINK.PRICE_LIST" target="_blank">{{ t('nova.common.here') }}</NuxtLink>
                </template>
              </i18n-t>
            </template>
            <NovaRadioForm
              v-model="inputData.appControl"
              :input-props="{ options: appControlOptions }"
              :is-confirmation="isConfirmation"
            />
          </NovaInputGrid>
        </v-card-item>
      </v-card>

      <v-card flat rounded="md" class="mt-4">
        <NovaCardTitleWithBorder :title="t('nova.details.basicInformation')" />
        <v-card-item>
          <NovaInputGrid required :label="t('nova.ipoes.accessCircuitName')">
            <NovaInputForm
              v-model="inputData.customerNote"
              :input-props="{
                placeholder: t('nova.ipoes.placeholder.customerNote'),
                width: '500px',
                rules: [rules.customerNote, rules.duplicateCustomerNote(customerNoteList)],
                required: true,
                maxLength: 64,
              }"
              :is-confirmation="isConfirmation"
            >
              <template #explanation>
                <div>{{ t('invalid.maxlength.none', { maxlength: 64 }) }}</div>
                <div>{{ t('invalid.duplicateCustomerNote') }}</div>
              </template>
            </NovaInputForm>
          </NovaInputGrid>
          <NovaInputGrid :label="t('nova.ipoes.fletsId')">
            <template #help>{{ t('nova.ipoes.help.fletsId') }}</template>
            <NovaInputForm
              v-model="inputData.fletsId"
              :input-props="{
                placeholder: t('nova.ipoes.placeholder.fletsId'),
                width: '400px',
                rules: [rules.fletsId],
                maxLength: 13,
              }"
              :is-confirmation="isConfirmation"
            >
              <template #explanation>{{ t('nova.ipoes.description.fletsId') }}</template>
            </NovaInputForm>
          </NovaInputGrid>
          <NovaInputGrid :label="t('nova.ipoes.accessKey')">
            <template #help>{{ t('nova.ipoes.help.accessKey') }}</template>
            <NovaInputForm
              v-model="inputData.accessKey"
              :input-props="{
                placeholder: t('nova.ipoes.placeholder.accessKey'),
                width: '400px',
                rules: [rules.accessKey],
                maxLength: 8,
              }"
              :is-confirmation="isConfirmation"
            >
              <template #explanation>{{ t('nova.ipoes.description.accessKey') }}</template>
            </NovaInputForm>
          </NovaInputGrid>
        </v-card-item>
      </v-card>

      <v-card flat rounded="md" class="mt-4">
        <NovaCardTitleWithBorder :title="t('nova.ipoes.aboutFletsInformation')" />
        <v-card-item>
          <NovaInputGrid :label="t('nova.ipoes.ipoeApplicationDate')">
            <template #help>{{ t('nova.ipoes.help.applicationDate') }}</template>
            <NovaDatePicker
              v-model="inputData.ipoeApplicationDate"
              :min-date="yesterday"
              :disabled="isConfirmation"
              width="400px"
            />
            <NovaCautionCard
              v-if="!isConfirmation"
              :title="t('nova.ipoes.applicationDateWarning.title')"
              icon="alert-triangle"
              class="mt-3"
            >
              <ul>
                <li>{{ t('nova.ipoes.applicationDateWarning.notice1') }}</li>
                <li>{{ t('nova.ipoes.applicationDateWarning.notice2') }}</li>
                <li>{{ t('nova.ipoes.applicationDateWarning.notice3') }}</li>
              </ul>
            </NovaCautionCard>
          </NovaInputGrid>
          <NovaInputGrid required :label="t('nova.ipoes.fletsOpen')">
            <template #help>{{ t('nova.ipoes.help.fletsOpen') }}</template>
            <NovaRadioForm
              v-model="inputData.fletsOpen"
              :input-props="{ options: fletsOpenOptions }"
              :is-confirmation="isConfirmation"
              @update:model-value="handleFletsOpenChange"
            />
          </NovaInputGrid>
          <NovaInputGrid v-if="inputData.fletsOpen === 'false'" required :label="t('nova.ipoes.fletsOpenDate')">
            <template #help>{{ t('nova.ipoes.help.fletsOpenDate') }}</template>
            <NovaDatePicker
              v-model="inputData.fletsOpenDate"
              required
              :min-date="today"
              :disabled="isConfirmation"
              width="400px"
            />
          </NovaInputGrid>
        </v-card-item>
      </v-card>

      <v-card v-if="showCustomerInformation" flat rounded="md" class="mt-4">
        <v-card-item>
          <div class="text-sm">
            <div class="mb-2">{{ t('nova.ipoes.message.customerInformationIntroduction') }}</div>
            <i18n-t
              keypath="nova.ipoes.message.customerInformationDescription"
              tag="div"
              scope="global"
              class="text-pre-wrap"
            >
              <template #linkText>
                <NuxtLink :to="IPOE_LINK.CUSTOMER_INFO" target="_blank">{{ t('nova.common.here') }}</NuxtLink>
              </template>
            </i18n-t>
          </div>
        </v-card-item>

        <NovaCardTitleWithBorder :title="t('nova.ipoes.customerInformation')" />
        <v-card-item>
          <div class="customer-information-section">{{ t('nova.ipoes.contractorApplicant') }}</div>
          <NovaInputGrid :label="t('nova.ipoes.contractorName')">
            <NovaInputForm
              v-model="inputData.originContractor.name"
              :input-props="{ placeholder: t('nova.placeholder.companyName'), width: '500px', maxLength: 64 }"
              :is-confirmation="isConfirmation"
            />
          </NovaInputGrid>
          <NovaInputGrid :label="t('nova.ipoes.contractorNameKana')">
            <NovaInputForm
              v-model="inputData.originContractor.nameKana"
              :input-props="{
                placeholder: t('nova.placeholder.companyNameKana'),
                width: '500px',
                rules: [rules.nameKana],
                maxLength: 128,
              }"
              :is-confirmation="isConfirmation"
            />
          </NovaInputGrid>
          <NovaInputGrid :label="t('nova.ipoes.applicantName')">
            <NovaInputForm
              v-model="inputData.applicant.name"
              :input-props="{
                placeholder: t('nova.placeholder.name'),
                width: '500px',
                rules: [rules.fullwidthSpace],
                maxLength: 41,
              }"
              :is-confirmation="isConfirmation"
            />
          </NovaInputGrid>
          <NovaInputGrid :label="t('nova.ipoes.applicantNameKana')">
            <NovaInputForm
              v-model="inputData.applicant.nameKana"
              :input-props="{
                placeholder: t('nova.placeholder.nameKana'),
                width: '500px',
                rules: [rules.nameKana, rules.fullwidthSpace],
                maxLength: 41,
              }"
              :is-confirmation="isConfirmation"
            />
          </NovaInputGrid>
        </v-card-item>

        <v-card-item>
          <div class="customer-information-section">{{ t('nova.ipoes.addressAndInstallationPlace') }}</div>
          <NovaInputGrid :label="t('nova.ipoes.contractorPostalCode')">
            <NovaInputForm
              v-model="inputData.originContractor.postalCode"
              :input-props="{
                placeholder: t('nova.placeholder.postalCode'),
                width: '400px',
                rules: [rules.postalCode],
                maxLength: 8,
              }"
              :is-confirmation="isConfirmation"
            />
          </NovaInputGrid>
          <NovaInputGrid :label="t('nova.ipoes.installationPlacePostalCode')">
            <NovaInputForm
              v-model="inputData.installationPlace.postalCode"
              :input-props="{
                placeholder: t('nova.placeholder.postalCode'),
                width: '400px',
                rules: [rules.postalCode],
                maxLength: 8,
              }"
              :is-confirmation="isConfirmation"
            />
          </NovaInputGrid>
        </v-card-item>

        <v-card-item>
          <div class="customer-information-section">{{ t('nova.ipoes.contact') }}</div>
          <NovaInputGrid :label="t('nova.ipoes.applicantPhoneNumber')">
            <NovaInputForm
              v-model="inputData.applicant.phoneNumber"
              :input-props="{
                placeholder: t('nova.ipoes.placeholder.phoneNumber'),
                width: '500px',
                rules: [rules.phoneNumber],
                maxLength: 13,
              }"
              :is-confirmation="isConfirmation"
            />
          </NovaInputGrid>
          <NovaInputGrid :label="t('nova.ipoes.contractorPhoneNumber')">
            <NovaInputForm
              v-model="inputData.originContractor.phoneNumber"
              :input-props="{
                placeholder: t('nova.ipoes.placeholder.phoneNumber'),
                width: '500px',
                rules: [rules.phoneNumber],
                maxLength: 13,
              }"
              :is-confirmation="isConfirmation"
            />
          </NovaInputGrid>
          <NovaInputGrid :label="t('nova.ipoes.installationPlacePhoneNumber')">
            <NovaInputForm
              v-model="inputData.installationPlace.phoneNumber"
              :input-props="{
                placeholder: t('nova.ipoes.placeholder.phoneNumber'),
                width: '500px',
                rules: [rules.phoneNumber],
                maxLength: 13,
              }"
              :is-confirmation="isConfirmation"
            />
          </NovaInputGrid>
          <NovaInputGrid :label="t('nova.ipoes.contractorMailAddress')">
            <NovaInputForm
              v-model="inputData.originContractor.mailAddress"
              :input-props="{
                placeholder: 'user@example.com',
                width: '500px',
                rules: [rules.mailAddress],
                maxLength: 60,
              }"
              :is-confirmation="isConfirmation"
            />
          </NovaInputGrid>
          <NovaInputGrid :label="t('nova.ipoes.applicantMailAddress')">
            <NovaInputForm
              v-model="inputData.applicant.mailAddress"
              :input-props="{
                placeholder: 'user@example.com',
                width: '500px',
                rules: [rules.mailAddress],
                maxLength: 60,
              }"
              :is-confirmation="isConfirmation"
            />
          </NovaInputGrid>
        </v-card-item>
      </v-card>
      <NovaWidePlanTermsOfService v-if="isConfirmation && isWide" v-model="widePlanTermsAgreed" class="mt-4" />
    </v-form>
    <v-card v-else-if="step === FletsSeparateSteps.Complete" flat rounded="md" class="mt-6">
      <NovaCardTitleWithBorder :title="t('nova.applicationForNew.completeTitle')">
        <NovaCardItemCompleted :order-id="orderId ?? ''" :message="t('nova.ipoes.message.complete')" />
        <div class="text-pre-wrap">{{ t('nova.applicationForNew.completeDescription') }}</div>
      </NovaCardTitleWithBorder>
    </v-card>
    <div class="flex-center-center ga-6 py-4">
      <NovaCustomButton outlined @click="handlePrev">{{ buttonLabels.prev }}</NovaCustomButton>
      <NovaCustomButton :disabled="disabled" @click="handleNext">
        {{ buttonLabels.next }}
      </NovaCustomButton>
    </div>
  </div>
</template>

<style scoped lang="scss">
$border-color: rgb(var(--v-theme-info-lighten-3));

.customer-information-section {
  padding-bottom: 8px;
  border-bottom: 2px solid $border-color;
  font-weight: 700;
}
</style>
