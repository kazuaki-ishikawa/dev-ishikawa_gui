<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { initialBreakOutData, initialBreakOutValid } from '@/api/breakOut/constants'

const router = useRouter()

const { t } = useI18n()
const { loading } = useLoading()
const rules = useRules()

const { navigationGuard } = useNavigationGuard()
navigationGuard(true)

const { formatBreakOutPostRequest, lengthRule } = useBreakOut()
const { customerNoteList, getBreakOutList } = useGetBreakOutList()
const { createBreakOut } = useCreateBreakOut()

const inputData = ref(structuredClone(initialBreakOutData))
const inputValid = ref(structuredClone(initialBreakOutValid))
const isConfirmation = ref(false)

const request = computed(() => formatBreakOutPostRequest(inputData.value))
const length = computed(() => ({
  fqdnList: request.value.fqdnList?.length ?? 0,
  prefixList: request.value.prefixList?.length ?? 0,
  total: (request.value.fqdnList?.length ?? 0) + (request.value.prefixList?.length ?? 0),
}))
const disabled = computed(() => Object.values(inputValid.value).some(valid => !valid))

const handleSave = async () => {
  await createBreakOut(request.value)
  navigationGuard(false)
  router.back()
}

const submit = computed(() => {
  const click = isConfirmation.value ? handleSave : () => (isConfirmation.value = true)
  const text = isConfirmation.value ? t('common.create') : t('common.confirm')
  return { click, text }
})
onBeforeMount(() => {
  getBreakOutList()
})
</script>

<template>
  <CardContainer>
    <div v-if="isConfirmation" class="mb-2">
      {{ t('confirm.create') }}
    </div>
    <InnerCard :title="`${t('breakOut.title')} ${t('common.createNew')}`">
      <InputGrid required :label="t('breakOut.customerNote')" :help="t('breakOut.help.customerNote')">
        <InputForm
          v-model="inputData.customerNote"
          maxlength="64"
          required
          :placeholder="t('breakOut.placeholder.list')"
          :disabled="isConfirmation"
          :rules="[rules.customerNote, rules.duplicateCustomerNote(customerNoteList)]"
          data-cy="break-out-lists-create-customer-note"
          @valid="(valid: boolean) => (inputValid.customerNote = valid)"
        />
      </InputGrid>
      <InputGrid
        :label="t('breakOut.fqdnList')"
        :help="t('breakOut.help.fqdnList', { example: t('breakOut.placeholder.fqdnList') })"
      >
        <div class="flex-flex-start-flex-start">
          <TextareaForm
            v-model="inputData.fqdnList"
            :placeholder="t('breakOut.placeholder.fqdnList')"
            :disabled="isConfirmation"
            :rules="[lengthRule(length.total), rules.fqdnList]"
            :required="length.total === 0"
            data-cy="break-out-lists-create-fqdn-list"
            @valid="(valid: boolean) => (inputValid.fqdnList = valid)"
          />
          <div class="px-5">{{ length.fqdnList + t('breakOut.listUnit') }}</div>
        </div>
        <div class="text-sm pl-2">{{ t('breakOut.note.fqdnList') }}</div>
      </InputGrid>
      <InputGrid
        :label="t('breakOut.prefixList')"
        :help="t('breakOut.help.prefixList', { example: t('breakOut.placeholder.prefixList') })"
      >
        <div class="flex-flex-start-flex-start">
          <TextareaForm
            v-model="inputData.prefixList"
            :placeholder="t('breakOut.placeholder.prefixList')"
            :disabled="isConfirmation"
            :rules="[lengthRule(length.total), rules.prefixList]"
            :required="length.total === 0"
            data-cy="break-out-lists-create-prefix-list"
            @valid="(valid: boolean) => (inputValid.prefixList = valid)"
          />
          <div class="px-5">{{ length.prefixList + t('breakOut.listUnit') }}</div>
        </div>
      </InputGrid>
    </InnerCard>
    <div class="flex-flex-end-center pt-2">
      <CancelButton v-model:is-confirmation="isConfirmation" @cancel="router.back()" />
      <CustomButton
        class="ml-6"
        icon="right-arrow"
        :disabled="disabled || loading"
        :width="180"
        :text="submit.text"
        data-cy="break-out-lists-create-submit-button"
        @click="submit.click"
      />
    </div>
  </CardContainer>
</template>
