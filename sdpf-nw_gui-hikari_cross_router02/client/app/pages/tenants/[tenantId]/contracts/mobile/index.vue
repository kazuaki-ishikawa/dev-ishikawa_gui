<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { IconTypes } from '@/components/icons/constants'

const { t } = useI18n()
const route = useRoute()
const tenantId = computed(() => route.params.tenantId as string)

const { getMobile, mobile } = useGetMobile()
getMobile()

const moveToMobileTermsOfService = async () => {
  await navigateTo({ path: `/tenants/${tenantId.value}/contracts/mobile/mobile-terms-of-service` })
}
const moveToEdit = async () => {
  await navigateTo({ path: `/tenants/${tenantId.value}/contracts/mobile/edit` })
}
</script>

<template>
  <CardContainer>
    <div class="flex-flex-start-center mb-3">
      <SvgIcon class="pt-1" :type="IconTypes.Contractor" color="secondary" />
      <div class="flex-grow-1 ml-2 text-lg">{{ `${t('sideBar.mobile')}` }}</div>
      <CustomButton
        color="info"
        icon="right-arrow"
        :text="t('mobile.termsOfService')"
        :width="190"
        data-cy="contracts-mobile-index-terms-of-service-button"
        @click="moveToMobileTermsOfService()"
      />
    </div>
    <InnerCard>
      <MobileDetail :mobile="mobile" :tenant-id="tenantId" />
    </InnerCard>
    <div class="flex-flex-end-center pt-2">
      <CustomButton
        icon="right-arrow"
        :text="t('common.edit')"
        :width="180"
        :disabled="!!mobile?.mobileTermsOfServiceAccepted"
        data-cy="contracts-mobile-index-mobile-edit-button"
        @click="moveToEdit()"
      />
    </div>
  </CardContainer>
</template>
