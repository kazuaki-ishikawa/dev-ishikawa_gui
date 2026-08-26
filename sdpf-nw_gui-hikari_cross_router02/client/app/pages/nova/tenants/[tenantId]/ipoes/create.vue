<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ResourceStatusTypes } from '@/api/constants'
import { IPOE_LINK, RequestTypes } from '@/api/ipoes/constants'
import type { ErrorResponse } from '@/api/types'
import type { RequestType } from '@/api/ipoes/types'
import { FletsSeparateSteps, HikariCollaboSteps } from '@/components/nova/ipoes/constants'
import { RouteName } from '@/route/constants'

definePageMeta({
  name: RouteName.Ipoe.Create,
})

const { t } = useI18n()
const { navigationGuard } = useNavigationGuard()
const { setApiErrorMessageState } = useApiErrorDialog()

const { getAllSummaryIpoeList, customerNoteList } = useGetAllSummaryIpoeList()

const requestType = ref<RequestType>(RequestTypes.FletsSeparate)
const step = ref<number>(FletsSeparateSteps.RequestType)
const isComplete = computed(() =>
  requestType.value === RequestTypes.FletsSeparate
    ? step.value === FletsSeparateSteps.Complete
    : step.value === HikariCollaboSteps.Complete,
)

watchEffect(() => navigationGuard(!isComplete.value))
watch(step, () => window.scrollTo({ top: 0, behavior: 'smooth' }))

const fletsSeparateStepItems = [
  { title: t('nova.ipoes.step.requestType'), value: FletsSeparateSteps.RequestType },
  { title: t('nova.ipoes.step.input'), value: FletsSeparateSteps.Input },
  { title: t('nova.common.confirm'), value: FletsSeparateSteps.Confirm },
  { title: t('nova.common.complete'), value: FletsSeparateSteps.Complete },
]
const hikariCollaboStepItems = [
  { title: t('nova.ipoes.step.requestType'), value: HikariCollaboSteps.RequestType },
  { title: t('nova.ipoes.step.area'), value: HikariCollaboSteps.Area },
  { title: t('nova.ipoes.step.basicInformation'), value: HikariCollaboSteps.Input },
  { title: t('nova.ipoes.step.paidConstructionOption'), value: HikariCollaboSteps.Construction },
  { title: t('nova.common.confirm'), value: HikariCollaboSteps.Confirm },
  { title: t('nova.common.complete'), value: HikariCollaboSteps.Complete },
]
const stepItems = computed(() =>
  requestType.value === RequestTypes.FletsSeparate ? fletsSeparateStepItems : hikariCollaboStepItems,
)

const contractTypeOptions = computed(() => [
  {
    text: t('nova.ipoes.applicationType.fletsSeparate'),
    value: RequestTypes.FletsSeparate,
    help: t('nova.ipoes.note.fletsSeparate'),
  },
  {
    text: t('nova.ipoes.applicationType.hikariCollabo'),
    value: RequestTypes.HikariCollabo,
    help: t('nova.ipoes.note.hikariCollabo'),
  },
])

const moveToIpoeList = () =>
  navigateTo({
    name: RouteName.Ipoe.List,
    query: { resourceStatus: [ResourceStatusTypes.Active, ResourceStatusTypes.Inactive] },
  })

onBeforeMount(async () => {
  try {
    await getAllSummaryIpoeList()
  } catch (error) {
    setApiErrorMessageState({
      apiType: 'fletsSeparate',
      message: `${t('message.failed')}\n${errorFormat(error as ErrorResponse)}`,
    })
  }
})
</script>

<template>
  <div>
    <NovaPageHeader />
    <NovaCustomStepper v-model="step" :steps="stepItems" class="mt-6" />
    <template v-if="step === FletsSeparateSteps.RequestType">
      <v-card flat rounded="md" class="mt-6">
        <NovaCardTitleWithBorder :title="t('nova.ipoes.applicationDetail')" />
        <v-card-item>
          <NovaInputGrid required :label="t('nova.ipoes.contractType')">
            <template #help>
              <i18n-t keypath="nova.ipoes.help.contractType" scope="global">
                <template #flets>
                  <NuxtLink :to="IPOE_LINK.FLETS" target="_blank">
                    {{ t('nova.common.here') }}
                  </NuxtLink>
                </template>
                <template #fiber>
                  <NuxtLink :to="IPOE_LINK.FIBER" target="_blank">
                    {{ t('nova.common.here') }}
                  </NuxtLink>
                </template>
              </i18n-t>
            </template>
            <NovaRadioCardForm v-model="requestType" :input-props="{ options: contractTypeOptions }" />
          </NovaInputGrid>
        </v-card-item>
      </v-card>
      <div class="flex-center-center ga-6 py-4">
        <NovaCustomButton outlined @click="moveToIpoeList">{{ t('nova.common.cancel') }}</NovaCustomButton>
        <NovaCustomButton @click="() => step++">
          {{ t('nova.common.next') }}
        </NovaCustomButton>
      </div>
    </template>

    <NovaFletsSeparateCreate
      v-else-if="requestType === RequestTypes.FletsSeparate && step !== FletsSeparateSteps.RequestType"
      :step="step"
      :customer-note-list="customerNoteList"
      @update:step="(value: number) => (step = value)"
      @move-to-list="moveToIpoeList"
    />
    <NovaHikariCollaboCreate
      v-else-if="requestType === RequestTypes.HikariCollabo && step !== HikariCollaboSteps.RequestType"
    />
  </div>
</template>
