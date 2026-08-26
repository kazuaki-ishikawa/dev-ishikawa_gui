<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { IconTypes } from '@/components/icons/constants'
import { CONTRACTOR_LINK } from '@/api/contractor/constants'
import type { ContractorPutRequest } from '@/api/contractor/types'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.tenantId as string)

const { contractor, getContractor } = useGetContractor()
const { updateContractor } = useUpdateContractor(false)

const handleSubmit = async (request: ContractorPutRequest) => {
  await updateContractor(request)
  router.back()
}
onBeforeMount(() => {
  getContractor()
})
</script>

<template>
  <CardContainer>
    <div class="flex-flex-start-center mb-3">
      <SvgIcon class="pt-1" :type="IconTypes.Contractor" color="secondary" />
      <div class="flex-flex-start-center">
        <div class="flex-grow-1 ml-2 text-lg">{{ t('sideBar.contractor') }}</div>
        <HelpTooltip class="px-2 pt-1" size="smallMiddle">
          <NuxtLink :to="CONTRACTOR_LINK" target="_blank">{{ CONTRACTOR_LINK }}</NuxtLink>
        </HelpTooltip>
      </div>
    </div>
    <ContractorSettings
      :tenant-id="tenantId"
      :confirm-text="t('confirm.update')"
      :submit-label="t('common.save')"
      :submit-width="180"
      show-cancel
      :original="contractor"
      @submit="handleSubmit"
      @cancel="router.back()"
    />
  </CardContainer>
</template>
