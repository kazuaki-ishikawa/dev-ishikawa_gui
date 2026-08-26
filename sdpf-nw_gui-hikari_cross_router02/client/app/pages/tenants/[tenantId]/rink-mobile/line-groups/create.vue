<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { MAX_LINE_GROUP_COUNTS } from '@/api/rinkLineGroups/constants'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const rules = useRules()
const { loading } = useLoading()
const { navigationGuard } = useNavigationGuard()
navigationGuard(true)

const { createRinkLineGroup } = useCreateRinkLineGroup()
const { customerNoteList, getRinkLineGroupList } = useGetRinkLineGroupList()
const { duringReceptionHours } = useRinkConnections()

const isConfirmation = ref(false)
const lineGroupName = ref('')
const inputValid = ref(false)

const rinkMobileId = computed(() => route.query.rinkMobileId as string)
const submit = computed(() => {
  const click = isConfirmation.value ? handleSave : () => (isConfirmation.value = true)
  const text = isConfirmation.value ? t('common.create') : t('common.confirm')
  return { click, text }
})
const submitDisabled = computed(() => {
  return (
    !duringReceptionHours.value ||
    !inputValid.value ||
    customerNoteList.value.length >= MAX_LINE_GROUP_COUNTS ||
    loading.value
  )
})

const handleSave = async () => {
  await createRinkLineGroup(rinkMobileId.value, { lineGroupName: lineGroupName.value })
  navigationGuard(false)
  router.back()
}

onBeforeMount(() => getRinkLineGroupList(rinkMobileId.value))
</script>

<template>
  <CardContainer>
    <div v-if="isConfirmation">{{ t('confirm.create') }}</div>
    <div
      v-if="!duringReceptionHours"
      class="mb-2 text-warning text-pre-wrap"
      data-cy="rink-mobile-line-groups-create-outside-reception-hour"
    >
      {{ t('rinkConnections.message.outsideReceptionHour') }}
    </div>
    <InnerCard>
      <InputGrid required :label="t('rinkLineGroups.lineGroupName')">
        <InputForm
          v-model="lineGroupName"
          required
          :placeholder="t('rinkLineGroups.lineGroupName')"
          maxlength="64"
          :rules="[rules.noHalfwidthSymbols, rules.duplicateCustomerNote(customerNoteList)]"
          :disabled="isConfirmation"
          data-cy="rink-mobile-line-groups-create-line-group-name"
          @valid="(valid: boolean) => (inputValid = valid)"
        />
      </InputGrid>
    </InnerCard>

    <div class="flex-flex-end-center">
      <CancelButton
        v-model:is-confirmation="isConfirmation"
        class="mr-6"
        data-cy="rink-mobile-line-groups-create-cancel-button"
        @cancel="router.back()"
      />
      <CustomButton
        icon="right-arrow"
        :disabled="submitDisabled"
        :width="180"
        :text="submit.text"
        data-cy="rink-mobile-line-groups-create-submit-button"
        @click="submit.click"
      />
    </div>
  </CardContainer>
</template>
