<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { CONTRACTOR_LINK } from '@/api/contractor/constants'
import { IconTypes } from '@/components/icons/constants'

const { t } = useI18n()
const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)

const { contractor, getContractor } = useGetContractor()
getContractor()

const moveToEdit = async () => {
  await navigateTo({ path: `/tenants/${tenantId.value}/contracts/contractor/edit` })
}
</script>

<template>
  <CardContainer>
    <div class="flex-flex-start-center mb-3">
      <SvgIcon class="pt-1" :type="IconTypes.Contractor" color="secondary" />
      <div class="flex-flex-start-center">
        <div class="flex-grow-1 ml-2 text-lg">{{ `${t('sideBar.contractor')}` }}</div>
        <HelpTooltip class="px-2 pt-1" size="smallMiddle">
          <NuxtLink :to="CONTRACTOR_LINK" target="_blank">{{ CONTRACTOR_LINK }}</NuxtLink>
        </HelpTooltip>
      </div>
    </div>
    <InnerCard>
      <ContractorDetail :contractor="contractor" :tenant-id="tenantId" />
    </InnerCard>
    <div class="flex-flex-end-center pt-2">
      <CustomButton
        icon="right-arrow"
        :text="t('common.edit')"
        :width="180"
        data-cy="contracts-contractor-index-edit-button"
        @click="moveToEdit()"
      />
    </div>
  </CardContainer>
</template>
